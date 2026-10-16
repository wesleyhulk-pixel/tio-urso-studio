# Tio Urso Studio — Alpha 1.1.9

## Camiseta com cinco áreas independentes

- Frente (A4), costas (A4), peito (12 × 12 cm), braço direito (9 × 9 cm) e braço esquerdo (9 × 9 cm).
- Cada área mantém seu próprio conjunto de camadas, mesmo depois de trocar a posição de edição.
- O campo “Produto e medida”, durante a edição da camiseta, lista somente essas cinco posições; o painel visual de áreas também permite alternar entre elas.
- Indicadores mostram quais áreas já possuem arte e qual está sendo editada.
- O mockup 3D foi adaptado para aplicar as cinco texturas numa única camiseta, com a área do peito sobreposta à frente quando ambas têm estampa.
- Desfazer/refazer, JSON do projeto e Galeria incluem as cinco áreas.
- Salvar a estampa PNG/PDF continua exportando **a área selecionada**, na medida correspondente. Para obter todas as estampas de produção, alterne entre as cinco posições e exporte cada uma separadamente.
- Projetos antigos de camiseta continuam compatíveis: a arte antiga é tratada como a estampa da posição que estava selecionada.

## Instalar no GitHub

Use o ZIP **atualização leve**. Extraia e faça upload dos cinco arquivos (`index.html`, `app.js`, `mock3d.js`, `style.css`, `README.md`) diretamente na raiz do repositório, substituindo os antigos. Não apague os binários e GLBs Meshy que já estão publicados.

## Verificação

Testados no navegador: alternância entre áreas, camadas independentes, desfazer/refazer e exportação JSON contendo múltiplas áreas. O ambiente de teste não fornece WebGL; confira a aplicação simultânea das estampas no mockup 3D real do seu Android antes de usar em produção.

Esta versão NÃO tenta corrigir novamente o aro/borda do mockup da caneca. O foco é somente a edição multiarea da camiseta.
