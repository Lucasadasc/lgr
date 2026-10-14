> Documento técnico adaptado da referência EugenioVLopes/lgr-projeto-controle. Consulte o README para executar este projeto.

# Segunda unidade

A área de controladores oferece as quatro questões do 1º Exercício e as duas questões do 2º Exercício da 2ª Unidade de DCA-3701.0, 2026.2. Os repositórios Python de referência incluem questões adicionais de uma lista anterior; elas não foram incluídas nos exemplos desta versão.

A [lista 2](lista2.pdf) inclui PID, controlador a/(s+b), Tustin e Euler. O app calcula todos esses itens e indica os requisitos não atendidos, incluindo o projeto inicial da questão 1. Veja a [verificação por questão e os resultados numéricos](verificacao-lista2.md).

## Uso

Selecione a segunda unidade, a lista e um exercício, ou informe os coeficientes de G(s) e H(s) em ordem decrescente de potência. Use ponto para decimais e espaços para separar coeficientes. Os dados de cada unidade são mantidos ao alternar a navegação durante a sessão.

Escolha PD, PI, PID com zeros iguais ou primeira ordem a/(s+b) e informe Mp e acomodação, ζ e ωn ou um polo complexo com parte real negativa. Clique em **Projetar controlador**. Campos editados invalidam a resolução anterior para evitar misturar entradas novas com resultados antigos.

A navegação usa badges clicáveis, Anterior/Próximo e a opção de visualizar todos os passos, como na primeira unidade. A escolha de detalhamento alterna entre passos essenciais e memória completa. A memória inclui vetores, fases por atan2, distâncias, substituições numéricas e conversão dos ganhos. A impressão sempre inclui todos os passos e a memória completa, mesmo quando a tela mostra apenas os passos essenciais. O botão e Ctrl+P preparam a unidade ativa. Ao fechar a impressão, os passos voltam ao estado anterior e o detalhamento da tela é preservado.

## Projeto contínuo

O controlador fica em série com G(s), com realimentação negativa H(s). A equação característica é `1 + Gc(s)G(s)H(s) = 0`. A saída é `Gc(s)G(s)/(1 + Gc(s)G(s)H(s))`, portanto H(s) não entra diretamente no numerador da saída.

Para Mp e acomodação, a aproximação de segunda ordem usa `ζ = -ln(Mp/100)/sqrt(π² + ln²(Mp/100))`, `ωn,min = 3/(ζ·ts)` para 5% e `4/(ζ·ts)` para 2%. O fator de frequência começa em 1 e pode ser aumentado manualmente. Não há busca automática de parâmetros.

Para PD, PI e PID, o critério do ângulo determina z. O módulo determina Kc, incluindo os coeficientes originais da planta e da realimentação. Um zero em `s = -z` pode estar no semiplano direito se z for negativo; esse caso é identificado na resolução. O método requer polos desejados complexos e ganho Kc positivo. Uma topologia angularmente inviável gera uma mensagem para alterar o ponto ou a topologia.

| Controlador | Forma      | Ganhos                          |
| ----------- | ---------- | ------------------------------- |
| PD          | Kc(s+z)    | Kp = Kc·z; Kd = Kc              |
| PI          | Kc(s+z)/s  | Kp = Kc; Ki = Kc·z              |
| PID         | Kc(s+z)²/s | Kd = Kc; Kp = 2Kc·z; Ki = Kc·z² |

Para a/(s+b), avaliamos `V = G(sd)H(sd)` e resolvemos `sd + b + aV = 0`, com `a = −Im(sd)/Im(V)` e `b = −Re(sd) − aRe(V)`. O cálculo aceita ganho a negativo e polo isolado instável, com avisos e validação da malha completa. A parte imaginária nula ou numericamente singular de V gera erro, pois não permite obter dois parâmetros reais finitos neste ponto. Os parâmetros a e b não são apresentados como ganhos de PID.

O LGR compensado varia o ganho mantendo os zeros ou o polo projetado do controlador fixos. O marcador do projeto usa o Kc calculado. A resolução lista todos os polos, sem assumir que o par escolhido seja dominante.

## Resposta temporal e aprovação

A simulação aplica um degrau unitário com estados iniciais nulos. Usa forma canônica controlável e Dormand–Prince 5(4), com tolerância relativa de 1e-8 e absoluta de 1e-10. Não depende da separação das raízes, portanto admite polos repetidos.

São amostrados 4001 pontos. O horizonte automático é o maior entre 5 s e vinte constantes de tempo do polo mais lento; o usuário pode informar outro horizonte. Há um limite de 150 mil tentativas de integração. Falhas de integração, malhas instáveis, marginais e impróprias não recebem métricas de aprovação.

O valor final é o ganho estático da malha fechada, não necessariamente 1. Mp mede o pico no sentido desse valor final, relativo ao seu módulo, incluindo a amostra em 0⁺. A saída em 0⁺ também aparece separadamente. Esta convenção evita ocultar saltos iniciais como o da questão 3, que começa em 35 e termina em 5. Algumas referências Python medem apenas o transitório após o primeiro cruzamento; seus valores de Mp podem divergir nessa situação.

A acomodação é a primeira amostra depois da última saída da faixa de 2% ou 5% do valor final. Se a última amostra ainda estiver fora da faixa, a aplicação informa que não acomodou no intervalo. As métricas relativas não são definidas para valor final nulo. A medida é limitada pela resolução temporal e pelo horizonte; aumentar o horizonte não equivale a provar a acomodação para qualquer sistema.

Os limites são comparados como `Mp ≤ limite` e `ts < limite`. Na questão 1 da primeira lista, o projeto com fator 1 posiciona corretamente os polos, mas a simulação apresenta acomodação de 5% superior a 4 s. O aplicativo informa o requisito não atendido e permite reprojetar. A mudança de polo exige recalcular o controlador. Na questão 1 da segunda lista, o projeto inicial tem Mp ≈ 169,52% e acomodação de 5% ≈ 3,245 s. Aumentar apenas o fator para 1,1 reduz o tempo, mas aumenta Mp. A aplicação não declara atendidos esses requisitos nem prova inviabilidade para outros projetos.

## Discretização

A transformação é algébrica, por substituição polinomial, e aceita controladores ideais impróprios.

| Método         | Substituição         |
| -------------- | -------------------- |
| Euler forward  | s = (z−1)/T          |
| Euler backward | s = (z−1)/(Tz)       |
| Tustin         | s = (2/T)(z−1)/(z+1) |

O período T deve ser positivo. É possível discretizar Gc(s) ou a malha aberta completa. A saída mostra a função em z e a equação de diferenças. Se o grau do numerador discreto superar o do denominador, a equação exige amostras futuras e é identificada como não causal.

Os polos discretos são comparados com o círculo unitário, com tolerância de 1e-8 no módulo. A estabilidade indicada é da função selecionada, não de uma malha digital fechada. Na questão 2 da segunda lista, Euler forward com T = 1 s produz polos de malha aberta fora do círculo unitário. O enunciado diz apenas "Euler"; adotamos forward no exemplo e permitimos selecionar backward.

Marque **Incluir discretização na impressão** para adicionar a resolução discreta e sua memória algébrica à resolução atual. Os exemplos da segunda lista já ativam essa opção e preenchem alvo, método e período. O relatório usa os valores atuais, mesmo com o passo recolhido, e registra erros sem reutilizar resultados anteriores. O botão de lista completa imprime os exemplos da lista selecionada, sem substituir seus valores por edições manuais da tela. São oito páginas para cada lista padrão. Modelos maiores recebem páginas adicionais para a expansão dos termos.

Esta versão não inclui simulação digital, invariância ao degrau, avanço/atraso ou Ziegler–Nichols.

## Verificação

Os testes conferem as quatro questões por ganhos, resíduo da equação característica e critérios de ângulo e módulo. A simulação é comparada com soluções analíticas de polos repetidos e referências independentes obtidas com SciPy 1.15.2, `signal.step`, em 4001 pontos de 0 a 20 s. As referências e índices estão em `src/lib/controladores/referencias-scipy.ts`.

Os testes da segunda lista conferem a = 7995/2104 e b = 738/263, plantas com ganhos alterados, conjugado inferior, polo isolado instável, ζ/ωn, singularidades, discretizações, requisitos não atendidos e fórmulas KaTeX dos relatórios.

Os testes também cobrem realimentação não unitária, termo direto, instabilidade, horizonte insuficiente, entradas inválidas e os três métodos discretos. A validação deste projeto é `npm run typecheck`, `npm test` e `npm run build`.

Os módulos desta integração são carregados sob demanda. Esta aplicação não inclui cache PWA. A planta pode ser importada da primeira unidade, e o controlador projetado pode ser enviado à análise em dez passos.

## Controladores personalizados

O seletor permite avaliar Gc(s) com coeficientes numéricos ou sintetizar um ou dois parâmetros reais presentes em expressões afins. Separe coeficientes por ponto e vírgula: `a` no numerador e `1; b` no denominador representam a/(s+b). Para G(s)=1/(s+1), H(s)=1 e s_d=−2+3j, a síntese resulta em a=10 e b=3, com equação característica s²+4s+13.

O parser aceita números, identificadores de parâmetros, soma, subtração, multiplicação por constantes, divisão por constantes não nulas e parênteses. A síntese resolve as partes real e imaginária de D_c(s_d)D_GH(s_d)+N_c(s_d)N_GH(s_d)=0 e verifica o resíduo e os polos obtidos. Produtos entre parâmetros e outras expressões não afins são rejeitados. Controladores informados diretamente podem não posicionar o par desejado; a resolução indica essa diferença sem alterar os coeficientes.

## Memória algébrica discreta

Usamos s=u(z)/v(z) e m=max(grau N, grau D). Cada termo c_i s^p se torna c_i u^p v^(m−p)/v^m. A memória mostra cada expansão, as somas Ñ e D̃, o cancelamento do denominador comum v^m e a divisão pelo coeficiente líder de D̃. Polos e zeros da função original não são cancelados automaticamente. Ao isolar u[k], os coeficientes das saídas anteriores trocam de sinal: um denominador z+1 produz u[k]=−u[k−1]+…, como verificado no teste de Tustin do PD.
