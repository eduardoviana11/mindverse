import * as THREE from 'three'

export function createSciFiFloor(scene: THREE.Scene): void {
  const BASE_Y = -30
  const R      = 80
  const DECK_H = 1.8
  const DECK_R_OUTER  = R
  const DECK_R_INNER  = R * 0.50
  const DECK_ARC_START = Math.PI * 0.55
  const DECK_ARC_LEN   = Math.PI * 0.90

  const group = new THREE.Group()

  function arcShape(rOuter: number, rInner: number, aStart: number, aLen: number, segs = 32): THREE.Shape {
    const sh = new THREE.Shape()
    for (let s = 0; s <= segs; s++) {
      const a = aStart + aLen * (s / segs)
      const x = Math.cos(a) * rOuter, z = Math.sin(a) * rOuter
      if (s === 0) sh.moveTo(x, z); else sh.lineTo(x, z)
    }
    for (let s = segs; s >= 0; s--) {
      const a = aStart + aLen * (s / segs)
      sh.lineTo(Math.cos(a) * rInner, Math.sin(a) * rInner)
    }
    sh.closePath()
    return sh
  }

  const mainFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, 1.4, 72),
    new THREE.MeshStandardMaterial({ color: 0x0f1929, metalness: 0.85, roughness: 0.25 })
  )
  mainFloor.position.y = BASE_Y
  mainFloor.receiveShadow = true
  group.add(mainFloor)

  const ringDefs: Array<{ r: number; t: number; color: number; opacity: number }> = [
    { r: R * 0.28, t: 0.28, color: 0x1e3a5f, opacity: 0.9  },
    { r: R * 0.50, t: 0.20, color: 0x1a3457, opacity: 0.85 },
    { r: R * 0.70, t: 0.18, color: 0x162a45, opacity: 0.8  },
    { r: R * 0.88, t: 0.15, color: 0x122038, opacity: 0.7  },
  ]
  ringDefs.forEach(({ r, t, color, opacity }) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(r, t, 6, 80),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
    )
    m.rotation.x = Math.PI / 2
    m.position.y = BASE_Y + 0.72
    group.add(m)
  })

  const SPOKES = 24
  for (let i = 0; i < SPOKES; i++) {
    const angle   = (i / SPOKES) * Math.PI * 2
    const isMajor = i % 6 === 0
    const pts = [
      new THREE.Vector3(Math.cos(angle) * R * 0.12, 0, Math.sin(angle) * R * 0.12),
      new THREE.Vector3(Math.cos(angle) * R * 0.97, 0, Math.sin(angle) * R * 0.97),
    ]
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: isMajor ? 0x2a4a7a : 0x162236, transparent: true, opacity: isMajor ? 0.80 : 0.45 })
    )
    line.position.y = BASE_Y + 0.73
    group.add(line)
  }

  function addPanelRing(count: number, rInner: number, rOuter: number, height: number, evenColor: number, oddColor: number) {
    for (let i = 0; i < count; i++) {
      const a0  = (i / count) * Math.PI * 2 + 0.018
      const a1  = ((i + 1) / count) * Math.PI * 2 - 0.018
      const sh  = arcShape(rOuter, rInner, a0, a1 - a0, 8)
      const geo = new THREE.ExtrudeGeometry(sh, { depth: height, bevelEnabled: false })
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? evenColor : oddColor, metalness: 0.82, roughness: 0.32 }))
      mesh.rotation.x   = -Math.PI / 2
      mesh.position.y   = BASE_Y + 0.6
      mesh.receiveShadow = true
      group.add(mesh)
    }
  }

  addPanelRing(8,  R * 0.30, R * 0.48, 0.16, 0x0e1e32, 0x0b1828)
  addPanelRing(12, R * 0.52, R * 0.68, 0.24, 0x111f33, 0x0d1828)
  addPanelRing(16, R * 0.72, R * 0.86, 0.16, 0x0f1c2e, 0x0c1724)

  for (let i = 0; i < 8; i++) {
    const a  = (i / 8) * Math.PI * 2
    const pl = new THREE.PointLight(0x7dd3fc, 0.7, 38)
    pl.position.set(Math.cos(a) * (R - 2), BASE_Y + 0.72, Math.sin(a) * (R - 2))
    group.add(pl)
  }

  const deckShape = arcShape(DECK_R_OUTER, DECK_R_INNER, DECK_ARC_START, DECK_ARC_LEN, 40)
  const deckGeo = new THREE.ExtrudeGeometry(deckShape, { depth: DECK_H, bevelEnabled: true, bevelSize: 0.45, bevelThickness: 0.35, bevelSegments: 2 })
  const deck = new THREE.Mesh(deckGeo, new THREE.MeshStandardMaterial({ color: 0x1a2d47, metalness: 0.88, roughness: 0.22 }))
  deck.rotation.x    = -Math.PI / 2
  deck.position.y    = BASE_Y + 0.6
  deck.castShadow    = true
  deck.receiveShadow = true
  group.add(deck)

  const INSET      = 1.8
  const insetShape = arcShape(DECK_R_OUTER - INSET, DECK_R_INNER + INSET, DECK_ARC_START + 0.015, DECK_ARC_LEN - 0.03, 40)
  const inset = new THREE.Mesh(
    new THREE.ExtrudeGeometry(insetShape, { depth: 0.45, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: 0x0c1726, metalness: 0.65, roughness: 0.55 })
  )
  inset.rotation.x = -Math.PI / 2
  inset.position.y = BASE_Y + 0.6 + DECK_H
  group.add(inset)

  const innerStrip = new THREE.Mesh(
    new THREE.TorusGeometry(DECK_R_INNER + 1.0, 0.22, 6, 72, DECK_ARC_LEN),
    new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 })
  )
  innerStrip.rotation.x =  Math.PI / 2
  innerStrip.rotation.z = -DECK_ARC_START
  innerStrip.position.y  = BASE_Y + 0.6 + DECK_H + 0.08
  group.add(innerStrip)

  scene.add(group)
}