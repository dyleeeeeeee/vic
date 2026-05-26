import * as THREE from 'three'

export class InputController {
  onAgentClick: ((id: string) => void) | null = null
  onAgentHover: ((id: string | null) => void) | null = null
  onEmptyClick: (() => void) | null = null

  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private isDragging = false
  private dragStart = new THREE.Vector2()
  private cameraStart = new THREE.Vector3()
  private lastHovered: string | null = null

  constructor(
    private camera: THREE.OrthographicCamera,
    private canvas: HTMLElement,
    private scene: THREE.Scene,
  ) {
    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
  }

  private onPointerDown = (e: PointerEvent) => {
    this.isDragging = false
    this.dragStart.set(e.clientX, e.clientY)
    this.cameraStart.copy(this.camera.position)
  }

  private onPointerMove = (e: PointerEvent) => {
    const dx = e.clientX - this.dragStart.x
    const dy = e.clientY - this.dragStart.y

    if (e.buttons === 1 && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      this.isDragging = true
      const scale = 12 / this.camera.zoom / (this.canvas.clientHeight / 2)
      // Pan in isometric space
      this.camera.position.x = this.cameraStart.x - dx * scale
      this.camera.position.z = this.cameraStart.z - dy * scale
      this.camera.position.y = this.cameraStart.y
      return
    }

    // Hover detection
    this.updateMouse(e)
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const agents = this.scene.children.filter(c => c.userData.agentId)
    const hits = this.raycaster.intersectObjects(agents, true)
    const hit = hits.length > 0 ? this.findAgentId(hits[0].object) : null

    if (hit !== this.lastHovered) {
      this.lastHovered = hit
      this.onAgentHover?.(hit)
    }
  }

  private onPointerUp = (e: PointerEvent) => {
    if (this.isDragging) {
      this.isDragging = false
      return
    }

    this.updateMouse(e)
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const agents = this.scene.children.filter(c => c.userData.agentId)
    const hits = this.raycaster.intersectObjects(agents, true)

    if (hits.length > 0) {
      const id = this.findAgentId(hits[0].object)
      if (id) this.onAgentClick?.(id)
    } else {
      this.onEmptyClick?.()
    }
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const zoomSpeed = 0.1
    this.camera.zoom = Math.max(0.3, Math.min(3, this.camera.zoom - e.deltaY * zoomSpeed * 0.01))
    this.camera.updateProjectionMatrix()
  }

  private updateMouse(e: PointerEvent | MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  private findAgentId(obj: THREE.Object3D): string | null {
    let current: THREE.Object3D | null = obj
    while (current) {
      if (current.userData.agentId) return current.userData.agentId
      current = current.parent
    }
    return null
  }

  dispose() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('wheel', this.onWheel)
  }
}
