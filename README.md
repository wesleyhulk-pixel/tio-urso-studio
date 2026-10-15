# Tio Urso Studio — Alpha 1.0.0 (Editor: Histórico e Camadas)

Base: **Alpha 0.9.9 original** (giro infinito, zoom por pinça até 300%, mockups Meshy, camiseta, gola, cores, cenário e exportação preservados).

## Novidades do editor
- **Desfazer** ↶ e **Refazer** ↷; até 70 estados (ações contínuas de digitação/slider são agrupadas); atalhos Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z quando não estiver editando texto.
- **Camadas**: selecionar, ocultar, bloquear, subir/descer, duplicar, renomear e excluir. Ordem do topo da lista = frente da estampa.
- Elementos ocultos não aparecem nos mockups nem nas exportações. Elementos bloqueados não são movidos nem editados até desbloquear.
- Inclusão, exclusão, transformações, posição, camada, texto, cores de estampa, produto e posição da camiseta entram no histórico.
- Formato JSON de projeto preservado (`version:1`) e grava propriedades de camada (nome, oculto e bloqueado).

## Publicação no GitHub Pages
Envie **todos os 13 arquivos deste ZIP** à raiz do repositório, substituindo os arquivos anteriores. Não mova os arquivos binários Meshy para subpastas. Atualização de cache em index.html para `v=1000`.

Observação: o histórico vive apenas enquanto o editor está aberto. Para preservar o projeto entre sessões, use **Salvar projeto** (JSON).

A aparência e os gestos reais devem ser validados no Android depois de publicado.
