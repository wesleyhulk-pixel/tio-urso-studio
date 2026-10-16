# Tio Urso Studio — Alpha 1.1.12

## Atualização leve: estampa única na parte externa das mangas

**Problema:** a malha 3D Meshy da camiseta possui superfície externa e parte interna da abertura das mangas. A versão 1.1.11 ainda aplicava o desenho sobre as duas superfícies, resultando em estampas atravessadas ou espelhadas, especialmente durante o giro lateral.

**Alteração:** a pintura da manga direita e da manga esquerda agora usa mapeamento projetado na face externa, com máscara de orientação da superfície, janela vertical e coordenadas que acompanham a inclinação de cada braço. O sentido horizontal é invertido **somente nas coordenadas de projeção**, não na arte: assim, ela se mantém legível dos dois lados.

Mantidos: áreas independentes de frente, costas, peito, manga direita e manga esquerda; exportação; toque, pinça e giro livre; cenário; demais mockups; e projetos gravados.

## Como instalar no GitHub Pages

Este ZIP contém **apenas os cinco arquivos atualizados**, sem arquivos pesados. Extraia e substitua na raiz do repositório `index.html`, `app.js`, `mock3d.js`, `style.css` e `README.md`. **Não apague** as imagens e os arquivos binários 3D Meshy já presentes no GitHub.

A página passa a indicar **Alpha 1.1.12**. No celular, recarregue a página para obter o novo `mock3d.js` (versão do arquivo alterada para evitar cache antigo).

## Limitação de validação

O mapeamento e as regiões da malha 3D foram inspecionados geometricamente e uma prévia da distribuição da impressão foi conferida; porém o navegador de testes deste ambiente não disponibiliza WebGL. **Ainda é necessária validação visual no aparelho Android**; não é possível garantir o resultado final sem conferir o mockup no celular.
