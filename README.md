# Tio Urso Studio — Alpha 0.7.3 — correção vertical do squeeze

## Mudança pontual
- A impressão 3D do **squeeze 600 ml** utiliza 7% a menos da borda inferior do arquivo de textura, redistribuindo a área restante no corpo do squeeze. Isso busca reduzir a faixa branca vista na base do mockup, sem criar uma faixa vazia na parte superior.
- A coordenada horizontal (U), responsável pela continuidade da estampa **360°**, foi preservada integralmente. A emenda já aprovada continua no mesmo lugar.
- **Caneca tradicional aprovada**: a geometria, a alça, o acabamento e o mapeamento não foram modificados.
- A tampa, bico e anel preto do squeeze permanecem conforme o modelo Meshy. O acabamento irregular da tampa não foi corrigido nesta atualização, para não alterar uma segunda parte sem validação.

## Como atualizar no GitHub pelo celular
1. Extraia o ZIP para a pasta Downloads.
2. Selecione os **9 arquivos** extraídos, não a pasta e não o ZIP.
3. No repositório `tio-urso-studio`, use **Add file → Upload files** na branch `main` e confirme a substituição dos arquivos com o mesmo nome.
4. Aguarde o GitHub Pages publicar. No topo da página deve aparecer **ALPHA 0.7.3**. Se não aparecer, abra a página em guia anônima ou use `?v=073` no endereço.
5. Teste as quatro posições do squeeze, a faixa inferior, a tampa e a emenda. O resultado deve ser validado no Android antes do uso em produção.

## Observação
A correção foi aplicada no mapeamento 3D, não na arte para impressão. A configuração de 24 × 15 cm e a exportação da estampa não foram modificadas. Como ainda não verificamos visualmente a nova composição no aparelho, considere esta uma versão de teste.
