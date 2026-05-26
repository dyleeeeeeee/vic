import { agentStore } from '../stores/agentStore'

export class AmbientAudio {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private officeNoise: OscillatorNode | null = null
  private officeGain: GainNode | null = null
  private muted = false
  private initialized = false

  init() {
    if (this.initialized) return
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.03
    this.masterGain.connect(this.ctx.destination)

    this.officeGain = this.ctx.createGain()
    this.officeGain.gain.value = 0
    this.officeGain.connect(this.masterGain)

    // Filtered white noise for ambient office hum
    const bufferSize = this.ctx.sampleRate * 2
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5
    }

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 200

    source.connect(filter)
    filter.connect(this.officeGain)
    source.start()

    this.initialized = true
  }

  update() {
    if (!this.ctx || !this.officeGain || this.muted) return
    if (this.ctx.state === 'suspended') return

    const agents = agentStore.getAgentList()
    const runningCount = agents.filter(a => a.status === 'running').length
    const total = agents.length || 1
    const busyness = runningCount / total

    const targetGain = busyness * 0.8
    this.officeGain.gain.value += (targetGain - this.officeGain.gain.value) * 0.02
  }

  playAlert() {
    if (!this.ctx || !this.masterGain || this.muted) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.3)
  }

  toggleMute() {
    this.muted = !this.muted
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.03
    }
    return this.muted
  }

  get isMuted() {
    return this.muted
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume()
    }
  }

  dispose() {
    this.ctx?.close()
    this.ctx = null
    this.initialized = false
  }
}
