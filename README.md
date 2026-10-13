# Tio Urso Studio — Alpha 0.1

Protótipo privado de teste do editor para sublimação. HTML, CSS e JavaScript puros; sem APIs, contas ou bibliotecas externas.

## Primeiros testes
1. Abra `index.html` no navegador ou envie **o conteúdo desta pasta** para a raiz de um repositório estático.
2. Para instalar no celular como PWA, publique via HTTPS (ex.: GitHub Pages), abra no Chrome e use **Adicionar à tela inicial / Instalar aplicativo** quando disponível.
3. Escolha Caneca 21 × 9,7 cm, use + Texto e Imagem, arraste na arte, veja o Mockup 2D.
4. Exporte PNG ou PDF, confirme dimensões com uma régua, teste impressão em 100%, verificando se o driver não faz ajuste para caber.
5. Antes de sair, clique **Salvar projeto** para baixar um JSON; depois use **Abrir projeto** para reabrir. Imagens ficam embutidas no projeto, tornando-o pesado.

## O que existe
- Editor responsivo com imagem, texto, seleção, movimento por toque, escala, rotação e camadas.
- Produtos com medidas predefinidas; PNG com pixelagem 300 DPI e metadado pHYs 300 DPI aproximado; PDF com página **do tamanho da estampa**.
- Mockup 2D ilustrativo para caneca, squeeze e chaveiro.
- Calculadora simples de custo + lucro percentual sobre o custo.
- Projetos exportados/importados em JSON, serviço offline PWA (após visita inicial e ativação).

## O que NÃO existe ainda
- Perfis ICC, driver de impressão, tratamento profissional de cores, calibração real, mockups 3D, dobra complexa da estampa, corte profissional, contas ou sincronização.
- Projetos NÃO são salvos automaticamente; baixe o JSON para manter seu trabalho.
- Nenhuma garantia de dimensões após o processamento por um app/driver de impressão: desative ajuste à página e imprima em escala 100%.
- O PDF tem formato físico do PRODUTO (não folha A4) e pode ser redimensionado por aplicativos/diálogos de impressão. Verifique antes de sublimar.
- Foto grande pode consumir bastante memória; imagens acima de 25 MB são rejeitadas, e dimensões longas são limitadas a 1700 px na edição; a exportação amplia a composição, mas não inventa detalhes.
- Testes em navegadores reais e impressoras ainda são necessários. Não é versão comercial.

## Segurança comercial
Código hospedado no GitHub Pages fica acessível ao público, ainda que o repositório seja privado. NÃO publique segredos, chaves de API, perfis de clientes ou código proprietário que queira manter sigiloso.

## Estrutura
- `index.html` Interface
- `style.css` Responsividade
- `app.js` Editor, mockups, PNG/PDF, orçamento
- `manifest.webmanifest` PWA
- `sw.js` Cache offline
- `icons/` Ícones demonstrativos

Projeto piloto, pensado para testar o fluxo celular -> arte -> mockup -> impressão, antes da etapa ICC.
