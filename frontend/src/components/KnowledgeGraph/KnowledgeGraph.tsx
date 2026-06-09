import { useRef, useCallback, useState, useEffect } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import { createPortal } from 'react-dom'
import type { KnowledgeNode, GraphData, AppScene } from '../../types'
import { getCategoryColor } from '../../styles/colors'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'

import { createSciFiFloor } from './SciFiFloor'
import { Minimap } from './Minimap'
import { NodeTree } from './NodeTree'
import { LockOnHUD } from './LockOnHUD'

import { drawTerminalDashboard } from './utils/terminalRenderer'

import { useGraphPhysics } from './hooks/useGraphPhysics'
import { useTerminalSync } from './hooks/useTerminalSync'

interface KnowledgeGraphProps {
  graphData: GraphData
  onNodeClick: (node: KnowledgeNode) => void
  selectedNodeId: string | null
  zone: AppScene
  topic?: string
}

// ─── Componente principal ────────────────────────────────────────────────
export function KnowledgeGraph({ graphData, onNodeClick, selectedNodeId, zone, topic }: KnowledgeGraphProps) {
  const fgRef = useRef<any>(null)
  
  const particlesRef = useRef<THREE.Points | null>(null)

  const { isSavedRef, isExpandingRef } = useTerminalSync()
  useGraphPhysics(fgRef, graphData)

  // Camera state
  const isFlying    = useRef(false)
  const flightData  = useRef<any>(null)
  const isLockedOn  = useRef(false)
  const lockedTarget = useRef<THREE.Vector3 | null>(null)

  const keys        = useRef({ w: false, a: false, s: false, d: false })
  const isDragging  = useRef(false)
  const prevMouse   = useRef({ x: 0, y: 0 })

  const zoneData = useRef({
    current: 'reception',
    isTraveling: false,
    targetPos: new THREE.Vector3(),
  })

  // React state for overlay UI
  const [lockedNode, setLockedNode]   = useState<KnowledgeNode | null>(null)
  const [dimensions, setDimensions]   = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const onResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Setup da cena ──────────────────────────────────────────────
useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    
    // Precisamos definir a cena fora para o cleanup conseguir acessá-la
    const scene = fgRef.current?.scene()
    const camera = fgRef.current?.camera()

    if (!scene || !camera) return

    t = setTimeout(() => {
      camera.position.set(0, 30, 30)
      camera.lookAt(0, 0, 0)

      scene.add(new THREE.AmbientLight(0xffffff, 0.4))
      const dir = new THREE.DirectionalLight(0xffffff, 0.8)
      dir.position.set(100, 200, 50)
      scene.add(dir)

      createSciFiFloor(scene);

      // ── Partículas (Zona de exclusão + RenderOrder) ──
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(800 * 3);
      let i = 0;
      while (i < 2400) {
        const x = (Math.random() - 0.5) * 600;
        const y = (Math.random() - 0.5) * 600;
        const z = (Math.random() - 0.5) * 600;
        const distToCenter = Math.hypot(x, z);
        if (distToCenter < 70 && y > -40 && y < 60) continue;
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        i++
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const particlesMesh = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.8, color: 0x7dd3fc, transparent: true, opacity: 0.3, 
        blending: THREE.AdditiveBlending, depthWrite: false 
      }));
      particlesMesh.renderOrder = -1
      particlesRef.current = particlesMesh
      scene.add(particlesMesh);

      const loader = new GLTFLoader();
      loader.load('/biblioteca.glb', (gltf) => {
        const room = gltf.scene
        room.scale.set(42, 42, 42)
        room.position.set(0, -28, 0)
        room.traverse((child: any) => {
          if (child.isMesh && child.material) {
            // Detectamos se o material original foi configurado como transparente
            const isGlass = child.material.transparent === true || child.material.opacity < 1.0;

            if (isGlass) {
              // 1. VIDRO
              child.material = new THREE.MeshBasicMaterial({
                color: 0x7dd3fc,
                transparent: true,
                opacity: 0.04,
                side: THREE.DoubleSide,
                depthWrite: false,
                toneMapped: false
              });
            } else {
              // 2. PARTE OPACA
              child.material = new THREE.MeshLambertMaterial({
                color: child.material.color || 0x1a2d47,
                emissive: 0x000000,
                side: THREE.DoubleSide,
                depthWrite: true,
                toneMapped: false
              });
            }
            
            child.material.needsUpdate = true;
          }
        });
        scene.add(room)
      });

      // Terminal
      loader.load('/scifi-terminal.glb', (gltf) => {
        const terminal = gltf.scene;
        terminal.scale.set(.12, .12, .12);
        terminal.position.set(-48, -28.5, 0);
        terminal.rotation.y = -Math.PI / 2;
        scene.add(terminal);

        const canvas = document.createElement('canvas');
        canvas.width = 1024;  
        canvas.height = 627; 
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.NearestFilter;

        const screenGroup = new THREE.Group();
        screenGroup.rotation.order = 'YXZ';
        screenGroup.rotation.y = Math.PI / 2;
        screenGroup.rotation.x = -0.68;
        screenGroup.position.set(-47.7, -15.3, 0);

        // ── MOLDURA/SUPORTE EM 3D (BoxGeometry) ──
        const boxWidth = 7.6;
        const boxHeight = 4.75;
        const boxThickness = 1.2; // Espessura robusta para parecer o suporte/gabinete da tela
        
        const backGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxThickness); 
        
        // Mudamos para MeshStandardMaterial para que a carcaça reaja realisticamente às luzes da sala
        const backMat = new THREE.MeshStandardMaterial({ 
          color: 0x0b0f17, // Tom de metal escuro integrado ao piso
          roughness: 0.6,
          metalness: 0.7
        }); 
        const backMesh = new THREE.Mesh(backGeo, backMat);
        
        // MATEMÁTICA DO ACESSÓRIO: Calculamos o centro do cubo para que a sua face frontal 
        // fique projetada exatamente para fora, enquanto a traseira enterra no modelo.
        backMesh.position.z = 0.05 - (boxThickness / 2); 
        screenGroup.add(backMesh);

        // ── TELA DO CANVAS (HUD) ──
        const screenGeo  = new THREE.PlaneGeometry(7.35, 4.5);
        const screenMat  = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.9, color: 0xffffff });
        const screenMesh = new THREE.Mesh(screenGeo, screenMat);
        
        // Fixamos a tela de vidro milimetricamente por cima da face frontal do suporte de metal
        screenMesh.position.z = 0.06; 
        screenGroup.add(screenMesh);

        // O grupo mantém a interface de animação ativa
        screenGroup.userData = { isHud: true, canvas, texture };
        scene.add(screenGroup);
      });
    }, 100)

    return () => {
      clearTimeout(t)
      // Limpeza segura usando a referência da cena
      const currentScene = fgRef.current?.scene()
      if (currentScene) {
        while(currentScene.children.length > 0) {
          currentScene.remove(currentScene.children[0]);
        }
      }
    }
  }, [])

  // ── Zone transitions ─────────────────────────────────────────
  useEffect(() => {
    if (!fgRef.current) return
    const cam = fgRef.current.camera()
    if (!cam) return
    if (zone === 'reception') {
      cam.position.set(0, 30, 0)
      cam.lookAt(0, 0, 0)
      zoneData.current.current = 'reception'
    } else if (zone === 'library' && zoneData.current.current === 'reception') {
      zoneData.current.targetPos.set(0, 10, 10)
      zoneData.current.isTraveling = true
      zoneData.current.current = 'library'
    }
  }, [zone])

  // ── Unlock helper ────────────────────────────────────────────
  const unlock = useCallback(() => {
    isLockedOn.current  = false
    lockedTarget.current = null
    setLockedNode(null)
    if (fgRef.current) {
      const cam = fgRef.current.camera()
      if (cam) cam.rotation.order = 'YXZ'
    }
  }, [])

  // ── Input + animation loop ───────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k in keys.current) (keys.current as any)[k] = true
      // ESC to unlock
      if (e.key === 'Escape' && isLockedOn.current) unlock()
      // Any movement key also unlocks
      if (['w','a','s','d'].includes(k) && isLockedOn.current) unlock()
    }
    const onKeyUp   = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (k in keys.current) (keys.current as any)[k] = false }
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        isDragging.current  = true
        prevMouse.current   = { x: e.clientX, y: e.clientY }
        // Right-drag unlocks
        if (isLockedOn.current) unlock()
      }
    }
    const onMouseUp   = (e: MouseEvent) => { if (e.button === 2) isDragging.current = false }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || isFlying.current || zoneData.current.isTraveling || !fgRef.current || zone !== 'library') return
      
      const cam = fgRef.current.camera()
      if (!cam) return
      const dx = e.clientX - prevMouse.current.x
      const dy = e.clientY - prevMouse.current.y
      prevMouse.current = { x: e.clientX, y: e.clientY }
      cam.rotation.order = 'YXZ'
      cam.rotation.y -= dx * 0.005
      cam.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cam.rotation.x - dy * 0.005))
    }
    const onMouseClick = (e: MouseEvent) => {
      // Se estiver arrastando a câmera ou voando, ignora o clique
      if (isDragging.current || isFlying.current || zoneData.current.current !== 'library') return;
      if (!fgRef.current) return;

      const cam = fgRef.current.camera();
      const scene = fgRef.current.scene();

      // 1. Converte a posição do mouse na tela para coordenadas WebGL (-1 a +1)
      const pointer = new THREE.Vector2();
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

      // 2. Dispara o Laser
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, cam);

      // 3. Procura colisão APENAS com o grupo do Monitor
      const hudGroup = scene.children.find((c: any) => c.userData?.isHud);
      if (hudGroup) {
        // Verifica se o laser bateu em alguma malha dentro do grupo
        const intersects = raycaster.intersectObject(hudGroup, true);
        if (intersects.length > 0) {
          const hit = intersects[0];
          // Se o objeto atingido tiver coordenada UV (nossa tela com textura)
          if (hit.uv) {
            // Converte UV para os pixels do Canvas (1024x627)
            const cx = hit.uv.x * 1024;
            const cy = (1 - hit.uv.y) * 627; // Eixo Y no Three.js é invertido

            // HITBOX 1: Botão VOLTAR (x: 40 a 260, y: 40 a 100)
            if (cx >= 40 && cx <= 260 && cy >= 40 && cy <= 100) {
              window.dispatchEvent(new Event('vr-click-back'))
            }
            
            // HITBOX 2: Botão SALVAR (x: 764 a 984, y: 40 a 100)
            if (cx >= 764 && cx <= 984 && cy >= 40 && cy <= 100) {
              window.dispatchEvent(new Event('vr-click-save'))
            };
          }
        }
      }
    };

    const onCtxMenu = (e: Event) => e.preventDefault()

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('contextmenu', onCtxMenu)
    window.addEventListener('click', onMouseClick)

    let raf: number
    const animate = () => {
      if (fgRef.current) {
        const scene = fgRef.current.scene()
        const cam   = fgRef.current.camera()
        
        // ── Rotação das partículas do fundo ──
        if (particlesRef.current) {
          particlesRef.current.rotation.y += 0.00001; // Gira lentamente no eixo horizontal
          particlesRef.current.rotation.x += 0.00001; // Leve inclinação para parecer poeira real
        }

        if (cam) {
          // ── HUD canvas update ──────────────────────────────
          const hudGroup = scene.children.find((c: any) => c.userData?.isHud)
          if (hudGroup) {
            const { canvas, texture } = hudGroup.userData
            const ctx = canvas.getContext('2d')
            
            drawTerminalDashboard(ctx, canvas, {
              topic,
              graphData,
              selectedNodeId,
              isSaved: isSavedRef.current,
              isExpanding: isExpandingRef.current,
              isLockedOn: isLockedOn.current
            })

            texture.needsUpdate = true
          }

          // ── 1. Zone travel ─────────────────────────────────
          if (zoneData.current.isTraveling) {
            cam.position.lerp(zoneData.current.targetPos, 0.03)
            cam.lookAt(0, 0, 0)
            if (cam.position.distanceTo(zoneData.current.targetPos) < 2) {
              zoneData.current.isTraveling = false
              cam.rotation.order = 'YXZ'
            }
          }
          // ── 2. Fly to node ─────────────────────────────────
          else if (isFlying.current && flightData.current) {
            const tNorm = Math.min(1, (performance.now() - flightData.current.startTime) / flightData.current.duration)
            const ease = tNorm < 0.5 ? 2 * tNorm * tNorm : -1 + (4 - 2 * tNorm) * tNorm
            cam.position.lerpVectors(flightData.current.startPos, flightData.current.endPos, ease)
            cam.quaternion.slerpQuaternions(flightData.current.startQuat, flightData.current.endQuat, ease)
            if (tNorm >= 1) {
              isFlying.current = false
              flightData.current = null
              cam.rotation.order = 'YXZ'
              // ── Engage lock-on after flight completes ──────
              isLockedOn.current = true
            }
          }
          // ── 3. Lock-on orbit ──────────────────────────────
          else if (isLockedOn.current && lockedTarget.current) {
            cam.lookAt(lockedTarget.current)
          }
          // ── 4. Free FPS movement ───────────────────────────
          else if (zone === 'library') { 
            const speed = 1
            const dir = new THREE.Vector3()
            if (keys.current.w) dir.z -= speed; if (keys.current.s) dir.z += speed
            if (keys.current.a) dir.x -= speed; if (keys.current.d) dir.x += speed
            if (dir.lengthSq() > 0) { dir.applyQuaternion(cam.quaternion); cam.position.add(dir) }
          }
        }
      }
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('contextmenu', onCtxMenu)
      cancelAnimationFrame(raf)
    }
  }, [unlock, graphData.nodes.length])

  // ── nodeThreeObject ───────────────────────────────────────────
  // FIX: rings replaced with Sprites (always billboard to camera)
  const nodeThreeObject = useCallback((node: any) => {
    const n          = node as KnowledgeNode
    const isRoot     = n.id === 'root'
    const isSelected = n.id === selectedNodeId
    const isVisited  = n.visited === true
    const baseColor  = isVisited ? '#86efac' : getCategoryColor(n.category ?? 'default')
    const color      = new THREE.Color(baseColor)

    const group  = new THREE.Group()
    const radius = isRoot ? 3.5 : isSelected ? 2.5 : 1.5 // Tamanho dos nós

    // Core sphere
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(radius, 16, 16),
      new THREE.MeshPhongMaterial({
        color, emissive: color,
        emissiveIntensity: isSelected ? 1.2 : isVisited ? 0.9 : isRoot ? 0.8 : 0.5,
        transparent: true, opacity: isSelected ? 1 : 0.85, shininess: 80,
      })
    ))

    // ── Selection / visited indicator as a SPRITE (always faces camera) ──
    if (isRoot || isSelected || isVisited) {
      const ringCanvas  = document.createElement('canvas')
      ringCanvas.width  = 128
      ringCanvas.height = 128
      const rc = ringCanvas.getContext('2d')!
      rc.clearRect(0, 0, 128, 128)
      rc.beginPath()
      rc.arc(64, 64, 56, 0, Math.PI * 2)
      rc.strokeStyle = baseColor
      rc.lineWidth   = isSelected ? 5 : isRoot ? 4 : 3
      rc.globalAlpha = isSelected ? 0.85 : isRoot ? 0.7 : 0.5
      rc.stroke()
      // Dashed look for visited
      if (isVisited && !isSelected) {
        rc.setLineDash([10, 6])
        rc.beginPath()
        rc.arc(64, 64, 44, 0, Math.PI * 2)
        rc.strokeStyle = '#86efac'
        rc.lineWidth   = 2
        rc.globalAlpha = 0.4
        rc.stroke()
      }
      const ringSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(ringCanvas), transparent: true, depthWrite: false })
      )
      const ss = (radius + 1.5) * 2.5
      ringSprite.scale.set(ss, ss, 1)
      group.add(ringSprite)
    }

    // Label sprite (already billboarded by Three.js Sprite)
    const labelCanvas  = document.createElement('canvas')
    labelCanvas.width  = 256
    labelCanvas.height = 64
    const ctx = labelCanvas.getContext('2d')!
    ctx.clearRect(0, 0, 256, 64)
    ctx.fillStyle = isSelected ? '#f0f9ff' : isVisited ? '#86efac' : 'rgba(240,249,255,0.75)'
    ctx.font = isRoot ? 'bold 18px monospace' : '14px monospace'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    const label = n.title ?? n.id
    ctx.fillText(label.length > 20 ? label.slice(0, 18) + '…' : label, 128, 32)
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(labelCanvas), transparent: true, depthWrite: false })
    )
    const ss = isRoot ? 11 : 8
    sprite.scale.set(ss, ss * 0.25, 1)
    sprite.position.set(0, radius + 3, 0)
    group.add(sprite)

    return group
  }, [selectedNodeId])

  // ── handleNodeClick: fly + lock-on ───────────────────────────
  const handleNodeClick = useCallback((node: any) => {
    onNodeClick(node as KnowledgeNode)
    if (!fgRef.current) return
    const cam = fgRef.current.camera()
    if (!cam) return

    const nx = node.x || 0, ny = node.y || 0, nz = node.z || 0
    const nodePos  = new THREE.Vector3(nx, ny, nz)
    const dist     = nodePos.length()
    const distance = 20  // closer for lock-on
    const endPos   = dist < 1
      ? new THREE.Vector3(nx, ny, nz + distance)
      : nodePos.clone().multiplyScalar(1 + distance / dist)

    // ── TRAVA DE ALTURA DA CÂMERA ──
    endPos.y = Math.max(endPos.y, -12)
    endPos.y = Math.min(endPos.y, 16)

    // Store lock-on target BEFORE flight so it's ready when flight ends
    lockedTarget.current = nodePos.clone()
    setLockedNode(node as KnowledgeNode)

    const dummy = cam.clone()
    dummy.position.copy(endPos)
    dummy.lookAt(nx, ny, nz)

    flightData.current = {
      startPos:  cam.position.clone(),
      endPos,
      startQuat: cam.quaternion.clone(),
      endQuat:   dummy.quaternion.clone(),
      startTime: performance.now(),
      duration:  1000,
    }
    isFlying.current  = true
    isLockedOn.current = false  // will be set true when flight completes
  }, [onNodeClick])

  // ── Tree node select: fly without lock-on ────────────────────
  const handleTreeSelect = useCallback((node: KnowledgeNode) => {
    onNodeClick(node)
    if (!fgRef.current) return

    const cam = fgRef.current.camera()
    
    if (!cam) return
    
    const nx = node.x || 0, ny = node.y || 0, nz = node.z || 0
    const nodePos  = new THREE.Vector3(nx, ny, nz)
    const dist     = nodePos.length()
    const distance = 20
    const endPos   = dist < 1
      ? new THREE.Vector3(nx, ny, nz + distance)
      : nodePos.clone().multiplyScalar(1 + distance / dist)
    
    
    // ── TRAVA DE ALTURA DA CÂMERA ──
    endPos.y = Math.max(endPos.y, -12)
    endPos.y = Math.min(endPos.y, 16)
    
    lockedTarget.current = nodePos.clone()
    setLockedNode(node)
    const dummy = cam.clone(); dummy.position.copy(endPos); dummy.lookAt(nx, ny, nz)
    flightData.current = { startPos: cam.position.clone(), endPos, startQuat: cam.quaternion.clone(), endQuat: dummy.quaternion.clone(), startTime: performance.now(), duration: 900 }
    isFlying.current   = true
    isLockedOn.current = false
  }, [onNodeClick])

  const linkColor = useCallback((link: any) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
    return sourceId === 'root' ? 'rgba(125,211,252,0.4)' : 'rgba(165,180,252,0.2)'
  }, [])

  const linkWidth = useCallback((link: any) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
    return sourceId === 'root' ? 0.5 : 0.2
  }, [])

  return (
    <>
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData as any}
        width={dimensions.width} height={dimensions.height}
        nodeThreeObject={nodeThreeObject} nodeThreeObjectExtend={false}
        onNodeClick={handleNodeClick}
        linkColor={linkColor} linkWidth={linkWidth} linkOpacity={0.5}
        linkDirectionalParticles={2} linkDirectionalParticleWidth={0.8}
        linkDirectionalParticleColor={() => 'rgba(125,211,252,0.8)'}
        linkDirectionalParticleSpeed={0.003}
        nodeLabel={() => ''}
        d3AlphaDecay={0.01} d3VelocityDecay={0.85}
        enableNodeDrag={true} enableNavigationControls={false}
        showNavInfo={false}
      />

      {/* 2D Overlays e PORTAL — Garante que vão ficar por cima de tudo no navegador! */}
      {zone === 'library' && graphData.nodes.length > 0 && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
          <div style={{ pointerEvents: 'auto' }}>
            <NodeTree
              nodes={graphData.nodes}
              links={graphData.links}
              selectedNodeId={selectedNodeId}
              onSelect={handleTreeSelect}
            />
            <Minimap
              nodes={graphData.nodes}
              links={graphData.links}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleTreeSelect}
            />
            <LockOnHUD lockedNode={lockedNode} onUnlock={unlock} />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}