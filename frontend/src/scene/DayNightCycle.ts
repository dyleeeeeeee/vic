import * as THREE from 'three'

export class DayNightCycle {
  private directional: THREE.DirectionalLight
  private ambient: THREE.AmbientLight
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.directional = scene.children.find(
      c => c instanceof THREE.DirectionalLight
    ) as THREE.DirectionalLight
    this.ambient = scene.children.find(
      c => c instanceof THREE.AmbientLight
    ) as THREE.AmbientLight
  }

  update() {
    const hour = new Date().getHours() + new Date().getMinutes() / 60
    const t = (hour - 6) / 12
    const dayAmount = Math.max(0, Math.min(1, Math.sin(t * Math.PI)))

    const warmColor = new THREE.Color(0xfff4e0)
    const coolColor = new THREE.Color(0x4466aa)
    const nightColor = new THREE.Color(0x1a1a2e)
    const dayBg = new THREE.Color(0x1d1d1f)

    this.directional.intensity = 0.3 + dayAmount * 0.6
    this.directional.color.copy(warmColor).lerp(coolColor, 1 - dayAmount)

    const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2
    this.directional.position.set(
      Math.cos(angle) * 15,
      8 + dayAmount * 8,
      Math.sin(angle) * 15
    )

    this.ambient.intensity = 0.2 + dayAmount * 0.3
    this.ambient.color.copy(new THREE.Color(0xffffff)).lerp(coolColor, 1 - dayAmount)

    this.scene.background = new THREE.Color().copy(dayBg).lerp(nightColor, 1 - dayAmount)
  }
}
