import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'

// Velocidade horizontal da câmera em unidades do mundo por segundo.
const MOVEMENT_SPEED = 2.5

// Sensibilidade da rotação do mouse. A rotação ocorre durante a entrada do mouse.
// O valor representa a escala angular aplicada pelo PointerLockControls.
const ROTATION_SPEED = 1

// Câmera controlada pela navegação e instância que processa mouse e movimento.
let camera
let controls

// Teclas atualmente pressionadas para o movimento contínuo em cada quadro.
const pressedKeys = new Set()

// Configura o controle de mouse e registra as teclas usadas no movimento.
export function configurarNavegacao(cameraToControl) {
  camera = cameraToControl
  controls = new PointerLockControls(camera, document.body)
  controls.pointerSpeed = ROTATION_SPEED

  document.body.addEventListener('click', () => controls.lock())
  window.addEventListener('keydown', (event) => pressedKeys.add(event.code))
  window.addEventListener('keyup', (event) => pressedKeys.delete(event.code))
}

// Atualiza o deslocamento horizontal usando o tempo decorrido desde o último quadro.
export function update(dt) {
  if (!controls) return

  // Multiplicar pela velocidade e por dt torna o movimento independente da taxa de frames:
  // a câmera percorre a mesma distância por segundo em computadores diferentes.
  const distance = MOVEMENT_SPEED * dt

  if (pressedKeys.has('KeyW')) controls.moveForward(distance)
  if (pressedKeys.has('KeyS')) controls.moveForward(-distance)
  if (pressedKeys.has('KeyD')) controls.moveRight(distance)
  if (pressedKeys.has('KeyA')) controls.moveRight(-distance)

  // WASD não pode produzir voo: a navegação conserva a altura dos olhos.
  camera.position.y = 1.6
}