# Tio Urso Studio Alpha 0.5.1

Correções desta versão:

- ajuste da visualização do mockup para respeitar melhor frente/esquerda/direita e posição da alça;
- home revisada no estilo do conceito visual aprovado;
- catálogo de produtos revisado com camiseta e azulejos 20x20, 15x15 e 10x10;
- pacote completo com 6 arquivos: index.html, style.css, app.js, mock3d.js, README.md e mascote.png.

# Tio Urso Studio — Alpha 0.5 (teste)

## Novidades

- Tela inicial redesenhada com o mascote da imagem de conceito enviada pelo criador.
- Produtos: caneca tradicional (21 × 9,7 cm), chopp (20,5 × 14,5 cm), squeeze (24 × 15 cm), camiseta (área de impressão provisória de 28 × 35 cm) e azulejos 20 × 20 cm, 15 × 15 cm, 10 × 10 cm.
- Na prévia das canecas/chopp/squeeze, modelo 3D WebGL gerado localmente: o objeto, a estampa e a alça giram juntos. Gire com o dedo sobre o produto ou use o controle em graus. Se o navegador não oferecer WebGL, uma prévia alternativa 2D simplificada é utilizada.
- Camisetas e azulejos possuem modelos 2D específicos, sem reaproveitar o mockup da caneca.
- Permanecem as fontes, paleta, guias inteligentes, exportação em PNG/PDF e espelhamento com prévia.

## Instalação no GitHub Pages

1. Antes de atualizar, salve a arte atual como **projeto JSON** para não perder seu trabalho.
2. Extraia este ZIP. Na página `github.com/wesleyhulk-pixel/tio-urso-studio/upload/main`, envie **todos os seis arquivos**, não o ZIP. São eles: `index.html`, `style.css`, `app.js`, `mock3d.js`, `mascote.png`, `README.md`.
3. Ao enviar, confirme a substituição dos nomes existentes e faça **Commit changes**.
4. Depois da publicação, abra `https://wesleyhulk-pixel.github.io/tio-urso-studio/?v=0500` e confirme o indicador **ALPHA 0.5** no topo.
5. Se aparecer uma Alpha anterior, aguarde o GitHub Pages processar e faça recarregamento completo do navegador. O aplicativo não foi equipado com cache/offline novo nesta versão.

## Testes importantes

1. Abra uma arte de caminhão e selecione **Mockup** para caneca: arraste horizontalmente **sobre a caneca**. Veja se alça e desenho giram juntos. Compare ângulos -90°, 0°, 90° e 180°.
2. Teste os azulejos e a camiseta; devem usar seus próprios objetos ilustrativos.
3. Exporte PNG/PDF normal e espelhado, conferindo as dimensões reais e a orientação de letras.
4. Teste com uma arte conhecida, pois a visualização 3D é um modelo geométrico aproximado, não uma medição real do produto.

## Limitações

- **Beta** de rotação real em WebGL: nem todos os navegadores suportam ou habilitam aceleração gráfica. A renderização 3D foi verificada quanto à lógica, mas precisa ser confirmada no aparelho Android.
- As camisetas usam uma **área de impressão ilustrativa** de 28 × 35 cm, que não é tamanho universal. O modelo precisa ser personalizado depois.
- Os perfis ICC e cores de sublimação não estão implementados; as cores finais exigem testes com impressora, tinta e papel.
- O catálogo e o render 3D não são fidelidade física comercial; fornecem prévias para validar o conceito.
- Imagens são carregadas e processadas localmente no navegador, e os projetos são exportados para arquivo JSON. Não há cadastro, pagamento nem sincronização entre dispositivos nesta Alpha.
