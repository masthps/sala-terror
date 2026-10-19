import GUI from 'lil-gui'
import * as THREE from 'three'

// Material compartilhado pelo modo de profundidade para evitar recriá-lo a cada toggle.
const depthMaterial = new THREE.MeshDepthMaterial()

// Guarda o estado individual de cada mesh enquanto o frustum culling está desligado.
const originalFrustumCulled = new Map()

// Executa uma ação em cada material, incluindo materiais organizados em arrays.
function paraCadaMaterial(mesh, action) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

  for (const material of materials) {
    if (material) action(material)
  }
}

// Cria o painel com modos visuais úteis para inspecionar a geometria da cena.
export function configurarDiagnostico(scene, mainCamera, renderer) {
  // Câmera auxiliar acima da sala, preparada para uma futura viewport de cima.
  const debugCamera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 50)
  debugCamera.position.set(0, 12, 0)
  debugCamera.lookAt(0, 0, 0)

  // O helper representa visualmente o frustum da câmera principal na cena.
  const cameraHelper = new THREE.CameraHelper(mainCamera)
  scene.add(cameraHelper)

  // Estado dos cinco controles visuais e dos dois indicadores somente leitura.
  const settings = {
    wireframe: false,
    profundidade: false,
    backFaceCulling: true,
    frustum: true,
    frustumCulling: true,
    drawCalls: 0,
    triangles: 0,
  }

  const gui = new GUI({ title: 'Diagnóstico' })

  // Wireframe mostra as arestas e a distribuição dos triângulos de todos os meshes.
  gui.add(settings, 'wireframe').name('Wireframe').onChange((enabled) => {
    scene.traverse((object) => {
      if (!object.isMesh) return
      paraCadaMaterial(object, (material) => {
        material.wireframe = enabled
      })
    })
  })

  // Profundidade mostra a distância dos fragmentos à câmera em tons de cinza.
  gui.add(settings, 'profundidade').name('Profundidade').onChange((enabled) => {
    scene.overrideMaterial = enabled ? depthMaterial : null
  })

  // Back-face culling revela ou oculta as faces voltadas para o lado oposto da câmera.
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

  // Frustum mostra a região que a câmera principal consegue enxergar na cena.
  gui.add(settings, 'frustum').name('Frustum').onChange((visible) => {
    cameraHelper.visible = visible
  })

  // Frustum culling reduz chamadas de desenho ao não renderizar meshes fora da câmera.
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

  // Estes campos somente leitura mostram as métricas acumuladas do último render.
  gui.add(settings, 'drawCalls').name('Draw calls').listen().disable()
  gui.add(settings, 'triangles').name('Triangles').listen().disable()

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