# Verificação da lista 2

A aplicação agora calcula e imprime os itens do `2º Exercício da 2ª Unidade` de 2026.2, disponível em [lista2.pdf](lista2.pdf). A verificação executou as funções TypeScript da aplicação e comparou os resultados com SciPy 1.15.2 e SymPy 1.14.0. O projeto inicial do PID ainda não atende ao item 1a; essa limitação é exibida na tela e no relatório.

| Item                                                             | Situação atual                                                                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1a: PID com zeros iguais, Mp ≤ 10% e acomodação de 5% < 3 s      | O exemplo e a entrada manual permitem calcular e simular o PID. O projeto inicial não atende os limites; não há busca automática de um projeto que os atenda.                         |
| 1b: discretizar Gc por Tustin, T = 2 s                           | Disponível no passo de discretização. Selecionar controlador, Tustin e período 2. A discretização foi conferida independentemente.                                                    |
| 2a: determinar a e b de Gc(s) = a/(s+b) para polos −2,5 ± 2j     | Disponível como controlador de primeira ordem, com a e b calculados para G, H e o polo informados.                                                                                    |
| 2b: discretizar G(s)H(s)Gc(s) por Euler, T = 1 s                 | A função `discretizar` aceita a malha completa e possui Euler forward e backward. O fluxo agora projeta Gc e discretiza a malha completa; alvo, método e período podem ser alterados. |
| Imprimir a lista 2 completa, incluindo os itens de discretização | Disponível no seletor da segunda lista. São oito páginas, incluindo a memória algébrica e a resolução discreta por questão. A impressão atual também aceita a configuração editada.                         |

## Questão 1

Entrada manual, com coeficientes em ordem decrescente de potência:

| Campo                       | Valor                           |
| --------------------------- | ------------------------------- |
| Numerador G                 | `5 15`                          |
| Denominador G               | `1 4 0`                         |
| Numerador H                 | `1`                             |
| Denominador H               | `1 1`                           |
| Controlador                 | PID com zeros iguais            |
| Especificação               | Mp = 10%, ts = 3 s, faixa de 5% |
| Fator de frequência inicial | 1                               |

O projeto inicial posiciona o par em `−1 ± 1,364376j`, com:

```text
z  = 1,332191044465
Kd = 0,539041776173
Kp = 1,436213253619
Ki = 0,956655217206
Gc(s) = (Kd s² + Kp s + Ki)/s
```

A saída simulada é `Y/R = Gc G/(1 + Gc G H)`. H(s) participa da realimentação e não é multiplicado no numerador dessa saída. A simulação de 0 a 20 s, em 4001 amostras, encontrou:

| Fator de frequência | Mp          | Acomodação de 5% | Saída em 0⁺ | Valor final |
| ------------------- | ----------- | ---------------- | ----------- | ----------- |
| 1                   | 169,520888% | 3,245 s          | 2,695209    | 1           |
| 1,1                 | 197,611136% | 2,965 s          | 2,976111    | 1           |

O sobressinal inclui o salto inicial. Nesta planta, o PID ideal produz `y(0⁺) = 5 Kd`; ignorar esse salto daria uma conclusão incorreta sobre o atendimento de Mp. A aproximação de segunda ordem posiciona os polos, mas não garante o desempenho da saída completa. Os dois projetos conferidos falham no limite de Mp. Isso não prova que qualquer PID com zeros iguais seja inviável; significa que esses projetos não são uma resolução que atende ao enunciado.

Para o projeto inicial, Tustin com T = 2 s equivale a substituir `s = (z−1)/(z+1)` e resulta em:

```text
Gc(z) = (2,931910246998 z² + 0,835226882067 z + 0,059483739760)
        / (z² − 1)
```

Esta é a discretização do projeto inicial, cujo desempenho contínuo não atende ao item 1a. A discretização deve ser refeita se os ganhos forem alterados.

## Questão 2

O cálculo abaixo está integrado ao fluxo do app e foi confirmado por uma referência simbólica independente.

```text
G(s)H(s) = 2(s+1)(s+3)/[(s²+2s+2)(s+5)]
p = −2,5 + 2j
V = G(p)H(p)
p + b + a V = 0
a = −Im(p)/Im(V) = 7995/2104 ≈ 3,799904942966
b = −Re(p) − a Re(V) = 738/263 ≈ 2,806083650190
```

A equação característica tem, a menos de um fator constante, a fatoração exata:

```text
(4s² + 20s + 41)(263s² + 1264s + 1305) = 0
```

Os polos são `−2,5 ± 2j`, `−3,304503` e `−1,501580`. O par solicitado está presente e a malha contínua é estável, mas o polo real `−1,501580` é mais lento que esse par.

Para Euler forward, `s = (z−1)/T`, com T = 1 s, a malha aberta completa resulta em:

```text
L(z) = (7,599809885932 z² + 15,199619771863 z)
       / (z⁴ + 5,806083650190 z³ + 8,224334600760 z²
          + 5,806083650190 z + 7,224334600760)
```

O enunciado escreve apenas "Euler" e apresenta as fórmulas forward e backward. A expressão acima usa explicitamente forward; a aplicação oferece ambos os métodos. A aproximação forward da malha aberta possui polos em `−4`, `−1,806084` e `±j`, portanto não é assintoticamente estável. Isso não é uma análise da estabilidade de uma malha digital fechada.

## Evidência numérica e limites

As curvas TypeScript dos dois projetos da questão 1 coincidiram com `scipy.signal.step` na mesma grade, com erro máximo inferior a `6 × 10⁻¹³`. As métricas de Mp e acomodação também coincidiram. SymPy confirmou a substituição de Tustin, os valores exatos de a e b, a presença dos polos pedidos e os coeficientes da discretização por Euler forward.

A aplicação permite variar os coeficientes de G e H, o tipo de controlador, as especificações e a configuração de discretização. A primeira lista continua disponível separadamente.

Não há busca automática de um PID que confirme os limites do item 1a. A impressão do exemplo apresenta o projeto calculado e o resultado não atendido. As duas respostas completas da lista também foram conferidas com SciPy após a integração, com erro máximo inferior a 5 × 10⁻¹³. Foram conferidas 36 discretizações com SymPy, combinando as duas questões, os dois alvos, três métodos e três períodos.

Os cálculos conferidos não provam inviabilidade para todos os possíveis PID com zeros iguais. A análise digital é dos polos da função discretizada; não há simulação de malha digital fechada.
