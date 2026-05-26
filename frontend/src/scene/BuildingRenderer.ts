import * as THREE from 'three'

interface BuildingConfig {
  id: string
  team: string
  position: THREE.Vector3
  color: number
  size: { w: number; h: number; d: number }
}

const DEFAULT_BUILDINGS: BuildingConfig[] = [
  { id: 'arch', team: 'architecture', position: new THREE.Vector3(-6, 0, -4), color: 0x0066cc, size: { w: 3, h: 2.5, d: 3 } },
  { id: 'dev', team: 'development', position: new THREE.Vector3(4, 0, -4), color: 0x0066cc, size: { w: 3.5, h: 3, d: 3 } },
  { id: 'review', team: 'review', position: new THREE.Vector3(-6, 0, 5), color: 0x0066cc, size: { w: 2.5, h: 2, d: 2.5 } },
  { id: 'ops', team: 'operations', position: new THREE.Vector3(4, 0, 5), color: 0x0066cc, size: { w: 3, h: 2, d: 3 } },
]

export class BuildingRenderer {
  private buildings: Map<string, THREE.Group> = new Map()
  private spawnPoints: Map<string, THREE.Vector3> = new Map()

  constructor(private scene: THREE.Scene) {}

  createDefaultBuildings() {
    for (const config of DEFAULT_BUILDINGS) {
      this.createBuilding(config)
    }
  }

  private createBuilding(config: BuildingConfig) {
    const group = new THREE.Group()
    group.position.copy(config.position)

    // Main body
    const geo = new THREE.BoxGeometry(config.size.w, config.size.h, config.size.d)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2c,
      roughness: 0.7,
      metalness: 0.1,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.y = config.size.h / 2
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)

    // Accent roof strip
    const roofGeo = new THREE.BoxGeometry(config.size.w + 0.1, 0.15, config.size.d + 0.1)
    const roofMat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.3, metalness: 0.2 })
    const roof = new THREE.Mesh(roofGeo, roofMat)
    roof.position.y = config.size.h + 0.075
    roof.castShadow = true
    group.add(roof)

    // Window emissives
    const windowGeo = new THREE.PlaneGeometry(0.4, 0.5)
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xfff4e0,
      emissive: 0xfff4e0,
      emissiveIntensity: 0.3,
    })
    for (let i = 0; i < 3; i++) {
      const win = new THREE.Mesh(windowGeo, windowMat)
      win.position.set(-0.8 + i * 0.8, config.size.h * 0.6, config.size.d / 2 + 0.01)
      group.add(win)
    }

    // Team label (billboard text via sprite)
    const label = this.createTextSprite(config.team)
    label.position.y = config.size.h + 1
    group.add(label)

    this.scene.add(group)
    this.buildings.set(config.id, group)

    // Spawn point is in front of building
    const spawn = config.position.clone()
    spawn.z += config.size.d / 2 + 1.5
    spawn.y = 0
    this.spawnPoints.set(config.team, spawn)
    this.spawnPoints.set(config.id, spawn)
  }

  private createTextSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, 256, 64)
    ctx.font = '600 24px "SF Pro Display", system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text.toUpperCase(), 128, 40)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(4, 1, 1)
    return sprite
  }

  getSpawnPoint(team: string): THREE.Vector3 {
    return this.spawnPoints.get(team) || new THREE.Vector3(0, 0, 0)
  }
}
