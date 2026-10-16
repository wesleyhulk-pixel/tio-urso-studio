# Tio Urso Studio — Alpha 1.1.2

## Correção das bordas do mockup da caneca tradicional

- Corrigido o mapeamento vertical da textura para evitar pontos brancos e falhas serrilhadas junto à base e ao topo da superfície externa da caneca.
- O desenho não é esticado: nos pontos que ultrapassam a janela de impressão do modelo Meshy, o renderizador usa a cor dos pixels da borda da própria arte.
- O filete cerâmico da boca e a base estrutural da caneca permanecem com o acabamento normal do modelo 3D.
- Largura da estampa, alça, giro 360°, camiseta, squeeze, chopp, editor, galeria e exportações PNG/MP4 não foram alterados.

## Atualizar pelo celular no GitHub

Este é um ZIP leve. Extraia e envie à **raiz do repositório** apenas:

1. `mock3d.js` — correção da textura;
2. `index.html` — número de versão 1.1.2 e atualização do cache;
3. `README.md` — descrição da versão no GitHub.

Substitua os existentes. **Não exclua** os modelos Meshy `.bin` / `.glb`, nem `app.js`, `style.css`, `tio-mp4.js` ou outros arquivos.

**Teste visual**: abrir o mockup com arte escura preenchendo toda a estampa, girar e conferir borda inferior e superior. A aparência final precisa de conferência no Android.
