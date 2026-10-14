# Tio Urso Studio — Alpha 0.7.0 (teste Meshy)

Nesta versão **somente a caneca tradicional** passa a usar a geometria 3D real fornecida pelo usuário no arquivo GLB do Meshy. O modelo foi convertido em `meshy-caneca.bin` para o renderizador WebGL leve já utilizado pelo app. Não é necessário publicar o GLB original no GitHub.

## Teste

1. Envie **todos os sete arquivos** deste ZIP para a raiz do repositório (branch `main`), substituindo os seis antigos e adicionando `meshy-caneca.bin`.
2. Abra o GitHub Pages depois do deploy e confirme **ALPHA 0.7.0**.
3. No editor, escolha **Caneca tradicional (21 × 9,7 cm)** e adicione sua arte.
4. Em **Mockup**, verifique frente, lados e trás, principalmente o comportamento da alça e da emenda.
5. Teste a paleta de cores da alça e do interior e a escolha de cenários.

## Funcionamento e limitações

- O corpo e a alça são geometria real do Meshy, com alça posicionada atrás na frente 0°.
- A estampa usa projeção cilíndrica calculada e aplicada somente no exterior, não o UV original do Meshy.
- A alça e o interior usam uma única cor configurável.
- O modelo ocupa ~8,7 MB em formato de vértices; o carregamento inicial pode demorar em celulares mais lentos ou na rede móvel.
- Se a geometria não carregar, o app mantém a prévia ilustrativa anterior.
- A compatibilidade WebGL e a fidelidade da impressão devem ser validadas no celular antes do uso comercial.
- Squeeze, chopp, camiseta, azulejos e funcionalidades de editor/exportação foram preservados da versão anterior.
- A arte de impressão continua separada do mockup; nenhuma alteração de arte ou medida foi feita.

Este protótipo não depende de scripts JavaScript externos para desenhar o modelo 3D e não envia projetos para servidores.
