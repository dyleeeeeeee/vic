import * as THREE from 'three'
import { agentStore } from '../stores/agentStore'

const MAX_AGENTS = 32

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float uTime;
uniform vec3 uAgentPositions[${MAX_AGENTS}];
uniform float uAgentTimestamps[${MAX_AGENTS}];
uniform int uAgentCount;
uniform float uGridSize;
varying vec2 vUv;

void main() {
  vec2 worldPos = (vUv - 0.5) * uGridSize;
  float visibility = 0.0;

  for (int i = 0; i < ${MAX_AGENTS}; i++) {
    if (i >= uAgentCount) break;
    vec2 agentPos = uAgentPositions[i].xz;
    float age = uTime - uAgentTimestamps[i];
    float dist = distance(worldPos, agentPos);
    float radius = max(1.0, 4.0 - age * 0.5);
    float glow = smoothstep(radius, 0.0, dist);
    float decay = exp(-age * 0.3);
    visibility = max(visibility, glow * decay);
  }

  float alpha = mix(0.6, 0.0, visibility);
  gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}
`

export class FogOfWar {
  private mesh: THREE.Mesh
  private material: THREE.ShaderMaterial
  private agentPositions: Float32Array
  private agentTimestamps: Float32Array

  constructor(private scene: THREE.Scene, gridSize = 24) {
    this.agentPositions = new Float32Array(MAX_AGENTS * 3)
    this.agentTimestamps = new Float32Array(MAX_AGENTS)

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uAgentPositions: { value: [] as THREE.Vector3[] },
        uAgentTimestamps: { value: this.agentTimestamps },
        uAgentCount: { value: 0 },
        uGridSize: { value: gridSize },
      },
    })

    const positions: THREE.Vector3[] = []
    for (let i = 0; i < MAX_AGENTS; i++) {
      positions.push(new THREE.Vector3())
    }
    this.material.uniforms.uAgentPositions.value = positions

    const geo = new THREE.PlaneGeometry(gridSize, gridSize)
    this.mesh = new THREE.Mesh(geo, this.material)
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.y = 0.02
    this.mesh.renderOrder = 1
    this.scene.add(this.mesh)
  }

  update(elapsedTime: number) {
    const agents = agentStore.getAgentList()
    const count = Math.min(agents.length, MAX_AGENTS)
    const positions = this.material.uniforms.uAgentPositions.value as THREE.Vector3[]

    for (let i = 0; i < count; i++) {
      const a = agents[i]
      positions[i].set(a.x, 0, a.y)
      this.agentTimestamps[i] = a.status === 'idle' ? elapsedTime - 5 : elapsedTime
    }

    this.material.uniforms.uTime.value = elapsedTime
    this.material.uniforms.uAgentCount.value = count
  }

  dispose() {
    this.scene.remove(this.mesh)
    this.material.dispose()
    this.mesh.geometry.dispose()
  }
}
