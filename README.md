# Tio Urso Studio — Alpha 1.1.13

## Correção: estampa centralizada nas duas mangas

- A estampa do braço direito e a do esquerdo ficam no **centro externo da manga**.
- A aplicação do desenho é limitada a cada manga, sem transpassar pelo tecido, sem imagem espelhada do outro lado.
- A janela de projeção foi dimensionada para manter o símbolo quadrado e visível, corrigindo a estampa pequena/cortada na versão anterior.
- Frente, costas, peito, camadas independentes, cores, giro, PNG e MP4 continuam com os mesmos recursos.
- **Não altera** os modelos Meshy nem o mapeamento da caneca, squeeze ou chopp.

## Instalar usando celular / GitHub

1. Extraia o ZIP leve (não faça upload do próprio ZIP).
2. Na raiz do repositório `tio-urso-studio`, substitua **index.html, mock3d.js e README.md** pelos três arquivos extraídos.
3. **Não remova** `app.js`, `style.css`, as imagens ou os arquivos binários dos modelos 3D.
4. Espere o GitHub Pages publicar a alteração e abra novamente a página. O cabeçalho deve mostrar **ALPHA 1.1.13**.

**Importante:** teste as estampas dos dois braços girando o mockup 360 graus no seu celular para validar o mapeamento no WebGL do Android.
