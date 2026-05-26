## Core UI / UX Concepts

### Isometric “AI Empire” Interface

Vic’s biggest differentiator is its **game-inspired orchestration UI**.

Instead of managing agents through:

* terminal tabs
* chat lists
* prompt chains
* task tables

…users manage them through an **isometric map**, inspired by games like:

* Civilization VI
* SimCity
* Factorio

The UI treats agents as:

* teams
* buildings
* workers
* departments
* “AI org units”

This creates a spatial mental model instead of a text/thread model.

---

### Spatial Context Instead of Chat Overload

A repeated design principle:

> “You’re not reading 20 chat threads, you’re scanning a map.”

The interface uses:

* spatial placement
* status icons
* visual grouping
* zooming

…to help users understand:

* which agents are blocked
* which are waiting
* which completed tasks
* which department/team has issues

This turns orchestration into:

* “commanding”
* “monitoring”
* “resource management”

instead of micromanaging prompts.

---

### Buildings = Teams = Tasks

A very important abstraction.

In Vic:

* A **building** is usually a functional AI team
* But it can also represent:

  * a workflow stage
  * a feature
  * a project component
  * a temporary task group

Examples:

* “Architecture Council”
* “Build Team”
* “Prototyping Lab”
* “Knowledge Base”
* “Worktree Forge”

Each building contains specialized agents like:

* planner
* reviewer
* developer
* merger
* coordinator

So the system architecture is:

```text
Project
 └── Buildings/Teams
      └── Specialized Agents
           └── Skills + MCP integrations
```

---

## Architecture Concepts

### Modular Agent Harness

Vic is fundamentally an **agent orchestration harness**.

Core idea:

* agents collaborate
* agents hand work off
* agents review each other
* agents specialize into flows

It is not a single-agent assistant.

---

### Sequential / Flow-Based Agent Design

One of the founder’s key insights:

> productivity increases when agents work in sequence.

Example pipeline:

```text
PRD Writer
   ↓
Code Generator
   ↓
Reviewer
   ↓
Merger
```

This “stacked workflow” architecture is one of Vic’s core differentiators.

The founder explicitly compares this to stacking production chains in Factorio.

---

### Multi-Agent Collaboration System

Agents:

* communicate
* hand tasks to each other
* critique each other
* escalate uncertainty to humans

There’s heavy emphasis on:

* agent review loops
* council-style evaluation
* multiple models validating outputs

Example:
The “Council” building runs multiple LLMs together and has them:

1. answer
2. critique each other
3. rate outputs

This reduces hallucination/error probability.

---

### Bring-Your-Own Model Architecture

Vic is intentionally provider-agnostic.

Supports:

* Anthropic models
* OpenAI models
* Google Gemini

Users provide:

* API keys
* subscriptions

The platform itself is free.

---

### MCP-Centric Extensible Design

Vic heavily embraces MCP-style extensibility.

Users can inject:

* memory systems
* knowledge graphs
* tooling providers
* external integrations

Per:

* agent
* team
* project

The architecture intentionally avoids hard-locking into one paradigm.

---

### Memory System

Current memory architecture:

* internal text-based memory
* optional external memory/KG systems

Notably:

* there is NO hardcoded central knowledge graph
* memory behavior is agent-driven
* agents decide when to use memory

But users can plug in:

* custom knowledge graphs
* MCP memory servers
* retrieval systems

Strong modularity principle.

---

### Git Worktree Parallelism

One of the most technically important ideas.

Vic supports:

* parallel branches
* isolated work environments
* concurrent agent teams

Through:

* Git worktrees
* orchestration agents
* merge-aware workflows

Architecture pattern:

```text
Issue
 └── Dedicated Worktree
      └── Specialized Team
           └── Parallel Implementation
```

Then:

* merger agents reconcile conflicts
* documentation agents maintain context

This enables:

* 6–10 concurrent development tracks

---

### Documentation-Driven Context System

Instead of massive context windows, Vic uses:

* README files
* CLAUDE.md
* AGENTS.md
* project docs

Agents ingest localized documentation for context.

Benefits:

* lower token cost
* persistent organizational memory
* scalable parallelization

---

## UX Philosophy

### “Managing Employees, Not Prompting”

One of the strongest recurring themes.

The UX goal is:

> users feel like executives/managers

NOT:

> prompt engineers

Features supporting this:

* status visualization
* agent explainability
* delegation
* Chief of Staff agent
* suggested actions
* orchestration abstraction

---

### Explainability as First-Class UX

A major UX principle:
agents should:

* explain themselves
* justify work
* expose reasoning
* be interrogatable

The founder sees:
“show your work”
as a core UI primitive.

---

### Chief of Staff Agent

A meta-agent layer.

Purpose:

* reduce cognitive overload
* coordinate many agents
* suggest next actions
* summarize problems

Users can:

* select from options
  instead of writing prompts manually.

This acts as:

* orchestration abstraction
* executive assistant layer

---

## Performance / Technical Stack

### Built With Tauri

Uses Tauri.

Claimed advantages:

* ~8× lower energy usage vs competitors
* lightweight desktop performance
* better battery life

Positioned as:
high-efficiency local-native infrastructure.

---

## Design Philosophy

### “4X Interface for AI”

The founder repeatedly references:

* empire management
* strategy games
* AI civilization management

The belief:
traditional chat UIs do not scale to:

* 100–200 agents

But 4X strategy interfaces already solved:

* macro management
* large-scale coordination
* distributed task awareness

So Vic’s interface is essentially:

> a 4X strategy game UI for AI organizations.

---

## Additional Notable Concepts

### Subject-Driven vs Flow-Driven Buildings

Two building categories:

#### Flow-Driven

Focused on process pipelines:

* review chains
* councils
* merge flows

#### Subject-Driven

Focused on domains:

* knowledge base
* frontend
* security
* documentation

---

### Potential/Future Directions Mentioned

* Inspector agents
* Security buildings
* Collaboration tracking
* Evolutionary agent competition
* AI training/simulation environments
* “Scratch for AI agents”
* Visual task overlays
* Benchmark-driven restructuring agents

---

## Overall Positioning

Vic is essentially positioned as:

> “A game-like operating system for orchestrating large-scale AI agent organizations.”

Not:

* a chatbot
* a terminal wrapper
* a simple agent runner

But:

* an AI management layer
* a visual orchestration platform
* a multi-agent operating environment
* a programmable AI company simulator

## Additional Important Context (Architecture + UX + Systems)

### Per-Agent Model Selection

A major architectural detail:

Each agent can run on a completely different model.

Example:

* GPT for developers
* Gemini for designers
* Claude for planning/reasoning

The system supports:

* heterogeneous multi-model teams
* per-agent model assignment
* provider switching without recreating agents

This means Vic is not only provider-agnostic at the platform level — it’s provider-agnostic at the **individual agent level**.

---

### Persistent Agent Identity

Agents retain:

* memories
* skills
* configurations
* behaviors

…even when changing models/providers.

So agents are treated as persistent entities independent of the underlying LLM.

Architecturally:

```text id="o82l4v"
Agent Identity
 ├── Memory
 ├── Skills
 ├── Tool Access
 ├── Settings
 └── Current Model Provider
```

This abstraction layer decouples:

* agent identity
  from:
* inference backend

Which is a very important design choice.

---

### MCP Tool Layer / Agent Communication System

Under the hood, agents are connected through MCP-style tools.

Agents receive tools enabling them to:

* manipulate UI
* open files
* access terminals
* message teammates
* coordinate workflows

Examples:

* “Open a markdown file and show it to the user”
* “Message another agent in my team”

So the orchestration layer acts as:

* communication bus
* tooling runtime
* interface bridge

between:

* agents
* models
* UI
* local environment

---

## Real-Time Orchestration Philosophy

### Live State Visualization

The spatial UI is intended to work as:

* a real-time operational map
* not a static dashboard

A critical UX insight from users:
even a few seconds of lag could break trust in the visualization.

This reinforces that Vic’s UI depends heavily on:

* live synchronization
* real-time agent state updates
* immediate visual feedback

The map is effectively:

> an operational command center.

---

## Gamification as Cognitive Infrastructure

Several users independently pointed out:
traditional agent workflows become:

* mentally draining
* repetitive
* “dead”

Vic intentionally uses:

* gamification
* spatial metaphors
* character-driven presentation
* empire-management UX

…to reduce orchestration fatigue.

Important insight:
the “game layer” is not cosmetic —
it is a cognitive scaling mechanism.

---

## Agent Skill System (Implied Architecture)

A user questioned whether:
“agents picking up new skills”
means:

* fine-tuning
* evolving prompts
* expanding tool access
* contextual learning

While not fully answered, the existing architecture strongly implies:
skills are likely:

* composable capability/tool packages
* behavioral instructions
* MCP integrations
* reusable operational modules

NOT model fine-tuning.

This aligns with the broader modular architecture philosophy.

---

## Multi-Agent Context Persistence

Another recurring architectural problem Vic tries to solve:

* reducing repeated context explanation
* maintaining organizational continuity
* minimizing token waste

Mechanisms include:

* persistent documentation
* internal memory
* shared project structures
* team specialization
* task-localized knowledge

The system’s philosophy is:

> context should live in the organization structure,
> not only inside transient chat history.

---

## Non-Technical Operator Vision

A core product ambition:

Vic wants orchestration to become accessible even to non-engineers.

The UX direction is:

* managing AI teams
  instead of:
* writing prompts
  or:
* scripting workflows

Key enabling concepts:

* visual map interface
* explainable agents
* Chief of Staff abstraction
* clickable decisions
* team metaphors

The intended feeling:

> “running a company”
> rather than:
> “operating automation software.”

