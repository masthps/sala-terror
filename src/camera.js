import * as THREE from 'three'

// Campo de visão vertical em graus: define quanto da sala a câmera enquadra.
const CAMERA_FOV = 75

// Plano de corte próximo: 0.1 evita perder precisão excessiva no depth buffer.
// Um near muito baixo combinado com um far muito alto aumenta a relação far/near,
// reduz a precisão de profundidade e pode causar z-fighting entre superfícies.
const CAMERA_NEAR = 0.1

// Plano de corte distante: limita a distância renderizada sem tornar far/near grande demais.
const CAMERA_FAR = 100

// Cria a câmera na altura dos olhos e mantém seu aspect ratio atualizado no resize.
export function configurarCamera() {
  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR,
  )

  camera.position.set(0, 1.6, 3.5)
  camera.lookAt(0, 1.6, 0)

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  })

  return camera
}