# Tio Urso Studio — Alpha 0.4

**Versão de testes**, em HTML, CSS e JavaScript, projetada para funcionar diretamente no navegador do celular.

## O que mudou
- Mockup 2D de caneca com curvatura visual melhorada e controle de regiões (frente e lados), mantendo a arte de impressão independente.
- Identificação de versão 0.4 no cabeçalho; importante verificar para evitar cache de telas antigas.
- Nova interface adaptável, baseada na arte conceito: Início, Editor, Mockup, Produtos e Orçamento.
- Galeria visual com **28 fontes** (algumas usam Google Fonts e exigem conexão), busca e categorias; importação de arquivos TTF/OTF próprios.
- Paleta de **48 cores**, campo hexadecimal, seletor de cores e histórico local de cores recentes.
- Tela de exportação com botões **Normal / Espelhada**, mostrando a orientação de fato no canvas antes do download.
- PNG ~300 DPI com dimensões correspondentes ao produto e PDF com página do tamanho nominal da estampa.
- Editor de imagem e texto por toque, camadas simples, projeto JSON e mockup **2D ilustrativo**, além de calculadora de custos.

## Publicação via GitHub Pages
Coloque os quatro arquivos **index.html, app.js, style.css e README.md** na raiz (branch main), substituindo as versões antigas. Aguarde a publicação. Abra a URL normal com `?v=04` no final para reduzir a chance de cache do navegador.

**Atenção:** envie os arquivos individuais após extrair o ZIP, **não** o ZIP fechado nem a pasta inteira. O código-fonte de um projeto publicado no GitHub Pages é visível ao visitante.

## Teste de regressão sugerido
1. Na tela Editor, adicione um texto `Tio Urso` e uma imagem.
2. Abra a galeria de fontes e selecione uma fonte divertida.
3. Escolha uma cor na paleta ou digite um HEX, ex.: `#19C1C4`.
4. Toque em "Conferir e exportar arte" e alterne entre Normal e Espelhada: a prévia deve inverter o texto imediatamente.
5. Exporte em PNG/PDF e confira os arquivos.
6. Abra Mockup e teste um dos produtos.
7. Confira a precificação.

## Limitações importantes
- **Não aplica perfis ICC** e não garante fidelidade de cor; a gestão profissional de cores e impressão por Wi-Fi ficam para versões futuras.
- **Não é editor 3D**, nem tem sincronização de arquivos entre aparelhos.
- O mockup 2D é ilustrativo. A aparência e os tamanhos físicos devem ser conferidos na peça real.
- Ao imprimir, usar escala 100% e conferir espelhamento, margens e dimensões antes de sublimar.
- Arquivos PNG importados em alta resolução podem ser redimensionados internamente para reduzir uso de memória no celular; não extrapole a qualidade original.
- Projetos não são guardados automaticamente em servidor; use Salvar projeto (JSON) e guarde os arquivos.
- Fontes importadas devem ter licença adequada para uso comercial; algumas fontes online precisam de internet.

## Observação técnica
Reutiliza a base de documentos de projeto JSON da Alpha 0.2 (`version: 1`). A atualização de HTML/CSS/JS pode ser feita sem criar novo repositório ou refazer o aplicativo.
