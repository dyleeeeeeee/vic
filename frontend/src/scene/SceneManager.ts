import * as THREE from 'three'
import { InputController } from './InputController'
import { BuildingRenderer } from './BuildingRenderer'
import { AgentRenderer } from './AgentRenderer'
import { FogOfWar } from './FogOfWar'
import { SpatialDrift } from './SpatialDrift'
import { DayNightCycle } from './DayNightCycle'
import { WeatherSystem } from './WeatherSystem'
import { AmbientAudio } from './AmbientAudio'
import { ScreenshotMode } from './ScreenshotMode'
import { Minimap } from './Minimap'
import { agentStore } from '../stores/agentStore'
import { uiStore } from '../stores/uiStore'

export class SceneManager {
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer
  private clock: THREE.Clock
  private input: InputController
  private buildings: BuildingRenderer
  private agents: AgentRenderer
  private fog: FogOfWar
  private drift: SpatialDrift
  private dayNight: DayNightCycle
  private weather: WeatherSystem
  private audio: AmbientAudio
  private screenshot: ScreenshotMode
  private minimap: Minimap | null = null
  private animationId: number | null = null
  private unsubscribe: (() => void) | null = null
  private unsubEvents: (() => void) | null = null

  constructor(private container: HTMLElement) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1d1d1f)
    this.clock = new THREE.Clock()

    const aspect = container.clientWidth / container.clientHeight
    const frustum = 12
    this.camera = new THREE.OrthographicCamera(
      -frustum * aspect, frustum * aspect,
      frustum, -frustum,
      0.1, 1000
    )
    // Isometric angle: rotate camera to look down at ~30 degrees
    this.camera.position.set(20, 20, 20)
    this.camera.lookAt(0, 0, 0)
    this.camera.zoom = 1
    this.camera.updateProjectionMatrix()

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this.renderer.domElement)

    this.setupLighting()
    this.setupGround()

    this.input = new InputController(this.camera, this.renderer.domElement, this.scene)
    this.buildings = new BuildingRenderer(this.scene)
    this.agents = new AgentRenderer(this.scene)
    this.fog = new FogOfWar(this.scene)
    this.drift = new SpatialDrift()
    this.dayNight = new DayNightCycle(this.scene)
    this.weather = new WeatherSystem(this.scene)
    this.audio = new AmbientAudio()
    this.screenshot = new ScreenshotMode()
    this.screenshot.setup(this.renderer, this.scene, this.camera)

    window.addEventListener('resize', this.onResize)

    this.input.onAgentClick = (id) => { this.audio.resume(); this.audio.init(); uiStore.selectAgent(id) }
    this.input.onAgentHover = (id) => uiStore.hoverAgent(id)
    this.input.onEmptyClick = () => { this.audio.resume(); this.audio.init(); uiStore.selectAgent(null) }
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambient)

    const directional = new THREE.DirectionalLight(0xfff4e0, 0.8)
    directional.position.set(10, 15, 10)
    directional.castShadow = true
    directional.shadow.mapSize.set(2048, 2048)
    directional.shadow.camera.near = 0.5
    directional.shadow.camera.far = 50
    directional.shadow.camera.left = -20
    directional.shadow.camera.right = 20
    directional.shadow.camera.top = 20
    directional.shadow.camera.bottom = -20
    this.scene.add(directional)
  }

  private setupGround() {
    const gridSize = 24
    const geo = new THREE.PlaneGeometry(gridSize, gridSize)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x252527,
      roughness: 0.9,
      metalness: 0.0,
    })
    const ground = new THREE.Mesh(geo, mat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    ground.name = 'ground'
    this.scene.add(ground)

    // Subtle grid lines
    const grid = new THREE.GridHelper(gridSize, 12, 0x333333, 0x2a2a2c)
    grid.position.y = 0.01
    this.scene.add(grid)
  }

  start() {
    this.buildings.createDefaultBuildings()
    this.minimap = new Minimap(this.renderer, this.scene, this.camera, this.container)

    this.unsubscribe = agentStore.subscribe(() => this.syncAgents())
    this.unsubEvents = agentStore.onEvent((ev) => this.drift.ingestEvent(ev))
    this.syncAgents()

    this.animate()
  }

  private syncAgents() {
    const current = agentStore.getAgentList()
    const currentIds = new Set(current.map(a => a.id))

    // Remove agents no longer present
    for (const id of this.agents.getAgentIds()) {
      if (!currentIds.has(id)) {
        this.agents.removeAgent(id)
      }
    }

    // Add or update agents
    for (const agent of current) {
      if (!this.agents.hasAgent(agent.id)) {
        const pos = this.buildings.getSpawnPoint(agent.team)
        this.agents.addAgent(agent.id, agent.name, pos)
      }
      this.agents.updateStatus(agent.id, agent.status)
    }
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate)
    const delta = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()
    this.drift.update(delta)
    this.agents.update(delta, this.camera)
    this.fog.update(elapsed)
    this.dayNight.update()
    this.weather.update(delta)
    this.audio.update()

    if (this.screenshot.isActive) {
      this.screenshot.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }

    this.minimap?.render()
  }

  private onResize = () => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    const aspect = w / h
    const frustum = 12
    this.camera.left = -frustum * aspect
    this.camera.right = frustum * aspect
    this.camera.top = frustum
    this.camera.bottom = -frustum
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId)
    this.unsubscribe?.()
    this.unsubEvents?.()
    window.removeEventListener('resize', this.onResize)
    this.input.dispose()
    this.fog.dispose()
    this.weather.dispose()
    this.audio.dispose()
    this.minimap?.dispose()
    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
  }
}
