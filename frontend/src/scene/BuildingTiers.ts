import * as THREE from 'three'

export type BuildingTier = 1 | 2 | 3 | 4 | 5

export function createBuildingMesh(tier: BuildingTier, color: number): THREE.Group {
  const group = new THREE.Group()
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.7, metalness: 0.1 })
  const accentMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.2 })
  const windowMat = new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xfff4e0, emissiveIntensity: 0.3 })

  switch (tier) {
    case 1: {
      // Tent — triangular prism
      const shape = new THREE.Shape()
      shape.moveTo(-1, 0)
      shape.lineTo(0, 1.5)
      shape.lineTo(1, 0)
      shape.closePath()
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.5, bevelEnabled: false })
      const mesh = new THREE.Mesh(geo, baseMat)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(0, 0, -0.75)
      mesh.castShadow = true
      group.add(mesh)
      break
    }
    case 2: {
      // Shed — small box with sloped roof
      const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 2), baseMat)
      body.position.y = 0.75
      body.castShadow = true
      group.add(body)
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 2.2), accentMat)
      roof.position.y = 1.55
      roof.castShadow = true
      group.add(roof)
      break
    }
    case 3: {
      // Office — medium box with windows
      const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 3), baseMat)
      body.position.y = 1.25
      body.castShadow = true
      group.add(body)
      const roof = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.15, 3.1), accentMat)
      roof.position.y = 2.575
      roof.castShadow = true
      group.add(roof)
      addWindows(group, 3, 2.5, 3, windowMat)
      break
    }
    case 4: {
      // Modern — taller with setback
      const base = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2, 3.5), baseMat)
      base.position.y = 1
      base.castShadow = true
      group.add(base)
      const upper = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 2.5), baseMat)
      upper.position.y = 3
      upper.castShadow = true
      group.add(upper)
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 2.6), accentMat)
      roof.position.y = 4.075
      group.add(roof)
      addWindows(group, 3.5, 2, 3.5, windowMat)
      addWindows(group, 2.5, 2, 2.5, windowMat, 2)
      break
    }
    case 5: {
      // Glass tower — tall cylinder with accent ring
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.4, 5, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3e, roughness: 0.2, metalness: 0.6 })
      )
      tower.position.y = 2.5
      tower.castShadow = true
      group.add(tower)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.08, 8, 16), accentMat)
      ring.position.y = 5
      ring.rotation.x = Math.PI / 2
      group.add(ring)
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 8), accentMat)
      cap.position.y = 5.05
      group.add(cap)
      break
    }
  }

  return group
}

function addWindows(
  group: THREE.Group, w: number, h: number, d: number,
  mat: THREE.MeshStandardMaterial, yOffset = 0
) {
  const windowGeo = new THREE.PlaneGeometry(0.35, 0.45)
  for (let i = 0; i < 3; i++) {
    const win = new THREE.Mesh(windowGeo, mat)
    win.position.set(-0.7 + i * 0.7, h * 0.6 + yOffset, d / 2 + 0.01)
    group.add(win)
  }
}

export function getTierForMetric(completedTasks: number): BuildingTier {
  if (completedTasks >= 50) return 5
  if (completedTasks >= 25) return 4
  if (completedTasks >= 10) return 3
  if (completedTasks >= 3) return 2
  return 1
}
