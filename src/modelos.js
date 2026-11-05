import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

const GLB_MODEL = {
  path: '/models/hospital-bed.glb',
  position: new THREE.Vector3(0, 0, -2),
  rotationY: 0,
  scale: new THREE.Vector3(1, 1, 1),
}

const OBJ_MODEL = {
  path: '/models/bedside-table.obj',
  materialPath: '/models/bedside-table.mtl',
  position: new THREE.Vector3(2, 0, -1),
  rotationY: -Math.PI / 8,
  scale: new THREE.Vector3(1, 1, 1),
}

const THIRD_MODEL = {
  path: '/models/iv-stand.glb',
  position: new THREE.Vector3(-2, 0, -1),
  rotationY: Math.PI / 6,
  scale: new THREE.Vector3(1, 1, 1),
}

function criarPlaceholder(position, scale) {
  const placeholder = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x7a3030, wireframe: true }),
  )
  placeholder.position.copy(position)
  placeholder.scale.copy(scale)
  placeholder.castShadow = true
  placeholder.receiveShadow = true
  return placeholder
}

function aplicarTransformacao(model, config) {
  model.position.copy(config.position)
  if (config.rotationY) {
    model.rotation.y = config.rotationY
  }
  model.scale.copy(config.scale)
}

// M2 & M3: Configura sombras e garante materiais PBR com relevo (normalMap) e rugosidade nos modelos
function configurarSombrasEMateriais(model, materiais, substituirPorPBR = false) {
  model.traverse((child) => {
    if (!child.isMesh) return

    child.castShadow = true
    child.receiveShadow = true

    if (substituirPorPBR && materiais) {
      // O MTLLoader cria MeshPhongMaterial por padrão; convertemos para MeshStandardMaterial (M3)
      // preservando o mapeamento UV do arquivo OBJ e aplicando normalMap + roughnessMap
      const nomeMat = child.material?.name || ''
      if (nomeMat.includes('Metal')) {
        child.material = materiais.metal
      } else {
        child.material = materiais.madeira
      }
    } else if (child.material && materiais) {
      const lista = Array.isArray(child.material) ? child.material : [child.material]
      for (const mat of lista) {
        if (mat && !materiais.listaMateriais.includes(mat)) {
          materiais.listaMateriais.push(mat)
        }
      }
    }
  })
}

async function carregarGLB(scene, config, placeholder, materiais) {
  try {
    const { scene: model } = await new GLTFLoader().loadAsync(config.path)
    aplicarTransformacao(model, config)
    configurarSombrasEMateriais(model, materiais, false)
    scene.remove(placeholder)
    scene.add(model)
  } catch (error) {
    console.error(`Não foi possível carregar o modelo GLB ${config.path}.`, error)
  }
}

async function carregarOBJ(scene, config, placeholder, materiais) {
  try {
    const mtl = await new MTLLoader().loadAsync(config.materialPath)
    mtl.preload()

    const model = await new OBJLoader()
      .setMaterials(mtl)
      .loadAsync(config.path)

    aplicarTransformacao(model, config)
    configurarSombrasEMateriais(model, materiais, true)
    scene.remove(placeholder)
    scene.add(model)
  } catch (error) {
    console.error(`Não foi possível carregar o modelo OBJ ${config.path}.`, error)
  }
}

export function carregarModelos(scene, materiais) {
  const glbPlaceholder = criarPlaceholder(GLB_MODEL.position, GLB_MODEL.scale)
  const objPlaceholder = criarPlaceholder(OBJ_MODEL.position, OBJ_MODEL.scale)
  const thirdPlaceholder = criarPlaceholder(THIRD_MODEL.position, THIRD_MODEL.scale)

  scene.add(glbPlaceholder, objPlaceholder, thirdPlaceholder)

  void carregarGLB(scene, GLB_MODEL, glbPlaceholder, materiais)
  void carregarOBJ(scene, OBJ_MODEL, objPlaceholder, materiais)
  void carregarGLB(scene, THIRD_MODEL, thirdPlaceholder, materiais)
}
