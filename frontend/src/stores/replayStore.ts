import { agentStore, type AgentState } from './agentStore'

type Listener = () => void

export interface ReplayEvent {
  type: string
  agent_id: string | null
  data: any
  timestamp: number
}

class ReplayStore {
  active = false
  playing = false
  events: ReplayEvent[] = []
  currentIndex = 0
  playbackSpeed = 4
  private listeners: Set<Listener> = new Set()
  private playTimer: number | null = null
  private snapshotAgents: Map<string, AgentState> = new Map()

  get currentTime(): number {
    if (this.events.length === 0) return 0
    return this.events[this.currentIndex]?.timestamp ?? 0
  }

  get startTime(): number {
    return this.events[0]?.timestamp ?? 0
  }

  get endTime(): number {
    return this.events[this.events.length - 1]?.timestamp ?? 0
  }

  get progress(): number {
    if (this.events.length <= 1) return 0
    return this.currentIndex / (this.events.length - 1)
  }

  async load(fromTs?: number, toTs?: number) {
    const now = Date.now() / 1000
    const from = fromTs ?? now - 3600
    const to = toTs ?? now
    const apiBase = import.meta.env.VITE_API_URL || 'https://zesty-youth-production-7834.up.railway.app'
    const resp = await fetch(`${apiBase}/events?from_ts=${from}&to_ts=${to}`)
    if (!resp.ok) return
    this.events = await resp.json()
    this.currentIndex = 0
    this.notify()
  }

  enter() {
    this.snapshotAgents = new Map(agentStore.agents)
    this.active = true
    this.playing = false
    this.currentIndex = 0
    this.notify()
  }

  exit() {
    this.stop()
    this.active = false
    agentStore.agents = new Map(this.snapshotAgents)
    this.snapshotAgents.clear()
    this.notify()
  }

  play() {
    if (this.events.length === 0) return
    this.playing = true
    this.tick()
    this.notify()
  }

  pause() {
    this.playing = false
    if (this.playTimer) {
      clearTimeout(this.playTimer)
      this.playTimer = null
    }
    this.notify()
  }

  stop() {
    this.pause()
    this.currentIndex = 0
    this.notify()
  }

  seekTo(index: number) {
    this.currentIndex = Math.max(0, Math.min(index, this.events.length - 1))
    this.rebuildStateAt(this.currentIndex)
    this.notify()
  }

  seekToProgress(progress: number) {
    const index = Math.round(progress * (this.events.length - 1))
    this.seekTo(index)
  }

  private tick() {
    if (!this.playing || this.currentIndex >= this.events.length - 1) {
      this.playing = false
      this.notify()
      return
    }

    this.applyEvent(this.events[this.currentIndex])
    this.currentIndex++
    this.notify()

    const nextDelay = this.events.length > this.currentIndex + 1
      ? Math.max(10, (this.events[this.currentIndex + 1].timestamp - this.events[this.currentIndex].timestamp) * 1000 / this.playbackSpeed)
      : 100

    this.playTimer = window.setTimeout(() => this.tick(), Math.min(nextDelay, 500))
  }

  private applyEvent(event: ReplayEvent) {
    switch (event.type) {
      case 'agent_created':
        if (event.data) {
          agentStore.agents.set(event.agent_id!, event.data as AgentState)
        }
        break
      case 'agent_update':
        if (event.agent_id && agentStore.agents.has(event.agent_id)) {
          const agent = agentStore.agents.get(event.agent_id)!
          Object.assign(agent, event.data)
        }
        break
      case 'agent_deleted':
        if (event.agent_id) {
          agentStore.agents.delete(event.agent_id)
        }
        break
    }
  }

  private rebuildStateAt(index: number) {
    agentStore.agents.clear()
    for (let i = 0; i <= index; i++) {
      this.applyEvent(this.events[i])
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify() {
    for (const fn of this.listeners) fn()
  }
}

export const replayStore = new ReplayStore()
