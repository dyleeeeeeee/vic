export type AgentStatus = 'idle' | 'running' | 'waiting' | 'blocked' | 'done' | 'error'

export interface AgentState {
  id: string
  name: string
  status: AgentStatus
  model: string
  current_task: string | null
  pending_question: string | null
  x: number
  y: number
  team: string
  building_id: string | null
  created_at: number
}

export interface Message {
  role: string
  content: any
  timestamp: number
  text_preview: string
}

type Listener = () => void
type EventHook = (event: any) => void

class AgentStore {
  agents: Map<string, AgentState> = new Map()
  connected = false
  private ws: WebSocket | null = null
  private listeners: Set<Listener> = new Set()
  private eventHooks: Set<EventHook> = new Set()
  private reconnectTimer: number | null = null
  private reconnectDelay = 1000

  connect() {
    const baseUrl = import.meta.env.VITE_WS_URL || 'wss://zesty-youth-production-7834.up.railway.app'
    const url = `${baseUrl}/ws`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.connected = true
      this.reconnectDelay = 1000
      this.notify()
    }

    this.ws.onclose = () => {
      this.connected = false
      this.notify()
      this.scheduleReconnect()
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        this.handleEvent(msg)
      } catch {
        console.warn('[vic] failed to parse WS message')
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000)
      this.connect()
    }, this.reconnectDelay)
  }

  private handleEvent(msg: any) {
    switch (msg.type) {
      case 'init':
        this.agents.clear()
        if (Array.isArray(msg.data)) {
          for (const s of msg.data) {
            this.agents.set(s.id, this.normalizeAgent(s))
          }
        }
        break

      case 'agent_created':
        if (msg.data) {
          this.agents.set(msg.agent_id, this.normalizeAgent(msg.data))
        }
        break

      case 'agent_update':
        if (msg.agent_id && this.agents.has(msg.agent_id)) {
          const agent = this.agents.get(msg.agent_id)!
          Object.assign(agent, msg.data)
        }
        break

      case 'agent_deleted':
        if (msg.agent_id) {
          this.agents.delete(msg.agent_id)
        }
        break
    }
    for (const hook of this.eventHooks) hook(msg)
    this.notify()
  }

  onEvent(fn: EventHook): () => void {
    this.eventHooks.add(fn)
    return () => this.eventHooks.delete(fn)
  }

  private normalizeAgent(raw: any): AgentState {
    return {
      id: raw.id,
      name: raw.name || raw.id,
      status: raw.status || 'idle',
      model: raw.model || '',
      current_task: raw.current_task || null,
      pending_question: raw.pending_question || null,
      x: raw.x || 0,
      y: raw.y || 0,
      team: raw.team || 'default',
      building_id: raw.building_id || null,
      created_at: raw.created_at || Date.now() / 1000,
    }
  }

  send(action: string, data: Record<string, any> = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...data }))
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify() {
    for (const fn of this.listeners) fn()
  }

  getAgentList(): AgentState[] {
    return Array.from(this.agents.values())
  }
}

export const agentStore = new AgentStore()
