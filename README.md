# Tio Urso Studio — Alpha 1.0.9 | Início enxuto e orçamento por produto

## Alterações
- A página inicial mostra **Novo projeto** e **Minha galeria**; os quatro cartões "Meu estúdio" foram retirados.
- Barra de navegação do rodapé removida. Nas telas internas, atalhos compactos levam a **Início**, **Editor**, **Mockup** e **Orçamento** sem apagar a arte em andamento.
- **Novo projeto** continua abrindo o aviso de proteção e a escolha de produto da versão anterior.
- Orçamento com dados e preço de venda **independentes por produto** (caneca tradicional, chopp, squeeze, camiseta e cada medida de azulejo).
- Os valores são configurados pelo usuário, sem preços fictícios. Os valores de cada produto ficam salvos no armazenamento local do navegador, como a galeria (não na nuvem).
- A criação de mockup PNG/GIF, os arquivos Meshy, camadas, editor, galeria, zoom, rotação e o worker GIF foram preservados.

## Para atualizar o GitHub
A partir da Alpha 1.0.8 com exportação GIF 360 funcionando, extraia o **ZIP leve** e substitua `index.html`, `app.js`, `style.css` e `README.md` na raiz do repositório. Não apague os modelos 3D, o `tio-gif-worker.js` nem as imagens já publicadas.

Se a versão anterior à 1.0.8 não tinha o `tio-gif-worker.js`, mantenha/instale esse arquivo da atualização 1.0.8 também.

## Teste
1. Veja a Home sem cartões "Meu estúdio" e sem barra inferior.
2. Em **Novo projeto**, selecione **Caneca tradicional**, edite a arte e toque em **Orçamento**.
3. Ajuste os custos e/ou o preço de venda; volte ao Editor, inicie outro produto e confira o orçamento independente.
4. Volte à Caneca tradicional e confirme que os valores anteriores foram preservados no mesmo navegador.
5. Entre no Mockup e na Galeria para confirmar que continuam funcionando.
