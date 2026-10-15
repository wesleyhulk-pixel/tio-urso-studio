# Tio Urso Studio — Alpha 1.0.4

## Ajustes desta versão
- O aviso de **Novo projeto** agora exibe a **arte “ATENÇÃO!!!” do Tio Urso** fornecida pelo usuário, com transparência, no lugar do emoji pequeno.
- Ao clicar em **Cancelar**, o aviso se fecha e a tela volta **automaticamente ao Editor**, preservando a arte, as camadas, a seleção, as cores e o histórico de desfazer/refazer.
- Cancelar pelo toque fora do aviso ou pela tecla Escape também retorna ao Editor sem apagar nada.
- **Confirmar** continua apagando o projeto anterior e abrindo o editor limpo.
- **Início** continua apenas navegando: não apaga o projeto.
- A arte do aviso é armazenada como `aviso-urso.webp` para carregar rápido no celular.
- Todos os recursos da **1.0.2**, incluindo gestos por pinça, camadas e modelos Meshy, foram preservados. `mock3d.js` e todos os modelos 3D estão intactos.

## Publicação
Extraia o ZIP. Envie **todos os arquivos da pasta** (agora 16, incluindo `aviso-urso.webp`, `mascote-header.png` e `mascote-home.png`) diretamente à raiz do repositório GitHub, substituindo os antigos. A versão visível deverá indicar **ALPHA 1.0.4**.

## Teste rápido
1. Abra o Editor e acrescente uma imagem ou texto.
2. Toque em **Início** e depois em **Novo projeto**.
3. Confira a arte **ATENÇÃO!!!** no aviso.
4. Toque em **Cancelar**. O editor reaparece com a arte original intacta.
5. Repita e toque em **Confirmar**. O Editor abre com projeto vazio.


## Ajustes desta versão

- Cabeçalho atualizado com o mascote mais inteiro, sem objetos nas mãos.
- Card principal da home atualizado com o mascote segurando caneca e pincel.
- Cache busting atualizado para facilitar a publicação da nova versão.
