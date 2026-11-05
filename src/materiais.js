import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader()

/**
 * Carrega um conjunto de texturas PBR (cor/albedo, mapa de normais e mapa de rugosidade)
 * configurando a repetição UV (RepeatWrapping) e o espaço de cor correto (sRGB apenas para cor,
 * mantendo LinearSRGBColorSpace para dados matemáticos de normal e rugosidade).
 */
function carregarConjuntoTexturas(prefixo, repeatX = 1, repeatY = 1) {
  const map = textureLoader.load(`/textures/${prefixo}_color.png`)
  const normalMap = textureLoader.load(`/textures/${prefixo}_normal.png`)
  const roughnessMap = textureLoader.load(`/textures/${prefixo}_roughness.png`)

  // A textura de cor (albedo) deve estar em sRGB para reprodução fiel de brilho e tom
  map.colorSpace = THREE.SRGBColorSpace

  for (const tex of [map, normalMap, roughnessMap]) {
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(repeatX, repeatY)
  }

  return { map, normalMap, roughnessMap }
}

/**
 * M3: Cria os materiais PBR (MeshStandardMaterial) do cenário e dos objetos da sala de terror.
 * Inclui múltiplos materiais distintos (cerâmica, reboco, concreto, madeira, metal oxidado e tecido)
 * utilizando mapeamento UV, normalMap (relevo) e roughnessMap (rugosidade).
 */
export function criarMateriaisCena() {
  // 1. Chão (10m x 8m): repetição 5x4 mantém os ladrilhos quadrados sem distorção UV
  const chaoTex = carregarConjuntoTexturas('floor', 5, 4)
  const chao = new THREE.MeshStandardMaterial({
    map: chaoTex.map,
    normalMap: chaoTex.normalMap,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: chaoTex.roughnessMap,
    roughness: 0.75,
    metalness: 0.05,
  })

  // 2. Paredes longas (10m x 4m) e curtas (8m x 4m): reboco hospitalar descascado com infiltração
  const paredeLongaTex = carregarConjuntoTexturas('wall', 2.5, 1)
  const paredeLonga = new THREE.MeshStandardMaterial({
    map: paredeLongaTex.map,
    normalMap: paredeLongaTex.normalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    roughnessMap: paredeLongaTex.roughnessMap,
    roughness: 0.88,
    metalness: 0.02,
  })

  const paredeCurtaTex = carregarConjuntoTexturas('wall', 2, 1)
  const paredeCurta = new THREE.MeshStandardMaterial({
    map: paredeCurtaTex.map,
    normalMap: paredeCurtaTex.normalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    roughnessMap: paredeCurtaTex.roughnessMap,
    roughness: 0.88,
    metalness: 0.02,
  })

  // 3. Teto (10m x 8m): placas acústicas/concreto mofado
  const tetoTex = carregarConjuntoTexturas('ceiling', 5, 4)
  const teto = new THREE.MeshStandardMaterial({
    map: tetoTex.map,
    normalMap: tetoTex.normalMap,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughnessMap: tetoTex.roughnessMap,
    roughness: 0.92,
    metalness: 0.0,
  })

  // 4. Madeira envelhecida: usada na mesa de cabeceira (OBJ), porta e rodapés
  const madeiraTex = carregarConjuntoTexturas('wood', 1, 1)
  const madeira = new THREE.MeshStandardMaterial({
    map: madeiraTex.map,
    normalMap: madeiraTex.normalMap,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughnessMap: madeiraTex.roughnessMap,
    roughness: 0.72,
    metalness: 0.05,
  })

  // 5. Metal oxidado/enferrujado: usado em ferragens, luminária, maçaneta e estruturas metálicas
  const metalTex = carregarConjuntoTexturas('metal', 1, 1)
  const metal = new THREE.MeshStandardMaterial({
    map: metalTex.map,
    normalMap: metalTex.normalMap,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: metalTex.roughnessMap,
    roughness: 0.55,
    metalness: 0.78,
  })

  // 6. Tecido hospitalar manchado: colchão e travesseiro
  const tecidoTex = carregarConjuntoTexturas('fabric', 1, 1)
  const tecido = new THREE.MeshStandardMaterial({
    map: tecidoTex.map,
    normalMap: tecidoTex.normalMap,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughnessMap: tecidoTex.roughnessMap,
    roughness: 0.92,
    metalness: 0.0,
  })

  return {
    chao,
    paredeLonga,
    paredeCurta,
    teto,
    madeira,
    metal,
    tecido,
    listaMateriais: [chao, paredeLonga, paredeCurta, teto, madeira, metal, tecido],
  }
}
