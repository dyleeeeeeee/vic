export type AgentStatus = 'idle' | 'running' | 'waiting' | 'blocked' | 'done' | 'error'

export interface AgentState {
  id: string
  name: string
  status: AgentStatus
  model: string
  system_prompt: string
  current_task: string | null
  pending_question: string | null
  x: number
  y: number
  created_at: number
}

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: any
  timestamp: number
  text_preview: string
}

export interface WSEvent {
  type: string
  agent_id?: string
  data?: any
  timestamp?: number
}

export interface CreateAgentConfig {
  name: string
  model: string
  system_prompt: string
  api_key: string
  x?: number
  y?: number
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'
