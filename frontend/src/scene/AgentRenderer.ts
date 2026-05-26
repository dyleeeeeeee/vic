import * as THREE from 'three'
import type { AgentStatus } from '../stores/agentStore'

const STATUS_COLORS: Record<AgentStatus, number> = {
  running: 0x10b981,
  idle: 0x64748b,
  waiting: 0x8b5cf6,
  blocked: 0xf59e0b,
  error: 0xef4444,
  done: 0x6ee7b7,
}

const STATUS_ANIMATIONS: Record<AgentStatus, string> = {
  running: 'working',
  idle: 'idle',
  waiting: 'waiting',
  blocked: 'blocked',
  error: 'error',
  done: 'idle',
}

interface AgentInstance {
  group: THREE.Group
  body: THREE.Mesh
  head: THREE.Mesh
  billboard: THREE.Sprite
  status: AgentStatus
  animTime: number
  baseY: number
}

export class AgentRenderer {
  private agents: Map<string, AgentInstance> = new Map()
  private frustum = new THREE.Frustum()
  private projScreenMatrix = new THREE.Matrix4()

  constructor(private scene: THREE.Scene) {}

  addAgent(id: string, name: string, position: THREE.Vector3) {
    const group = new THREE.Group()
    group.position.copy(position)
    group.position.y = 0
    group.userData.agentId = id

    // Capsule body (low-poly character placeholder)
    const bodyGeo = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.getAgentColor(id),
      roughness: 0.6,
      metalness: 0.1,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.7
    body.castShadow = true
    group.add(body)

    // Head sphere
    const headGeo = new THREE.SphereGeometry(0.25, 8, 8)
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xd4a574,
      roughness: 0.7,
    })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 1.45
    head.castShadow = true
    group.add(head)

    // Status billboard
    const billboard = this.createBillboard('idle')
    billboard.position.y = 2.0
    group.add(billboard)

    this.scene.add(group)
    this.agents.set(id, {
      group,
      body,
      head,
      billboard,
      status: 'idle',
      animTime: Math.random() * Math.PI * 2,
      baseY: 0,
    })
  }

  removeAgent(id: string) {
    const agent = this.agents.get(id)
    if (!agent) return
    this.scene.remove(agent.group)
    this.agents.delete(id)
  }

  hasAgent(id: string): boolean {
    return this.agents.has(id)
  }

  getAgentIds(): string[] {
    return Array.from(this.agents.keys())
  }

  updateStatus(id: string, status: AgentStatus) {
    const agent = this.agents.get(id)
    if (!agent || agent.status === status) return
    agent.status = status

    // Update billboard
    agent.group.remove(agent.billboard)
    agent.billboard = this.createBillboard(status)
    agent.billboard.position.y = 2.0
    agent.group.add(agent.billboard)
  }

  update(delta: number, camera: THREE.OrthographicCamera) {
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix)

    for (const [, agent] of this.agents) {
      // Frustum culling: skip animation for offscreen agents
      if (!this.frustum.containsPoint(agent.group.position)) continue

      agent.animTime += delta
      this.animateAgent(agent, delta)
    }
  }

  private animateAgent(agent: AgentInstance, delta: number) {
    const t = agent.animTime

    switch (agent.status) {
      case 'running':
        // Typing bob
        agent.body.position.y = 0.7 + Math.sin(t * 4) * 0.02
        agent.head.position.y = 1.45 + Math.sin(t * 4) * 0.02
        // Slight rotation (looking at work)
        agent.group.rotation.y = Math.sin(t * 0.5) * 0.1
        break

      case 'idle':
        // Gentle sway
        agent.body.position.y = 0.7 + Math.sin(t * 1.5) * 0.015
        agent.group.rotation.y = Math.sin(t * 0.3) * 0.3
        break

      case 'blocked':
        // Foot tapping (shake)
        agent.group.position.x += Math.sin(t * 8) * 0.002
        break

      case 'waiting':
        // Look toward camera (slight rotation)
        agent.group.rotation.y = Math.sin(t * 0.8) * 0.5
        // Occasional wave (head bob)
        if (Math.sin(t * 2) > 0.9) {
          agent.head.position.y = 1.45 + 0.05
        } else {
          agent.head.position.y = 1.45
        }
        break

      case 'error':
        // Slumped
        agent.body.rotation.x = 0.1
        agent.head.position.y = 1.35
        break

      case 'done':
        // Relaxed idle
        agent.body.position.y = 0.7 + Math.sin(t * 1) * 0.01
        break
    }

    // Billboard always faces camera (sprites do this automatically)
  }

  private createBillboard(status: AgentStatus): THREE.Sprite {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    const color = STATUS_COLORS[status]
    const hex = '#' + color.toString(16).padStart(6, '0')

    ctx.clearRect(0, 0, 64, 64)

    // Draw icon based on status
    ctx.fillStyle = hex
    ctx.strokeStyle = hex
    ctx.lineWidth = 3

    switch (status) {
      case 'running':
        // Spinning gear (circle with notches)
        ctx.beginPath()
        ctx.arc(32, 32, 16, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(32, 32, 6, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'blocked':
        // Exclamation
        ctx.font = 'bold 36px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('!', 32, 42)
        break
      case 'error':
        // X mark
        ctx.beginPath()
        ctx.moveTo(18, 18); ctx.lineTo(46, 46)
        ctx.moveTo(46, 18); ctx.lineTo(18, 46)
        ctx.stroke()
        break
      case 'waiting':
        // Question mark
        ctx.font = 'bold 32px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('?', 32, 42)
        break
      case 'done':
        // Checkmark
        ctx.beginPath()
        ctx.moveTo(16, 32); ctx.lineTo(28, 44); ctx.lineTo(48, 20)
        ctx.stroke()
        break
      case 'idle':
        // Diamond (plumbob)
        ctx.beginPath()
        ctx.moveTo(32, 12); ctx.lineTo(44, 32); ctx.lineTo(32, 52); ctx.lineTo(20, 32)
        ctx.closePath()
        ctx.globalAlpha = 0.5
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.stroke()
        break
    }

    const texture = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(0.8, 0.8, 0.8)
    return sprite
  }

  private getAgentColor(id: string): number {
    // Deterministic color from agent ID
    const colors = [0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x06b6d4, 0xf97316, 0x84cc16]
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i)
    }
    return colors[Math.abs(hash) % colors.length]
  }
}
