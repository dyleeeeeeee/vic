import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AgentMessage,
  AgentState,
  ConnectionStatus,
  CreateAgentConfig,
  WSEvent,
} from '../types'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8765/ws'
const RECONNECT_DELAY = 2000

export function useOrchestrator() {
  const [agents, setAgents] = useState<Record<string, AgentState>>({})
  const [messages, setMessages] = useState<Record<string, AgentMessage[]>>({})
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [eventLog, setEventLog] = useState<WSEvent[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()

  // ── connection ─────────────────────────────

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionStatus('connecting')
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnectionStatus('connected')
      clearTimeout(reconnectTimer.current)
    }

    ws.onclose = () => {
      setConnectionStatus('disconnected')
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
    }

    ws.onerror = () => {
      ws.close()
    }

    ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data)
        handleEvent(event)
      } catch {}
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  // ── event handler ──────────────────────────

  const handleEvent = useCallback((event: WSEvent) => {
    setEventLog((prev) => [event, ...prev].slice(0, 100))

    switch (event.type) {
      case 'init': {
        const states: AgentState[] = event.data ?? []
        const map: Record<string, AgentState> = {}
        for (const s of states) map[s.id] = s
        setAgents(map)
        break
      }

      case 'agent_created': {
        const state: AgentState = event.data
        setAgents((prev) => ({ ...prev, [state.id]: state }))
        break
      }

      case 'agent_update': {
        const id = event.agent_id!
        const d = event.data
        setAgents((prev) => {
          const existing = prev[id]
          if (!existing) return prev
          return {
            ...prev,
            [id]: {
              ...existing,
              status: d.status ?? existing.status,
              current_task: d.current_task ?? existing.current_task,
              pending_question: d.pending_question ?? existing.pending_question,
            },
          }
        })
        // also append the event message as a pseudo-log entry to messages
        if (d.message) {
          setMessages((prev) => ({
            ...prev,
            [id]: [...(prev[id] ?? []), {
              role: 'assistant',
              content: d.message,
              timestamp: event.timestamp ?? Date.now() / 1000,
              text_preview: d.message,
            }],
          }))
        }
        break
      }

      case 'agent_deleted': {
        const id = event.agent_id!
        setAgents((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        setMessages((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        break
      }

      case 'messages': {
        const id = event.agent_id!
        setMessages((prev) => ({ ...prev, [id]: event.data ?? [] }))
        break
      }

      case 'agent_message': {
        // inter-agent edge — just log it
        break
      }
    }
  }, [])

  // ── send helpers ───────────────────────────

  const send = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  const createAgent = useCallback(
    (config: CreateAgentConfig) => {
      send({ action: 'create_agent', config })
    },
    [send]
  )

  const sendTask = useCallback(
    (agentId: string, task: string) => {
      send({ action: 'send_task', agent_id: agentId, task })
      // optimistically append to local messages
      setMessages((prev) => ({
        ...prev,
        [agentId]: [...(prev[agentId] ?? []), {
          role: 'user',
          content: task,
          timestamp: Date.now() / 1000,
          text_preview: task,
        }],
      }))
    },
    [send]
  )

  const sendAnswer = useCallback(
    (agentId: string, answer: string) => {
      send({ action: 'send_answer', agent_id: agentId, answer })
      setMessages((prev) => ({
        ...prev,
        [agentId]: [...(prev[agentId] ?? []), {
          role: 'user',
          content: answer,
          timestamp: Date.now() / 1000,
          text_preview: answer,
        }],
      }))
    },
    [send]
  )

  const deleteAgent = useCallback(
    (agentId: string) => send({ action: 'delete_agent', agent_id: agentId }),
    [send]
  )

  const updatePosition = useCallback(
    (agentId: string, x: number, y: number) =>
      send({ action: 'update_position', agent_id: agentId, x, y }),
    [send]
  )

  const fetchMessages = useCallback(
    (agentId: string) => send({ action: 'get_messages', agent_id: agentId }),
    [send]
  )

  return {
    agents,
    messages,
    connectionStatus,
    eventLog,
    createAgent,
    sendTask,
    sendAnswer,
    deleteAgent,
    updatePosition,
    fetchMessages,
  }
}
