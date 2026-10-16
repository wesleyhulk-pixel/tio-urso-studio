# Tio Urso Studio — Alpha 1.0.8 | GIF 360° corrigido

Esta é uma **atualização leve** sobre a Alpha 1.0.7. Nenhum modelo Meshy nem arquivo da galeria foi alterado.

## Correção
- O botão **Salvar Mockup GIF** gera 16 quadros de um giro completo de 360 graus.
- A geração usa o arquivo local `tio-gif-worker.js`, sem `Worker` vindo de outro domínio (corrige o bloqueio de segurança do Chrome/Android).
- Não precisa de biblioteca externa ou conexão com CDN para codificar o GIF.
- O GIF é salvo em 420 × 588 pixels para reduzir memória e tamanho de arquivo no celular; o PNG continua com sua resolução anterior.
- Ao final, o mockup retorna ao ângulo inicial que você estava visualizando.
- Giro, pinça, zoom, galeria, modelos 3D e demais botões da 1.0.7 foram preservados.

## Atualizar no GitHub
1. **Não apague** os arquivos que já estão no repositório.
2. Extraia o ZIP de atualização leve e envie **os 4 arquivos** para a raiz do repositório: `index.html`, `app.js`, `README.md`, **`tio-gif-worker.js`**.
3. Substitua os anteriores quando solicitado. O novo `tio-gif-worker.js` é obrigatório: sem ele o GIF não funciona.
4. Aguarde o GitHub Pages publicar. Deve aparecer **ALPHA 1.0.8** no cabeçalho.

O GIF é uma prévia promocional, não um arquivo de arte para sublimação.
