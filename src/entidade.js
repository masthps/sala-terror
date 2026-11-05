import * as THREE from 'three'

/**
 * Cria a Entidade ("O Paciente Zero") usando hierarquia de Grafo de Cena (THREE.Group)
 * e gerencia sua animação de observação, piscar de luz de emergência e avanço (jumpscare).
 */
export function criarEntidade(scene, camera, materiais, lanterna) {
  const grupoEntidade = new THREE.Group()

  // Materiais da criatura: pele acinzentada pálida, avental sujo de sangue e olhos emissivos
  const matPele = new THREE.MeshStandardMaterial({
    map: materiais.paredeCurta.map,
    normalMap: materiais.paredeCurta.normalMap,
    roughness: 0.85,
    color: 0x555250,
  })

  const matAventalSangue = new THREE.MeshStandardMaterial({
    map: materiais.tecido.map,
    normalMap: materiais.tecido.normalMap,
    roughness: 0.9,
    color: 0x5a1818,
  })

  const matOlhoBrilhante = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff1100,
    emissiveIntensity: 4.0,
    roughness: 0.2,
  })

  const matBocaEscura = new THREE.MeshBasicMaterial({ color: 0x050202 })

  // 1. Torso alongado e curvado + avental hospitalar rasgado
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.15, 10), matAventalSangue)
  torso.position.y = 1.25
  torso.castShadow = true
  grupoEntidade.add(torso)

  // Pernas magras e compridas
  const pernaEsq = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.85, 8), matPele)
  pernaEsq.position.set(-0.1, 0.42, 0)
  pernaEsq.castShadow = true

  const pernaDir = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.85, 8), matPele)
  pernaDir.position.set(0.1, 0.42, 0)
  pernaDir.castShadow = true
  grupoEntidade.add(pernaEsq, pernaDir)

  // 2. Grupo da Cabeça (filho do grupoEntidade para inclinar e tremer de forma independente)
  const cabecaGroup = new THREE.Group()
  cabecaGroup.position.set(0, 1.95, 0.06)

  const cranio = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), matPele)
  cranio.scale.set(0.85, 1.25, 0.95)
  cranio.castShadow = true
  cabecaGroup.add(cranio)

  // Olhos vermelhos brilhantes no escuro
  const olhoEsq = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), matOlhoBrilhante)
  olhoEsq.position.set(-0.055, 0.04, 0.13)
  const olhoDir = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), matOlhoBrilhante)
  olhoDir.position.set(0.055, 0.04, 0.13)

  // Boca distorcida aberta em grito silencioso
  const boca = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.04), matBocaEscura)
  boca.position.set(0, -0.07, 0.13)

  cabecaGroup.add(olhoEsq, olhoDir, boca)
  grupoEntidade.add(cabecaGroup)

  // 3. Braços anormalmente longos articulados nos ombros
  const bracoEsqGroup = new THREE.Group()
  bracoEsqGroup.position.set(-0.22, 1.72, 0)
  const bracoEsqMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 1.1, 8), matPele)
  bracoEsqMesh.position.y = -0.5
  bracoEsqMesh.castShadow = true
  bracoEsqGroup.add(bracoEsqMesh)

  const bracoDirGroup = new THREE.Group()
  bracoDirGroup.position.set(0.22, 1.72, 0)
  const bracoDirMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 1.1, 8), matPele)
  bracoDirMesh.position.y = -0.5
  bracoDirMesh.castShadow = true
  bracoDirGroup.add(bracoDirMesh)

  grupoEntidade.add(bracoEsqGroup, bracoDirGroup)

  // Posição inicial: no fundo do segundo cômodo (corredor/anexo), na penumbra
  const POSICAO_INICIAL = new THREE.Vector3(0, 0, 9.2)
  grupoEntidade.position.copy(POSICAO_INICIAL)
  scene.add(grupoEntidade)

  // Luz de emergência vermelha piscante no segundo cômodo
  const luzEmergencia = new THREE.PointLight(0xff1a1a, 18, 9, 2)
  luzEmergencia.position.set(0, 3.7, 8.5)
  scene.add(luzEmergencia)

  let tempoAcumulado = 0
  let estado = 'espreitando' // 'espreitando' | 'atacando' | 'oculto'
  let timerOculto = 0

  function dispararSusto() {
    if (estado === 'atacando') return
    grupoEntidade.visible = true
    // Posiciona a entidade a alguns metros à frente de onde o jogador está ou no corredor
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    dir.y = 0
    dir.normalize()

    if (camera.position.z < 3.0) {
      // Se o jogador estiver no quarto principal, ela aparece na porta e avança!
      grupoEntidade.position.set(0, 0, 4.2)
    } else {
      grupoEntidade.position.set(0, 0, 9.2)
    }
    estado = 'atacando'
  }

  // Atalho Tecla E para testar o susto a qualquer momento
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE') {
      dispararSusto()
    }
  })

  function update(dt) {
    tempoAcumulado += dt

    // Faz a luz vermelha do 2º cômodo piscar como lâmpada em curto-circuito
    const pulso = Math.sin(tempoAcumulado * 17) * Math.cos(tempoAcumulado * 7)
    luzEmergencia.intensity = pulso > 0.2 ? 22 : 3

    if (estado === 'oculto') {
      timerOculto -= dt
      if (timerOculto <= 0) {
        // Reaparece silenciosamente no fundo do segundo cômodo
        grupoEntidade.position.copy(POSICAO_INICIAL)
        grupoEntidade.visible = true
        estado = 'espreitando'
      }
      return
    }

    // Sempre gira no eixo horizontal para encarar o jogador (head-tracking)
    grupoEntidade.lookAt(camera.position.x, 0, camera.position.z)

    // Movimentos involuntários assustadores na cabeça e nos braços
    cabecaGroup.rotation.z = Math.sin(tempoAcumulado * 6) * 0.28 + Math.sin(tempoAcumulado * 23) * 0.08
    cabecaGroup.rotation.x = Math.cos(tempoAcumulado * 4) * 0.12

    const dist = Math.hypot(
      camera.position.x - grupoEntidade.position.x,
      camera.position.z - grupoEntidade.position.z,
    )

    if (estado === 'espreitando') {
      bracoEsqGroup.rotation.x = Math.sin(tempoAcumulado * 2) * 0.15 - 0.2
      bracoDirGroup.rotation.x = -Math.sin(tempoAcumulado * 2) * 0.15 - 0.2

      // Se o jogador entrar no segundo cômodo ou chegar perto da porta (dist < 5.2m), ela ataca!
      if (dist < 5.2 && camera.position.z > 2.2) {
        estado = 'atacando'
      }
    } else if (estado === 'atacando') {
      // Levanta os braços compridos na direção do jogador e corre rápido!
      bracoEsqGroup.rotation.x = -1.35 + Math.sin(tempoAcumulado * 25) * 0.25
      bracoDirGroup.rotation.x = -1.35 - Math.sin(tempoAcumulado * 25) * 0.25

      const dirX = (camera.position.x - grupoEntidade.position.x) / (dist || 1)
      const dirZ = (camera.position.z - grupoEntidade.position.z) / (dist || 1)
      const velocidadeAtaque = 8.5

      grupoEntidade.position.x += dirX * velocidadeAtaque * dt
      grupoEntidade.position.z += dirZ * velocidadeAtaque * dt

      // Pisca a lanterna do jogador durante o ataque para dar pânico
      if (lanterna) {
        lanterna.intensity = Math.random() > 0.35 ? 65 : 4
      }
      luzEmergencia.intensity = 45

      // Quando encosta no jogador, treme a visão e some nas sombras!
      if (dist < 1.15) {
        grupoEntidade.visible = false
        if (lanterna) lanterna.intensity = 45
        estado = 'oculto'
        timerOculto = 6.0 // Reaparece após 6 segundos
      }
    }
  }

  return {
    grupoEntidade,
    luzEmergencia,
    dispararSusto,
    update,
  }
}
