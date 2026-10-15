# Tio Urso Studio — Alpha 1.0.2

## Melhorias desta versão
- O botão **Início** do rodapé agora, como antes, **apenas navega** e mantém a arte.
- O botão **＋ Novo projeto** da página inicial verifica se existe projeto em andamento.
- Com uma arte existente, abre um **aviso de confirmação** com botões **Cancelar** (preserva tudo) e **Confirmar** (apaga o projeto atual e abre o editor vazio).
- Sem projeto em andamento, **Novo projeto** abre diretamente o editor vazio, sem alertas desnecessários.
- O botão **↺ Novo** dentro do editor usa a mesma confirmação.
- Na confirmação, informações do projeto (camadas, cores, seleção, produto, cenários e histórico de desfazer/refazer) são reiniciadas. Para recuperar depois, **salve um arquivo de projeto antes de confirmar**.
- Diálogo próprio, legível no celular, fechado por Cancelar, tecla Escape ou toque fora do cartão.
- **Desfazer, refazer, camadas, gestos na área da arte, modelos Meshy, giro livre e zoom por pinça nos mockups** foram mantidos.

## Como publicar
Descompacte o ZIP e envie os **13 arquivos dentro dele** para a raiz do GitHub, substituindo os arquivos antigos. Atualize o navegador e verifique `ALPHA 1.0.2`.

## Teste rápido
1. Crie um texto ou importe uma imagem no editor.
2. Toque em **Início**: a arte deve continuar existindo.
3. Toque em **Novo projeto**: o aviso aparece.
4. **Cancelar**: o projeto permanece.
5. Volte em **Novo projeto** e toque **Confirmar**: o editor abre vazio.
6. Toque **Novo projeto** de novo, sem arte: a tela do editor abre sem confirmação.
