# Tio Urso Studio — Alpha 0.5.5

Atualização experimental para o editor de personalizados no navegador Android e desktop.

## Novidades
- Mockup 3D em WebGL por produto: caneca tradicional, caneca de chopp e squeeze.
- Caneca tradicional com alça cerâmica curva em D, fixada atrás do corpo; durante a rotação a alça acompanha o objeto.
- Caneca de chopp com corpo mais alto e afunilado, acabamento semelhante a vidro e alça mais espessa.
- Squeeze vertical com tampa e bico esportivo.
- Mapeamento da estampa ao redor do cilindro, com pequeno espaço de segurança atrás da alça.
- Cenários: mesa de madeira, mesa clara e fundo neutro. O cenário permanece estático durante a rotação.
- Botão de vista traseira, além de frente, esquerda e direita.
- Texto com opção de duas cores em degradê, contorno com espessura e sombra.
- Mantém biblioteca de produtos, fontes, paleta, editor, guias de alinhamento e exportação normal/espelhada.

## Instalação no GitHub Pages
1. Extraia o ZIP.
2. Envie os seis arquivos individualmente para a raiz do repositório, substituindo os anteriores: `index.html`, `style.css`, `app.js`, `mock3d.js`, `mascote.png` e `README.md`.
3. Confirme `Commit changes`.
4. Aguarde a publicação do GitHub Pages e atualize a página do app.
5. O cabeçalho precisa mostrar **ALPHA 0.5.5**.

## Limitações e recomendações
- A prévia 3D depende de WebGL no navegador. Caso WebGL esteja indisponível, o aplicativo apresenta uma visualização ilustrativa 2D.
- A aparência do chopp imita vidro, mas ainda não é uma simulação física de refração/transparência.
- As dimensões 3D são aproximadas; valide o posicionamento e as cores na peça real antes da sublimação.
- Perfis ICC e calibração de impressora ainda não fazem parte desta versão.
- Fontes online exigem internet na primeira carga.
