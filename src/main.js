// Controles: WASD movimenta a câmera; clique captura o mouse; mousemove gira a visão.
import './style.css'
import * as THREE from 'three'
import { configurarCamera } from './camera.js'
import { configurarDiagnostico } from './diagnostico.js'
import { carregarModelos } from './modelos.js'
import { configurarNavegacao, update } from './navegacao.js'

// Renderer WebGL com antialiasing para desenhar a cena na janela inteira.
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

// Cena principal com uma cor de fundo escura para o clima de terror.
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x08090b)

// Câmera principal posicionada em uma altura aproximada à dos olhos.
const camera = configurarCamera()

// Configura o mouse e o movimento WASD para controlar a câmera.
configurarNavegacao(camera)

// Timer que fornece o delta em segundos para o movimento independente de FPS.
const timer = new THREE.Timer()
timer.connect(document)

// Chão horizontal da sala, com material preparado para iluminação futura.
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 8),
  new THREE.MeshStandardMaterial({ color: 0x3a3b3d }),
)
floor.rotation.x = -Math.PI / 2
scene.add(floor)

// Material compartilhado pelas quatro paredes da sala.
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x292b2e })

// Dimensões usadas para formar as paredes finas da sala retangular.
const wallHeight = 4
const wallThickness = 0.2

// Geometrias e posições das quatro paredes da sala.
const walls = [
  [new THREE.BoxGeometry(10, wallHeight, wallThickness), [0, wallHeight / 2, -4]],
  [new THREE.BoxGeometry(10, wallHeight, wallThickness), [0, wallHeight / 2, 4]],
  [new THREE.BoxGeometry(wallThickness, wallHeight, 8), [-5, wallHeight / 2, 0]],
  [new THREE.BoxGeometry(wallThickness, wallHeight, 8), [5, wallHeight / 2, 0]],
]

for (const [geometry, position] of walls) {
  const wall = new THREE.Mesh(geometry, wallMaterial)
  wall.position.set(...position)
  scene.add(wall)
}

// Carrega os modelos da sala e mantém cubos enquanto os arquivos não estão disponíveis.
carregarModelos(scene)

// Cria os controles visuais para inspecionar materiais e profundidade da cena.
const diagnostico = configurarDiagnostico(scene, camera, renderer)

// TESTE TEMPORÁRIO: remover na implementação final da M2
// Iluminação ambiente fraca para evitar que o chão e as paredes fiquem pretos.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
scene.add(ambientLight)

// Iluminação direcional acima e à frente da câmera, apontada para o centro da sala.
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
directionalLight.position.set(0, 4, 2)
directionalLight.target.position.set(0, 0, 0)
scene.add(directionalLight)
scene.add(directionalLight.target)

// Luz pontual no centro do teto para testar iluminação local.
const pointLight = new THREE.PointLight(0xffffff, 1.0)
pointLight.position.set(0, 4, 0)
scene.add(pointLight)

// Registra a quantidade de objetos e luzes presentes na cena de teste.
console.log('Objetos na cena:', scene.children.length)
console.log(
  'Luzes na cena:',
  scene.children.filter((object) => object.isLight).length,
)

// Atualiza a projeção e o canvas quando o tamanho da janela muda.
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Atualiza o tempo, a navegação e renderiza a cena continuamente.
renderer.setAnimationLoop((timestamp) => {
  timer.update(timestamp)
  update(timer.getDelta())
  renderer.render(scene, camera)
  diagnostico.update()
})
