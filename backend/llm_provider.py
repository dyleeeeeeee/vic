"""
LLM provider abstraction with cascading credential resolution.

Resolution order:
1. AWS Bedrock via default credential chain (boto3 auto-resolves from
   env vars, ~/.aws/credentials, SSO session, instance profile, ECS task role)
2. ANTHROPIC_API_KEY environment variable (direct Anthropic API)
3. Per-agent api_key passed in AgentConfig (last resort)

The first method that successfully resolves credentials wins.
"""

import json
import logging
import os
from abc import ABC, abstractmethod
from typing import Any, Optional

logger = logging.getLogger("vic.llm")


class LLMProvider(ABC):
    @abstractmethod
    async def create_message(
        self,
        model: str,
        system: str,
        messages: list[dict],
        tools: list[dict],
        max_tokens: int = 4096,
    ) -> dict:
        """
        Returns a normalized response dict:
        {
            "content": [...],  # list of text/tool_use blocks
            "stop_reason": "end_turn" | "tool_use",
        }
        """
        ...


class BedrockProvider(LLMProvider):
    """Uses AWS Bedrock converse API via boto3 default credential chain."""

    def __init__(self, region: Optional[str] = None):
        import boto3
        self._region = region or os.environ.get("AWS_REGION", "us-east-1")
        self._client = boto3.client("bedrock-runtime", region_name=self._region)
        # Verify credentials resolve (fails fast if no creds)
        boto3.client("sts", region_name=self._region).get_caller_identity()
        logger.info(f"Bedrock provider ready (region={self._region})")

    async def create_message(
        self, model: str, system: str, messages: list[dict],
        tools: list[dict], max_tokens: int = 4096,
    ) -> dict:
        import asyncio

        converse_messages = self._convert_messages(messages)
        converse_tools = self._convert_tools(tools)

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: self._client.converse(
            modelId=model,
            system=[{"text": system}],
            messages=converse_messages,
            toolConfig={"tools": converse_tools},
            inferenceConfig={"maxTokens": max_tokens},
        ))

        return self._normalize_response(response)

    def _convert_messages(self, messages: list[dict]) -> list[dict]:
        out = []
        for msg in messages:
            role = msg["role"]
            content = msg["content"]

            if isinstance(content, str):
                out.append({"role": role, "content": [{"text": content}]})
            elif isinstance(content, list):
                blocks = []
                for block in content:
                    if hasattr(block, "model_dump"):
                        block = block.model_dump()
                    elif hasattr(block, "type"):
                        block = {"type": block.type, **{k: v for k, v in vars(block).items() if k != "type"}}

                    if isinstance(block, dict):
                        btype = block.get("type")
                        if btype == "text":
                            blocks.append({"text": block["text"]})
                        elif btype == "tool_use":
                            blocks.append({
                                "toolUse": {
                                    "toolUseId": block["id"],
                                    "name": block["name"],
                                    "input": block["input"],
                                }
                            })
                        elif btype == "tool_result":
                            blocks.append({
                                "toolResult": {
                                    "toolUseId": block["tool_use_id"],
                                    "content": [{"text": block["content"] if isinstance(block["content"], str) else json.dumps(block["content"])}],
                                }
                            })
                    else:
                        blocks.append({"text": str(block)})
                if blocks:
                    out.append({"role": role, "content": blocks})
            else:
                out.append({"role": role, "content": [{"text": str(content)}]})
        return out

    def _convert_tools(self, tools: list[dict]) -> list[dict]:
        return [
            {
                "toolSpec": {
                    "name": t["name"],
                    "description": t["description"],
                    "inputSchema": {"json": t["input_schema"]},
                }
            }
            for t in tools
        ]

    def _normalize_response(self, response: dict) -> dict:
        output = response.get("output", {})
        message = output.get("message", {})
        content_blocks = message.get("content", [])
        stop_reason = response.get("stopReason", "end_turn")

        normalized_content = []
        for block in content_blocks:
            if "text" in block:
                normalized_content.append(ContentBlock("text", text=block["text"]))
            elif "toolUse" in block:
                tu = block["toolUse"]
                normalized_content.append(ContentBlock(
                    "tool_use", id=tu["toolUseId"], name=tu["name"], input=tu["input"]
                ))

        stop_map = {"end_turn": "end_turn", "tool_use": "tool_use", "stop_sequence": "end_turn"}
        return {
            "content": normalized_content,
            "stop_reason": stop_map.get(stop_reason, "end_turn"),
        }


class AnthropicProvider(LLMProvider):
    """Direct Anthropic API via anthropic SDK."""

    def __init__(self, api_key: str):
        import anthropic
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        logger.info("Anthropic direct provider ready")

    async def create_message(
        self, model: str, system: str, messages: list[dict],
        tools: list[dict], max_tokens: int = 4096,
    ) -> dict:
        response = await self._client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system,
            tools=tools,
            messages=messages,
        )
        return {
            "content": response.content,
            "stop_reason": response.stop_reason,
        }


class ContentBlock:
    """Minimal content block that mirrors anthropic SDK's interface."""
    def __init__(self, type: str, **kwargs):
        self.type = type
        for k, v in kwargs.items():
            setattr(self, k, v)

    def model_dump(self) -> dict:
        d = {"type": self.type}
        for k, v in vars(self).items():
            if k != "type":
                d[k] = v
        return d


def resolve_provider(agent_api_key: Optional[str] = None) -> LLMProvider:
    """
    Resolve the best available LLM provider. Tries in order:
    1. AWS Bedrock (default credential chain)
    2. ANTHROPIC_API_KEY env var
    3. Per-agent api_key argument
    """
    # 1. Bedrock
    try:
        return BedrockProvider()
    except Exception as exc:
        logger.debug(f"Bedrock unavailable: {exc}")

    # 2. Server-side env var
    env_key = os.environ.get("ANTHROPIC_API_KEY")
    if env_key:
        logger.info("Using ANTHROPIC_API_KEY from environment")
        return AnthropicProvider(env_key)

    # 3. Per-agent key
    if agent_api_key:
        logger.info("Using per-agent API key (fallback)")
        return AnthropicProvider(agent_api_key)

    raise RuntimeError(
        "No LLM credentials found. Configure one of:\n"
        "  1. AWS credentials (aws configure / SSO / instance role)\n"
        "  2. ANTHROPIC_API_KEY environment variable\n"
        "  3. Per-agent api_key in config"
    )
