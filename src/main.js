import './style.css'
import * as THREE from 'three'
import { configurarCamera } from './camera.js'
import { configurarDiagnostico } from './diagnostico.js'
import { criarEntidade } from './entidade.js'
import { criarMateriaisCena } from './materiais.js'
import { carregarModelos } from './modelos.js'
import { configurarNavegacao, update } from './navegacao.js'

// Renderer WebGL com antialiasing para desenhar a cena na janela inteira.
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// M2: Habilita o motor de sombras suaves e o Tone Mapping fílmico
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0

document.getElementById('app').appendChild(renderer.domElement)

// Cena principal com uma cor de fundo escura para o clima de terror.
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x08090b)

// Câmera principal posicionada em uma altura aproximada à dos olhos.
const camera = configurarCamera()
// Adicionamos a câmera no grafo de cena para que objetos filhos dela (como a lanterna) se movam junto
scene.add(camera)

// Configura o mouse e o movimento WASD para controlar a câmera.
configurarNavegacao(camera)

// Timer que fornece o delta em segundos para o movimento independente de FPS.
const timer = new THREE.Timer()
timer.connect(document)

// ==========================================
// M3: MATERIAIS E TEXTURAS (HOSPITAL ABANDONADO)
// ==========================================
const materiais = criarMateriaisCena()

// Material de sangue coagulado (baixa rugosidade para refletir o brilho da lanterna)
const matSangue = new THREE.MeshStandardMaterial({
  color: 0x4a0404,
  roughness: 0.14,
  metalness: 0.05,
  normalMap: materiais.chao.normalMap,
  normalScale: new THREE.Vector2(0.4, 0.4),
})

// 1. QUARTO PRINCIPAL (10m x 8m, de z = -4 até z = 4)
const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), materiais.chao)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), materiais.teto)
ceiling.position.y = 4
ceiling.rotation.x = Math.PI / 2
ceiling.receiveShadow = true
scene.add(ceiling)

// 2. SEGUNDO CÔMODO / CORREDOR DO NECROTÉRIO (6m x 7m, de z = 4 até z = 11)
const floorRoom2 = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), materiais.chao)
floorRoom2.rotation.x = -Math.PI / 2
floorRoom2.position.set(0, 0, 7.5)
floorRoom2.receiveShadow = true
scene.add(floorRoom2)

const ceilingRoom2 = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), materiais.teto)
ceilingRoom2.position.set(0, 4, 7.5)
ceilingRoom2.rotation.x = Math.PI / 2
ceilingRoom2.receiveShadow = true
scene.add(ceilingRoom2)

// Dimensões das paredes
const wallHeight = 4
const wallThickness = 0.2

// Paredes do quarto principal (com abertura de porta em z = 4) + paredes do segundo cômodo
const walls = [
  // Parede Norte (fundo da cama, z = -4)
  [new THREE.BoxGeometry(10, wallHeight, wallThickness), [0, wallHeight / 2, -4], materiais.paredeLonga],
  // Parede Oeste (x = -5) e Leste (x = 5) do quarto principal
  [new THREE.BoxGeometry(wallThickness, wallHeight, 8), [-5, wallHeight / 2, 0], materiais.paredeCurta],
  [new THREE.BoxGeometry(wallThickness, wallHeight, 8), [5, wallHeight / 2, 0], materiais.paredeCurta],

  // Parede divisória Sul (z = 4) dividida com vão de porta central de 1.4m de largura por 2.3m de altura:
  [new THREE.BoxGeometry(4.3, wallHeight, wallThickness), [-2.85, wallHeight / 2, 4], materiais.paredeCurta],
  [new THREE.BoxGeometry(4.3, wallHeight, wallThickness), [2.85, wallHeight / 2, 4], materiais.paredeCurta],
  [new THREE.BoxGeometry(1.4, 1.7, wallThickness), [0, 3.15, 4], materiais.paredeCurta],

  // Paredes do Segundo Cômodo (x = -3, x = 3 e parede final em z = 11)
  [new THREE.BoxGeometry(wallThickness, wallHeight, 7), [-3, wallHeight / 2, 7.5], materiais.paredeCurta],
  [new THREE.BoxGeometry(wallThickness, wallHeight, 7), [3, wallHeight / 2, 7.5], materiais.paredeCurta],
  [new THREE.BoxGeometry(6, wallHeight, wallThickness), [0, wallHeight / 2, 11], materiais.paredeCurta],
]

for (const [geometry, position, material] of walls) {
  const wall = new THREE.Mesh(geometry, material)
  wall.position.set(...position)
  wall.castShadow = true
  wall.receiveShadow = true
  scene.add(wall)
}

// ==========================================
// ELEMENTOS EXTRAS DE CENÁRIO E TERROR
// ==========================================

// 1. Porta hospitalar entreaberta na passagem (z = 4) dando acesso ao 2º cômodo
const doorPivot = new THREE.Group()
doorPivot.position.set(-0.68, 0, 4.0)
doorPivot.rotation.y = 0.95 // Porta entreaberta (~55 graus)
const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.32, 2.28, 0.07), materiais.madeira)
doorPanel.position.set(0.66, 1.14, 0)
doorPanel.castShadow = true
doorPanel.receiveShadow = true
const doorHandle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), materiais.metal)
doorHandle.position.set(1.18, 1.05, -0.06)
const doorHandleBack = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), materiais.metal)
doorHandleBack.position.set(1.18, 1.05, 0.06)
doorPivot.add(doorPanel, doorHandle, doorHandleBack)
scene.add(doorPivot)

// 2. Poças e rastro de sangue no chão (da cama até o 2º cômodo) + manchas nas paredes
const bloodPools = [
  // Grande poça de sangue ao lado da cama hospitalar
  { radius: 0.85, scaleX: 1.3, scaleZ: 0.9, pos: [-0.65, 0.004, -1.6] },
  // Rastro de sangue arrastado passando pela porta
  { radius: 0.45, scaleX: 0.6, scaleZ: 2.4, pos: [-0.15, 0.004, 1.2] },
  { radius: 0.5, scaleX: 0.55, scaleZ: 2.8, pos: [0.05, 0.004, 4.2] },
  // Poça de sangue no segundo cômodo perto da maca tombada
  { radius: 1.0, scaleX: 1.2, scaleZ: 1.1, pos: [-0.8, 0.004, 7.4] },
]

for (const pool of bloodPools) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(pool.radius, 20), matSangue)
  mesh.rotation.x = -Math.PI / 2
  mesh.scale.set(pool.scaleX, pool.scaleZ, 1)
  mesh.position.set(...pool.pos)
  mesh.receiveShadow = true
  scene.add(mesh)
}

// Grandes manchas de sangue escorrido na parede atrás da cama e no corredor
const wallBloodBehindBed = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.5), matSangue)
wallBloodBehindBed.position.set(0, 1.45, -3.89)
scene.add(wallBloodBehindBed)

const wallBloodRoom2 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.9), matSangue)
wallBloodRoom2.position.set(-2.89, 1.4, 7.2)
wallBloodRoom2.rotation.y = Math.PI / 2
scene.add(wallBloodRoom2)

// 3. Janela hospitalar gradeada e bloqueada com tábuas pregadas (parede oeste x = -4.88)
const windowGroup = new THREE.Group()
windowGroup.position.set(-4.88, 2.0, -0.5)
const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 2.2), materiais.metal)
windowGroup.add(windowFrame)
// Barras de ferro verticais da janela psiquiátrica
for (let z = -0.8; z <= 0.8; z += 0.4) {
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.5, 8), materiais.metal)
  bar.position.set(0.02, 0, z)
  bar.castShadow = true
  windowGroup.add(bar)
}
// Tábuas de madeira pregadas tortas bloqueando a janela
const plankConfigs = [
  { y: 0.45, rotX: 0.12 },
  { y: 0.0, rotX: -0.08 },
  { y: -0.45, rotX: 0.06 },
]
for (const p of plankConfigs) {
  const plank = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 2.45), materiais.madeira)
  plank.position.set(0.06, p.y, 0)
  plank.rotation.x = p.rotX
  plank.castShadow = true
  plank.receiveShadow = true
  windowGroup.add(plank)
}
scene.add(windowGroup)

// 4. Armário médico de parede enferrujado (parede leste x = 4.72) com porta quebrada
const wallCabinet = new THREE.Group()
wallCabinet.position.set(4.72, 1.65, 1.2)
const cabBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.9, 0.7), materiais.metal)
cabBox.castShadow = true
cabBox.receiveShadow = true
const cabShelf = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.66), materiais.madeira)
const cabBrokenDoor = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.86, 0.66), materiais.madeira)
cabBrokenDoor.position.set(-0.22, -0.08, 0.25)
cabBrokenDoor.rotation.y = 0.85
cabBrokenDoor.rotation.z = 0.15 // Porta pendurada em uma dobradiça quebrada
cabBrokenDoor.castShadow = true
wallCabinet.add(cabBox, cabShelf, cabBrokenDoor)
scene.add(wallCabinet)

// 5. Maca cirúrgica tombada no segundo cômodo (z = 7.4)
const tippedGurney = new THREE.Group()
tippedGurney.position.set(-1.3, 0.48, 7.5)
tippedGurney.rotation.z = -1.15 // Tombada de lado
tippedGurney.rotation.y = 0.35
const gurneyTop = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 1.95), materiais.tecido)
gurneyTop.castShadow = true
gurneyTop.receiveShadow = true
const gurneyFrame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 2.05), materiais.metal)
gurneyFrame.position.y = -0.08
gurneyFrame.castShadow = true
tippedGurney.add(gurneyTop, gurneyFrame)
scene.add(tippedGurney)

// Luminária pendente no teto do quarto principal
const lampFixture = new THREE.Mesh(
  new THREE.CylinderGeometry(0.12, 0.28, 0.18, 16),
  materiais.metal,
)
lampFixture.position.set(0, 3.9, 0)
scene.add(lampFixture)

// Carrega os 3 modelos externos (hospital-bed.glb, bedside-table.obj/.mtl, iv-stand.glb)
carregarModelos(scene, materiais)

// ==========================================
// M2: ILUMINAÇÃO (SALA DE TERROR)
// ==========================================

// Luz 1: Luz Ambiente fria azulada de penumbra
const ambientLight = new THREE.AmbientLight(0x1a202c, 3.0)
scene.add(ambientLight)

// Luz 2: SpotLight do teto com intensidade compatível com física real
const spotLight = new THREE.SpotLight(0xffddaa, 400)
spotLight.position.set(0, 3.8, 0)
spotLight.angle = Math.PI / 3
spotLight.penumbra = 0.6
spotLight.decay = 2
spotLight.distance = 15

// Configuração das sombras da SpotLight
spotLight.castShadow = true
spotLight.shadow.mapSize.width = 1024
spotLight.shadow.mapSize.height = 1024
spotLight.shadow.camera.near = 0.1
spotLight.shadow.camera.far = 10
spotLight.shadow.bias = -0.001

scene.add(spotLight)
scene.add(spotLight.target)

// Luz 3: Lanterna do jogador (presa como filha da câmera no Grafo de Cena)
const lanterna = new THREE.SpotLight(0xeef6ff, 45)
lanterna.position.set(0.15, -0.1, 0)
lanterna.angle = Math.PI / 6
lanterna.penumbra = 0.5
lanterna.decay = 2
lanterna.distance = 14
lanterna.target.position.set(0, 0, -1)
camera.add(lanterna)
camera.add(lanterna.target)

// Atalho na tecla F para ligar/desligar a lanterna
window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyF') {
    lanterna.visible = !lanterna.visible
  }
})

// Cria a Entidade assustadora no segundo cômodo
const entidade = criarEntidade(scene, camera, materiais, lanterna)

// ==========================================

// Cria os controles visuais passando as luzes, materiais e a entidade para o painel
const diagnostico = configurarDiagnostico(
  scene,
  camera,
  renderer,
  ambientLight,
  spotLight,
  materiais,
  lanterna,
  entidade,
)

// Atualiza a projeção e o canvas quando o tamanho da janela muda.
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Atualiza o tempo, a navegação, a entidade e renderiza a cena continuamente.
renderer.setAnimationLoop((timestamp) => {
  timer.update(timestamp)
  const dt = timer.getDelta()
  update(dt)
  entidade.update(dt)
  renderer.render(scene, camera)
  diagnostico.update()
})
