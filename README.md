# Tio Urso Studio — Alpha 0.7.1 | Caneca Meshy 3D

Esta atualização é focada EXCLUSIVAMENTE no mockup da caneca tradicional. O editor, exportação, outros produtos, cores e cenários foram mantidos.

## Correções
- O eixo da rotação agora passa pelo **centro do corpo da caneca**, independentemente da posição da alça. A caneca gira sobre si mesma.
- A arte é projetada por ângulo na superfície externa, cobrindo aproximadamente **80% da circunferência**, sem cruzar a emenda traseira sob a alça. As bordas traseiras permanecem brancas.
- UVs são calculadas por triângulo para não costurar a imagem repetida atrás da caneca.
- A geometria Meshy e a posição da alça não foram alteradas.

## Atualização no GitHub
1. Extraia o ZIP.
2. Selecione os **sete arquivos** na pasta extraída (não selecione o ZIP nem a pasta inteira).
3. No repositório `tio-urso-studio`, use **Add file → Upload files** na branch `main`, aceite a substituição e confirme.
4. Aguarde o GitHub Pages publicar e abra o site. No topo deve aparecer **ALPHA 0.7.1**.
5. Confira **Frente / Esquerda / Direita / Trás** com a mesma arte. Evite usar diretamente em produção até validar no celular.

## Limites
- O visual continua experimental e depende do WebGL do Android. A arte impressa não é alterada por esses ajustes; o recorte é apenas do **mockup 3D**.
- A faixa de cobertura da caneca é estimada e pode precisar de calibração com a caneca física real.
