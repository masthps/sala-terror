# Sala de Terror — Quarto de Hospital Abandonado (Three.js)

Projeto prático da disciplina de **Computação Gráfica (2026)** — IFSP São João da Boa Vista (Prof. Gabriel M. Alves).

## Integrantes da Equipe
- **Matheus Henrique Pereira Soares** — BV304369X
- **Kevyn Robert do Vale Gandolfi** — BV3045331
- **Gustavo Hideki Scaranello** — BV3043312

---

## 1. Descrição do Projeto e Tema
A aplicação consiste em um mundo explorável em primeira pessoa desenvolvido com **Three.js** e **Vite**, ambientado em uma **sala abandonada de hospital**. O cenário foi projetado com foco em tensão visual: paredes com pintura hospitalar descascada e infiltrações, piso cerâmico encardido com rejuntes profundos, iluminação focalizada sobre uma cama hospitalar enferrujada (`hospital-bed.glb`), mesa de cabeceira de madeira desgastada (`bedside-table.obj` / `bedside-table.mtl`) e suporte de soro metálico (`iv-stand.glb`).

---

## 2. Instruções de Execução

Certifique-se de estar na pasta do projeto (`sala-terror`) e execute:

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal (por padrão `http://localhost:5173`) no navegador.

### Controles de Navegação
- **Clique na tela**: Ativa o bloqueio do cursor (`PointerLockControls`) para rotação da câmera em primeira pessoa.
- **Mouse**: Olhar ao redor (rotação da câmera).
- **W / A / S / D**: Movimentação pelo quarto (independente de taxa de quadros via `THREE.Timer`).
- **Tecla F**: Liga / desliga a **lanterna** do jogador.
- **ESC**: Libera o cursor do mouse para interagir com o painel de diagnóstico (`lil-gui`) no canto superior direito.

---

## 3. Decisões Técnicas

### 3.1 Pipeline de Visualização e Câmera (M1)
- **`PerspectiveCamera`**: Configurada com `FOV = 75°`, altura fixa de olhos humanos (`y = 1.6m`), `near = 0.1` e `far = 100`.
- **Relação `far / near`**: Escolheu-se `near = 0.1` (em vez de valores extremos como `0.0001`) e `far = 100` para preservar a precisão logarítmica do **Z-buffer (depth buffer)** e evitar artefatos de *z-fighting* entre superfícies próximas (como o colchão sobre o estrado e a porta junto à parede).
- **Modo Diagnóstico (`src/diagnostico.js`)**: Permite alternar em tempo real *Wireframe*, mapa de profundidade (`MeshDepthMaterial` em `scene.overrideMaterial`), *Back-face culling* (`THREE.FrontSide` vs `THREE.DoubleSide`), visualização do `CameraHelper` (frustum) e comparação de *Draw Calls* e *Triângulos* com e sem *Frustum Culling*.

### 3.2 Iluminação e Sombras (M2)
- **Luz Ambiente (`THREE.AmbientLight`, cor `0x1a202c`, intensidade `1.5`)**: Utiliza uma tonalidade fria e azulada para simular penumbra noturna, garantindo visibilidade mínima nas regiões fora do cone principal sem destruir o contraste dramático.
- **Foco Direcional (`THREE.SpotLight`, cor `0xffddaa`, intensidade `400`)**: Posicionada na luminária central do teto (`y = 3.8`), com `angle = Math.PI / 3`, `penumbra = 0.6` e atenuação física (`decay = 2`). Cria um cone de luz amarelada envelhecida sobre o centro da sala, deixando os cantos em penumbra e gerando tensão visual.
- **Lanterna na Câmera (`THREE.SpotLight` filha da `camera`)**: Exemplo prático de hierarquia no **Grafo de Cena** (`camera.add(lanterna)` e `camera.add(lanterna.target)` com alvo em `(0, 0, -1)`). Como a lanterna é filha da câmera, ela herda automaticamente a matriz de transformação (posição e rotação) do jogador ao andar e mover o mouse, permitindo iluminar os detalhes de relevo (`normalMap`) das paredes. Pode ser alternada com a **tecla F** ou pelo painel `lil-gui`.
- **Sombras (`PCFSoftShadowMap`) e Tone Mapping (`ACESFilmicToneMapping`)**: O mapa de sombras utiliza resolução `1024x1024`, `near = 0.1`, `far = 10` e `bias = -0.001` para evitar *shadow acne* nas paredes e móveis, produzindo bordas suaves.

### 3.3 Texturas e Materiais PBR (M3)
Implementados no módulo `src/materiais.js` utilizando `THREE.MeshStandardMaterial` com mapeamento UV (`THREE.RepeatWrapping`), espaço de cor `THREE.SRGBColorSpace` para mapas de cor (albedo) e espaço linear para mapas matemáticos:
1. **Cerâmica Hospitalar Suja (Chão)**: Textura de ladrilhos com repetição UV `5x4` (proporcional ao plano `10m x 8m`), `normalMap` destacando o baixo-relevo dos rejuntes e rachaduras, e `roughnessMap` diferenciando o esmalte gasto do ladrilho (`roughness` menor) do rejunte sujo e fosco (`roughness` alto).
2. **Reboco Descascado com Infiltração (Paredes)**: Mapeamento UV ajustado às dimensões das paredes (`2.5x1` e `2x1`), com `normalMap` acentuando áreas onde a tinta hospitalar descascou expondo o reboco áspero, e alta rugosidade (`roughness = 0.88`).
3. **Madeira Envelhecida (Mesa de Cabeceira OBJ e Porta)**: Fibras e veios de madeira com `normalMap` e `roughness = 0.72`.
4. **Metal Oxidado / Enferrujado (Cama Hospitalar GLB, Suporte de Soro GLB, Luminária e Ferragens)**: Alta metalicidade (`metalness = 0.78`) combinada com mapas de rugosidade e normais que contrastam o aço polido com manchas ásperas de ferrugem.
5. **Tecido Hospitalar Manchado (Colchão e Travesseiro)**: Trama têxtil com costuras acolchoadas no `normalMap` e superfície fosca (`roughness = 0.92`, `metalness = 0.0`).

---

## 4. Créditos, Licenças e Ativos
- **Biblioteca Gráfica**: [Three.js](https://threejs.org/) (Licença MIT) & [lil-gui](https://lil-gui.georgealways.com/) (Licença MIT).
- **Modelos 3D (`public/models/`)**:
  - `hospital-bed.glb` (Formato glTF 2.0 Binário) — Cama hospitalar metálica com grades, rodízios e colchão texturizado (CC0 / Autoria própria procedural para o projeto).
  - `bedside-table.obj` + `bedside-table.mtl` (Formato Wavefront OBJ/MTL) — Mesa de cabeceira hospitalar com gaveta e puxadores metálicos (CC0 / Autoria própria procedural para o projeto).
  - `iv-stand.glb` (Formato glTF 2.0 Binário) — Suporte de soro hospitalar com rodízios e bolsa de fluido (CC0 / Autoria própria procedural para o projeto).
- **Texturas PBR (`public/textures/`)**:
  - Mapas de Albedo (`_color.png`), Normal (`_normal.png`) e Rugosidade (`_roughness.png`) de piso cerâmico, parede descascada, teto mofado, madeira envelhecida, metal oxidado e tecido hospitalar (CC0 / Domínio Público).

---

## 5. Nota de Transparência de IA
- **O que foi solicitado à IA**: Auxílio na organização dos módulos de texturas PBR (`src/materiais.js`), geração dos ativos de modelos 3D (`hospital-bed.glb`, `bedside-table.obj/.mtl`, `iv-stand.glb`) e mapas de textura (`color`, `normal`, `roughness`), além da configuração da lanterna acoplada ao grafo de cena da câmera.
- **O que foi validado e ajustado manualmente pela equipe**: Ajuste das intensidades das luzes (`AmbientLight` e `SpotLight`), posicionamento e escala dos modelos na sala, calibração da repetição UV (`RepeatWrapping`) nas paredes e chão para evitar estiramento de textura, e verificação das métricas do modo diagnóstico (`wireframe`, `z-buffer`, `back-face culling` e `frustum culling`).
