import GUI from 'lil-gui'
import * as THREE from 'three'

const depthMaterial = new THREE.MeshDepthMaterial()
const originalFrustumCulled = new Map()

function paraCadaMaterial(mesh, action) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

  for (const material of materials) {
    if (material) action(material)
  }
}

export function configurarDiagnostico(
  scene,
  mainCamera,
  renderer,
  ambientLight,
  spotLight,
  materiais,
  lanterna,
  entidade,
) {
  const debugCamera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 50)
  debugCamera.position.set(0, 12, 0)
  debugCamera.lookAt(0, 0, 0)

  const cameraHelper = new THREE.CameraHelper(mainCamera)
  scene.add(cameraHelper)

  const settings = {
    wireframe: false,
    profundidade: false,
    backFaceCulling: true,
    frustum: true,
    frustumCulling: true,
    drawCalls: 0,
    triangles: 0,
    normalScale: 1.1,
    roughnessParedes: 0.88,
  }

  const gui = new GUI({ title: 'Diagnóstico, Luz & M3' })

  gui.add(settings, 'wireframe').name('Wireframe').onChange((enabled) => {
    scene.traverse((object) => {
      if (!object.isMesh) return
      paraCadaMaterial(object, (material) => {
        material.wireframe = enabled
      })
    })
  })

  gui.add(settings, 'profundidade').name('Profundidade').onChange((enabled) => {
    scene.overrideMaterial = enabled ? depthMaterial : null
  })

  gui.add(settings, 'backFaceCulling').name('Back-face culling').onChange((enabled) => {
    const side = enabled ? THREE.FrontSide : THREE.DoubleSide

    scene.traverse((object) => {
      if (!object.isMesh) return
      paraCadaMaterial(object, (material) => {
        material.side = side
        material.needsUpdate = true
      })
    })
  })

  gui.add(settings, 'frustum').name('Frustum').onChange((visible) => {
    cameraHelper.visible = visible
  })

  gui
    .add(settings, 'frustumCulling')
    .name('Frustum culling')
    .onChange((enabled) => {
      scene.traverse((object) => {
        if (!object.isMesh) return

        if (enabled) {
          object.frustumCulled = originalFrustumCulled.has(object)
            ? originalFrustumCulled.get(object)
            : true
          originalFrustumCulled.delete(object)
        } else {
          if (!originalFrustumCulled.has(object)) {
            originalFrustumCulled.set(object, object.frustumCulled)
          }
          object.frustumCulled = false
        }
      })
    })

  gui.add(settings, 'drawCalls').name('Draw calls').listen().disable()
  gui.add(settings, 'triangles').name('Triangles').listen().disable()

  // M2: Controles interativos de Iluminação
  if (ambientLight && spotLight) {
    const folderLuz = gui.addFolder('Iluminação (M2)')
    folderLuz.add(ambientLight, 'intensity', 0, 5, 0.1).name('Intens. Ambiente')
    folderLuz.add(spotLight, 'intensity', 0, 2000, 10).name('Intens. SpotLight')
    folderLuz.add(spotLight, 'castShadow').name('Projetar Sombras')
    if (lanterna) {
      folderLuz.add(lanterna, 'visible').name('Lanterna (Tecla F)').listen()
      folderLuz.add(lanterna, 'intensity', 0, 200, 5).name('Intens. Lanterna')
    }
    if (entidade) {
      folderLuz.add({ susto: () => entidade.dispararSusto() }, 'susto').name('Susto Entidade (E)')
    }
  }

  // M3: Controles interativos de Texturas, Normal Map (Relevo) e Rugosidade
  if (materiais) {
    const folderMat = gui.addFolder('Materiais & Relevo (M3)')
    folderMat
      .add(settings, 'normalScale', 0, 2.5, 0.05)
      .name('Relevo (Normal Map)')
      .onChange((val) => {
        for (const mat of materiais.listaMateriais) {
          if (mat.normalScale) {
            mat.normalScale.set(val, val)
          }
        }
      })

    folderMat.add(materiais.chao, 'roughness', 0, 1, 0.02).name('Rugosidade Chão')
    folderMat
      .add(settings, 'roughnessParedes', 0, 1, 0.02)
      .name('Rugosidade Paredes')
      .onChange((val) => {
        materiais.paredeLonga.roughness = val
        materiais.paredeCurta.roughness = val
      })
    folderMat.add(materiais.metal, 'metalness', 0, 1, 0.02).name('Metalicidade')
  }

  return {
    gui,
    debugCamera,
    update() {
      cameraHelper.update()
      settings.drawCalls = renderer.info.render.calls
      settings.triangles = renderer.info.render.triangles
    },
  }
}
