# Tio Urso Studio Alpha 0.5.8 — Correção de tela vazia

Corrige erro na construção da geometria da alça da caneca tradicional introduzido na Alpha 0.5.7.

## Mudanças
- Corrigido o argumento de coordenadas passado à malha da alça, que causava erro de JavaScript e fazia a caneca sumir.
- Verificação da renderização 3D e prévia 2D automática em caso de falha no WebGL, impedindo a tela vazia.
- Restaurada a apresentação do cenário selecionado atrás do modelo 3D.
- Mantidos os controles de cor conjunta da alça/interior e o editor da versão 0.5.7.
- Outros produtos não tiveram mudanças de geometria.

Arquivos para enviar à raiz do repositório: `index.html`, `style.css`, `app.js`, `mock3d.js`, `README.md`, `mascote.png`.

Salve o projeto antes de substituir os arquivos. Após enviar, abra o site com `?v=0580` para evitar cache antigo.
