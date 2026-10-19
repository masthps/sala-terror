import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

// Origem: modelo GLB externo a ser colocado em public/models/hospital-bed.glb.
// Licença: confirmar a licença do arquivo antes de distribuí-lo com o projeto.
const GLB_MODEL = {
  path: '/models/hospital-bed.glb',
  position: new THREE.Vector3(0, 0, -2),
  scale: new THREE.Vector3(1, 1, 1),
}

// Origem: modelo OBJ externo a ser colocado em public/models/bedside-table.obj.
// Licença: confirmar a licença do OBJ e do MTL antes de distribuí-los com o projeto.
const OBJ_MODEL = {
  path: '/models/bedside-table.obj',
  materialPath: '/models/bedside-table.mtl',
  position: new THREE.Vector3(2, 0, -1),
  scale: new THREE.Vector3(1, 1, 1),
}

// Origem: terceiro modelo GLB externo a ser colocado em public/models/iv-stand.glb.
// Licença: confirmar a licença do arquivo antes de distribuí-lo com o projeto.
const THIRD_MODEL = {
  path: '/models/iv-stand.glb',
  position: new THREE.Vector3(-2, 0, -1),
  scale: new THREE.Vector3(1, 1, 1),
}

// Cria um cubo visível enquanto o modelo real não existe ou não pôde ser carregado.
function criarPlaceholder(position, scale) {
  const placeholder = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x7a3030, wireframe: true }),
  )
  placeholder.position.copy(position)
  placeholder.scale.copy(scale)
  return placeholder
}

// Ajusta a transformação de qualquer objeto carregado usando os valores do modelo.
function aplicarTransformacao(model, config) {
  model.position.copy(config.position)
  model.scale.copy(config.scale)
}

// Tenta carregar um GLB e substitui seu cubo placeholder sem interromper a cena.
async function carregarGLB(scene, config, placeholder) {
  try {
    const { scene: model } = await new GLTFLoader().loadAsync(config.path)
    aplicarTransformacao(model, config)
    scene.remove(placeholder)
    scene.add(model)
  } catch (error) {
    console.error(`Não foi possível carregar o modelo GLB ${config.path}.`, error)
  }
}

// Tenta carregar OBJ e MTL e mantém o cubo placeholder se qualquer etapa falhar.
async function carregarOBJ(scene, config, placeholder) {
  try {
    const materials = await new MTLLoader().loadAsync(config.materialPath)
    materials.preload()

    const model = await new OBJLoader()
      .setMaterials(materials)
      .loadAsync(config.path)

    aplicarTransformacao(model, config)
    scene.remove(placeholder)
    scene.add(model)
  } catch (error) {
    console.error(`Não foi possível carregar o modelo OBJ ${config.path}.`, error)
  }
}

// Adiciona três placeholders e inicia os carregamentos sem bloquear a renderização.
export function carregarModelos(scene) {
  const glbPlaceholder = criarPlaceholder(GLB_MODEL.position, GLB_MODEL.scale)
  const objPlaceholder = criarPlaceholder(OBJ_MODEL.position, OBJ_MODEL.scale)
  const thirdPlaceholder = criarPlaceholder(THIRD_MODEL.position, THIRD_MODEL.scale)

  scene.add(glbPlaceholder, objPlaceholder, thirdPlaceholder)

  void carregarGLB(scene, GLB_MODEL, glbPlaceholder)
  void carregarOBJ(scene, OBJ_MODEL, objPlaceholder)
  void carregarGLB(scene, THIRD_MODEL, thirdPlaceholder)
}