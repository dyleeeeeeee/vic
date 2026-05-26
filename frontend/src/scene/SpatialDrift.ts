import { agentStore, type AgentState } from '../stores/agentStore'

interface MessageEdge {
  from: string
  to: string
  weight: number
  lastSeen: number
}

export class SpatialDrift {
  private edges: Map<string, MessageEdge> = new Map()
  private driftStrength = 0.02
  private decayRate = 0.001

  recordMessage(fromId: string, toId: string) {
    const key = [fromId, toId].sort().join(':')
    const edge = this.edges.get(key)
    if (edge) {
      edge.weight = Math.min(edge.weight + 1, 10)
      edge.lastSeen = Date.now() / 1000
    } else {
      this.edges.set(key, { from: fromId, to: toId, weight: 1, lastSeen: Date.now() / 1000 })
    }
  }

  update(delta: number) {
    const agents = agentStore.agents
    const now = Date.now() / 1000

    for (const [key, edge] of this.edges) {
      const age = now - edge.lastSeen
      edge.weight = Math.max(0, edge.weight - this.decayRate * delta)
      if (edge.weight <= 0 || age > 600) {
        this.edges.delete(key)
        continue
      }

      const a = agents.get(edge.from)
      const b = agents.get(edge.to)
      if (!a || !b) continue

      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 1.5 || dist > 20) continue

      const force = this.driftStrength * edge.weight * delta
      const nx = dx / dist
      const ny = dy / dist

      a.x += nx * force
      a.y += ny * force
      b.x -= nx * force
      b.y -= ny * force
    }
  }

  ingestEvent(event: { type: string; agent_id?: string; data?: any }) {
    if (event.type === 'agent_message' && event.agent_id && event.data?.to) {
      this.recordMessage(event.agent_id, event.data.to)
    }
  }
}
