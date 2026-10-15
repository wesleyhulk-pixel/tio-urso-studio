# Tio Urso Studio — Alpha 0.9.3

## Camiseta Meshy 3D de verdade

A camiseta agora usa a malha real do GLB Meshy e a renderiza no mockup WebGL, em vez de desenhar uma silhueta 2D.

- Forma real da gola, mangas e dobras modeladas no Meshy.
- Estampa projetada sobre o tecido com área A4 reduzida proporcionalmente.
- Fundo transparente da arte acompanha a cor do tecido.
- Frente, costas, peito, mangas direita e esquerda, cor do corpo e acabamentos.
- Fallback 2D no navegador sem WebGL ou enquanto a malha carrega.
- Caneca de café, caneca de chopp e squeeze preservados.

**Observação:** o arquivo GLB gerado no Meshy não traz textura UV utilizável. As cores do tecido são aproximadas por iluminação no navegador; as áreas de impressão são uma projeção experimental, não um gabarito de sublimação.

## GitHub Pages

Envie os arquivos na raiz do repositório (ao lado do `index.html`), substituindo os anteriores.
