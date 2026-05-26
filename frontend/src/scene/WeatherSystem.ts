import * as THREE from 'three'
import { agentStore } from '../stores/agentStore'

const skyVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const skyFragmentShader = `
uniform vec3 uTopColor;
uniform vec3 uBottomColor;
uniform float uStormAmount;
varying vec2 vUv;

void main() {
  float y = vUv.y;
  vec3 sky = mix(uBottomColor, uTopColor, y);
  vec3 storm = vec3(0.12, 0.12, 0.14);
  gl_FragColor = vec4(mix(sky, storm, uStormAmount * (1.0 - y * 0.5)), 1.0);
}
`

export type WeatherState = 'clear' | 'overcast' | 'storm'

export class WeatherSystem {
  private skyMesh: THREE.Mesh
  private material: THREE.ShaderMaterial
  private particles: THREE.Points | null = null
  private currentState: WeatherState = 'clear'
  private stormAmount = 0

  constructor(private scene: THREE.Scene) {
    this.material = new THREE.ShaderMaterial({
      vertexShader: skyVertexShader,
      fragmentShader: skyFragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new THREE.Color(0x1a1a2e) },
        uBottomColor: { value: new THREE.Color(0x272729) },
        uStormAmount: { value: 0 },
      },
    })

    const geo = new THREE.SphereGeometry(80, 16, 16)
    this.skyMesh = new THREE.Mesh(geo, this.material)
    this.skyMesh.renderOrder = -1
    this.scene.add(this.skyMesh)
  }

  update(delta: number) {
    const agents = agentStore.getAgentList()
    const errorCount = agents.filter(a => a.status === 'error').length
    const blockedCount = agents.filter(a => a.status === 'blocked').length
    const total = agents.length || 1

    const healthScore = 1 - (errorCount * 2 + blockedCount) / (total * 2)
    const targetState: WeatherState = healthScore > 0.7 ? 'clear' : healthScore > 0.4 ? 'overcast' : 'storm'

    if (targetState !== this.currentState) {
      this.currentState = targetState
    }

    const targetStorm = targetState === 'storm' ? 0.8 : targetState === 'overcast' ? 0.3 : 0
    this.stormAmount += (targetStorm - this.stormAmount) * delta * 0.5
    this.material.uniforms.uStormAmount.value = this.stormAmount

    if (targetState === 'clear') {
      this.material.uniforms.uTopColor.value.set(0x1a1a2e)
      this.material.uniforms.uBottomColor.value.set(0x272729)
    } else if (targetState === 'overcast') {
      this.material.uniforms.uTopColor.value.set(0x1a1a22)
      this.material.uniforms.uBottomColor.value.set(0x222226)
    } else {
      this.material.uniforms.uTopColor.value.set(0x0f0f14)
      this.material.uniforms.uBottomColor.value.set(0x1a1a1e)
    }

    if (this.particles) {
      this.particles.rotation.y += delta * 0.1
    }

    if (this.stormAmount > 0.5 && !this.particles) {
      this.addRainParticles()
    } else if (this.stormAmount < 0.3 && this.particles) {
      this.scene.remove(this.particles)
      this.particles.geometry.dispose()
      ;(this.particles.material as THREE.PointsMaterial).dispose()
      this.particles = null
    }
  }

  private addRainParticles() {
    const count = 200
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = Math.random() * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: 0x7a7a7a,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
    })
    this.particles = new THREE.Points(geo, mat)
    this.scene.add(this.particles)
  }

  dispose() {
    this.scene.remove(this.skyMesh)
    this.material.dispose()
    this.skyMesh.geometry.dispose()
    if (this.particles) {
      this.scene.remove(this.particles)
      this.particles.geometry.dispose()
      ;(this.particles.material as THREE.PointsMaterial).dispose()
    }
  }
}
