# Sistemas de Controle
**Universidade Federal do Rio Grande do Norte (UFRN)**  
**Centro de Tecnologia | Deptº. de Engenharia de Computação e Automação (DCA)**  
**Autor:** Prof. Fábio Meneghetti Ugulino de Araújo  
**Data:** Fevereiro de 2007 - Natal/RN  

---

## Sumário (até Cap. 3 / pág. 23)

1. [Problema de Controle](#1-problema-de-controle)
   - 1.1 [Definições](#11-definições)
   - 1.2 [Exemplos](#12-exemplos)
   - 1.3 [Formulação Geral do Problema de Controle](#13-formulação-geral-do-problema-de-controle)
2. [Método do Lugar Geométrico das Raízes (LGR)](#2-método-do-lugar-geométrico-das-raízes-lgr)
   - 2.1 [Introdução](#21-introdução)
   - 2.2 [Passos para a Construção do LGR](#22-passos-para-a-construção-do-lgr)
     - Exemplo 1: Sistema com 2 pólos e 1 zero reais
     - Exemplo 2: Sistema com 4 pólos e 1 zero reais
     - Exemplo 3: Sistema com 2 pólos reais e 2 pólos complexos
   - 2.3 [LGR para Funções de Transferência Típicas](#23-lgr-para-funções-de-transferência-típicas)
   - 2.4 [Localizando Raízes no LGR](#24-localizando-raízes-no-lgr)
   - 2.5 [Exercícios](#25-exercícios)
3. [Ações de Controle Básicas](#3-ações-de-controle-básicas)
   - 3.1 [Introdução](#31-introdução)
   - 3.2 [Ações Proporcional, Integral e Derivativa (PID)](#32-ações-proporcional-integral-e-derivativa-pid)
     - [Controle Proporcional (P)](#controle-proporcional-p)
     - [Controlador Proporcional + Integral (PI)](#controlador-proporcional--integral-pi)
     - [Controlador Proporcional + Derivativo (PD)](#controlador-proporcional--derivativo-pd)
     - [Controlador Proporcional + Integral + Derivativo (PID)](#controlador-proporcional--integral--derivativo-pid)
   - 3.3 [Ações de Controle Avanço-Atraso](#33-ações-de-controle-avanço-atraso)

---

# 1. PROBLEMA DE CONTROLE

O objetivo principal do estudo dos sistemas de controle é resolver o que se costuma denominar por **"Problema de Controle"**. Para que se possa apresentar uma formulação geral do que seja o problema de controle, são necessárias algumas definições iniciais.

## 1.1 Definições

* **Planta:** É uma parte de um equipamento ou instalação industrial, eventualmente um conjunto de itens de uma máquina que funcionam juntos, cuja finalidade é desempenhar uma dada operação.
* **Processo:** Pode ser definido como uma operação ou desenvolvimento natural que evolui progressivamente, caracterizado por uma série de mudanças graduais que se sucedem de modo relativamente fixo, conduzindo a um resultado ou finalidade particular.
* **Sistema:** É uma disposição, conjunto ou coleção de partes, dentro de um universo, que estão conectadas ou relacionadas de tal maneira a formarem um todo.
* **Sistema Físico:** É uma parte do universo que foi delimitada para estudo.
* **Especificações de Desempenho:** São descrições do comportamento a ser apresentado pelo sistema físico, conforme solicitação do usuário.
* **Modelo:** Consiste na representação de certas características do sistema físico que são relevantes para seu estudo.
* **Controle:** É a ação de fazer com que um sistema físico atenda às especificações de desempenho determinadas *a priori*.
* **Controlador:** Dispositivo utilizado para a obtenção do controle de um sistema físico.
* **Sistema de Controle:** Conjunto formado pelo sistema a ser controlado e o controlador.

### Sistema de Controle em Malha Aberta
É aquele em que a saída ou resposta **não possui nenhuma influência** sobre a entrada.

```
[Resposta Desejada / SP] ---> [Controlador] ---> [Sinal de Controle / MV] ---> [Planta] ---> [Saída / PV]
```

### Sistema de Controle em Malha Fechada
É aquele em que a saída ou resposta **influencia a entrada** do sistema.

```
[SP] (+)--->( O ) ---> [Controlador] ---> [MV] ---> [Planta] ---> [PV] (Saída)
              ^ (-)                                   |
              |_________ [Sensor + Transmissor] <_____|
```

## 1.2 Exemplos

1. **Ser humano tentando pegar um objeto:**
   * Referência/Entrada: Posição do Objeto
   * Sensor: Olhos
   * Controlador: Cérebro
   * Atuador/Planta: Braço e Mão
   * Saída: Posição da Mão

2. **Controle de temperatura de uma sala:**
   * Referência/Entrada: Temperatura Desejada
   * Sensor/Controlador: Termostato
   * Atuador/Sistema: Ar Condicionado
   * Saída: Temperatura da Sala (sob interferência da Temperatura Ambiente)

3. **Controle do nível de um reservatório:**
   * Referência/Entrada: Nível Desejado
   * Atuador/Controlador: Bomba
   * Sistema: Reservatório
   * Sensor: Bóia
   * Saída: Nível de Água

## 1.3 Formulação Geral do Problema de Controle

Um problema de controle consiste em determinar uma forma de afetar um dado sistema físico de modo que seu comportamento atenda às especificações de desempenho previamente estabelecidas.

Como, normalmente, não é possível alterar a estrutura funcional do sistema físico em questão, a satisfação das especificações de desempenho é atingida mediante o projeto e implementação de controladores (compensadores).

* **Universo ($U$):**
  * **Sistema Físico:** Recebe *Entradas Manipuladas $u(t)$* e *Entradas Exógenas $w(t)$* (do Meio Ambiente); gera *Saídas Observadas $y(t)$* e *Saídas de Interesse $z(t)$*.
  * **Modelos:** Quantitativos (Modelos Matemáticos) ou Qualitativos (Modelos em Escala).
  * **Especificações de Desempenho:** Velocidade, Segurança, Conforto, Custo, Durabilidade, etc.
  * **Fluxo de Trabalho:** Análise $ightarrow$ Projeto $ightarrow$ Implementação.

---

# 2. MÉTODO DO LUGAR GEOMÉTRICO DAS RAÍZES (LGR)

## 2.1 Introdução

O diagrama do **Lugar Geométrico das Raízes (LGR)** consiste em um conjunto de curvas no plano complexo $s$, onde estas curvas representam as posições admissíveis para os pólos de malha fechada de um dado sistema quando o seu ganho varia de zero a infinito ($0 \le K < \infty$).

Considere o sistema com realimentação:
$$G_{MF}(s) = \frac{C(s)}{R(s)} = \frac{G(s)}{1 + G(s)H(s)}$$

Os pólos de malha fechada são as raízes do polinômio característico:
$$1 + G(s)H(s) = 0 \implies G(s)H(s) = -1$$

Como $G(s)H(s)$ representa uma quantidade complexa, a igualdade acima é desmembrada em duas condições para a localização dos pólos no plano $s$:

1. **Condição de Módulo:**
   $$|G(s)H(s)| = 1$$

2. **Condição de Ângulo:**
   $$\angle G(s)H(s) = \pm 180^\circ (2k + 1), \quad k = 0, 1, 2, \dots$$

---

## 2.2 Passos para a Construção do LGR

1. **Escrever o polinômio característico** de modo que o parâmetro de interesse ($K$) apareça claramente:
   $$1 + G(s)H(s) = 1 + K P(s) = 0$$

2. **Fatorar o polinômio $P(s)$** em termos de seus $n_P$ pólos e $n_Z$ zeros:
   $$1 + G(s)H(s) = 1 + K \frac{\prod_{j=1}^{n_Z} (s + z_j)}{\prod_{i=1}^{n_P} (s + p_i)} = 0$$

3. **Assinalar os pólos e zeros de malha aberta** no plano $s$:
   * $\mathbf{\times}$ = Pólos
   * $\mathbf{\circ}$ = Zeros
   * O LGR **começa nos pólos** ($K=0$) e **termina nos zeros** ($K \to \infty$).

4. **Assinalar os segmentos do eixo real que pertencem ao LGR:**
   * O LGR se situa à esquerda de um número **ímpar** de pólos e zeros reais.

5. **Determinar o número de ramos/lugares separados ($LS$):**
   $$LS = n_P \quad (\text{quando } n_P \ge n_Z)$$

6. **Simetria:** O LGR é simétrico em relação ao eixo real (eixo horizontal).

7. **Assíntotas para zeros infinitos:**
   $(n_P - n_Z)$ segmentos prosseguem em direção aos zeros no infinito ao longo de assíntotas com centro $\sigma_A$ e ângulos $\phi_A$:
   $$\sigma_A = \frac{\sum (-p_i) - \sum (-z_j)}{n_P - n_Z}$$
   $$\phi_A = \frac{(2q + 1)}{n_P - n_Z} 180^\circ, \quad q = 0, 1, 2, \dots, (n_P - n_Z - 1)$$

8. **Ponto de Saída/Entrada no eixo real:**
   * Fazer $K = p(s) = -\frac{1}{P(s)}$
   * Determinar as raízes de $\frac{dp(s)}{ds} = 0$.

9. **Cruzamento com o eixo imaginário:**
   * Utilizar o Critério de Estabilidade de Routh-Hurwitz para encontrar o valor limite de $K$ e os pontos de cruzamento no eixo $j\omega$.

10. **Ângulos de partida/chegada para pólos/zeros complexos:**
    * **Ângulo de Partida (de pólos complexos):**
      $$\theta_{partida} = 180^\circ - \sum \theta_i + \sum \phi_j$$
    * **Ângulo de Chegada (em zeros complexos):**
      $$\phi_{chegada} = 180^\circ - \sum \phi_j + \sum \theta_i$$
    * onde $\theta_i$ são ângulos dos vetores partindo dos demais pólos e $\phi_j$ dos zeros.

---

### Exemplo 1: Sistema com 2 pólos e 1 zero reais
* **Planta:** $G(s)H(s) = \frac{K(s+2)}{s(s+4)}$
* **Polinômio característico:** $1 + K \frac{s+2}{s(s+4)} = 0 \implies P(s) = \frac{s+2}{s(s+4)}$
* **Pólos:** $s = 0, -4$ ($n_P = 2$)
* **Zeros:** $s = -2$ ($n_Z = 1$)
* **Eixo Real:** LGR existe em $[-4, -2]$ e $[0, -\infty)$ nos trechos à esquerda de número ímpar de pólos/zeros (isto é, $s \in [-4, -2]$ e $s \in [0, -\infty)$ conforme regra).

---

### Exemplo 2: Sistema com 4 pólos e 1 zero reais
* **Planta:** $G(s)H(s) = \frac{K(s+1)}{s(s+2)(s+4)^2}$
* **Pólos:** $s = 0, -2, -4$ (com multiplicidade 2) $\implies n_P = 4$
* **Zeros:** $s = -1$ $\implies n_Z = 1$
* **Assíntotas ($n_P - n_Z = 3$):**
  $$\sigma_A = \frac{(0 - 2 - 4 - 4) - (-1)}{4 - 1} = \frac{-10 + 1}{3} = -3$$
  $$\phi_A = \frac{(2q+1)180^\circ}{3} = 60^\circ, 180^\circ, 300^\circ$$
* **Ponto de saída:** $\frac{dp(s)}{ds} = 0 \implies s = -2{,}5994$.

---

### Exemplo 3: Sistema com 2 pólos reais e 2 pólos complexos
* **Planta:** $G(s)H(s) = \frac{K}{s(s+4)(s^2 + 8s + 32)}$
* **Pólos:** $s = 0, -4, -4 \pm 4j$ ($n_P = 4, n_Z = 0$)
* **Assíntotas ($n_P - n_Z = 4$):**
  $$\sigma_A = \frac{0 + (-4) + (-4+4j) + (-4-4j)}{4} = -3$$
  $$\phi_A = 45^\circ, 135^\circ, 225^\circ, 315^\circ$$
* **Ponto de saída no eixo real:** $s = -1{,}5767$
* **Cruzamento com eixo imaginário (Routh-Hurwitz):** $s = \pm 3{,}2660 j$ com $K_{lim} = 568{,}889$.
* **Ângulo de partida do pólo em $-4+4j$:** $\theta_1 = 225^\circ$.

---

## 2.3 LGR para Funções de Transferência Típicas

| # | Função de Transferência $G(s)$ | Descrição da Forma do LGR |
|---|--------------------------------|---------------------------|
| 1 | $\frac{K}{s\tau_1 + 1}$ | Inicia em $s = -1/\tau_1$ e segue pelo eixo real até $-\infty$. |
| 2 | $\frac{K}{(s\tau_1 + 1)(s\tau_2 + 1)}$ | Dois pólos reais. Encontram-se no eixo real e saem a $90^\circ$ e $270^\circ$. |
| 3 | $\frac{K}{(s\tau_1 + 1)(s\tau_2 + 1)(s\tau_3 + 1)}$ | Três pólos reais. Assíntotas a $60^\circ, 180^\circ, 300^\circ$. Cruzam o eixo imaginário. |
| 4 | $\frac{K}{s}$ | Inicia na origem e segue para $-\infty$. |
| 5 | $\frac{K}{s(s\tau_1 + 1)}$ | Pólo na origem e em $-1/\tau_1$. Saída vertical em $s = -1/(2\tau_1)$. |
| 6 | $\frac{K}{s(s\tau_1 + 1)(s\tau_2 + 1)}$ | Três pólos (origem, $-1/\tau_1, -1/\tau_2$). Cruzam o eixo imaginário. |
| 7 | $\frac{K(s\tau_a + 1)}{s(s\tau_1 + 1)(s\tau_2 + 1)}$ | Três pólos e um zero. Ramos curvam-se e um entra no zero $s = -1/\tau_a$. |
| 8 | $\frac{K}{s^2}$ | Pólo duplo na origem. Ramos seguem sobre o eixo imaginário ($+j\omega$ e $-j\omega$). |
| 9 | $\frac{K}{s^2(s\tau_1 + 1)}$ | Pólo duplo na origem + 1 pólo real. Instável para $K > 0$ (assíntotas a $\pm 60^\circ$). |
| 10 | $\frac{K(s\tau_a + 1)}{s^2(s\tau_1 + 1)}, \quad \tau_a > \tau_1$ | Pólo duplo na origem + zero em $-1/\tau_a$. Estabiliza para ganhos elevados. |
| 11 | $\frac{K}{s^3}$ | Pólo triplo na origem. Assíntotas a $60^\circ, 180^\circ, 300^\circ$. |
| 12 | $\frac{K(s\tau_a + 1)}{s^3}$ | Pólo triplo na origem + 1 zero real. |
| 13 | $\frac{K(s\tau_a + 1)(s\tau_b + 1)}{s^3}$ | Pólo triplo na origem + 2 zeros reais. Forma círculo/órbita no plano esquerdo. |
| 14 | $\frac{K(s\tau_a + 1)}{s^2(s\tau_1 + 1)(s\tau_2 + 1)}$ | Pólo duplo na origem + 2 pólos reais + 1 zero real. |
| 15 | $\frac{K(s\tau_a + 1)(s\tau_b + 1)}{s(s\tau_1 + 1)(s\tau_2 + 1)(s\tau_3 + 1)(s\tau_4 + 1)}$ | Sistema de ordem elevada com múltiplos zeros e pólos. |

---

## 2.4 Localizando Raízes no LGR

Um ponto qualquer $s_1$ no plano $s$ pertence ao LGR se satisfizer os critérios:

1. **Critério de Ângulo:**
   $$\left( \sum_{i=1}^{n_P} \theta_i - \sum_{j=1}^{n_Z} \phi_j \right)_{s=s_1} = 180^\circ \pm q \cdot 360^\circ$$

2. **Determinação do Ganho $K$ na raiz $s_1$ (Critério do Módulo):**
   $$K_1 = \frac{\prod_{i=1}^{n_P} |s_1 + p_i|}{\prod_{j=1}^{n_Z} |s_1 + z_j|}$$

---

## 2.5 Exercícios

1. **Traçar o LGR para os seguintes sistemas (com $K > 0$) e testar se o ponto $s_i$ dado pertence ao LGR:**
   * a) $G(s)H(s) = \frac{K}{s(s^2 + 6s + 25)}$; $s_i = -1{,}0066 + 3{,}9950j$
   * b) $G(s) = \frac{K}{s(s+1)(s+2)}$, $H(s) = 1$; $s_i = -0{,}3337 - 0{,}5780j$
   * c) $G(s)H(s) = \frac{K(s+2)}{s^2 + 2s + 3}$; $s_i = -0{,}7660 + 0{,}2995j$
   * d) $G(s) = \frac{1}{s^2 + 4s + 5}$, $H(s) = \frac{1}{s}$; $s_i = -0{,}4968 + 1{,}3290j$
   * e) $G(s) = \frac{1}{s(s^2 + 4s + 13)}$, $H(s) = \frac{1}{s+1}$; $s_i = 2{,}5509 - 4{,}1649j$
   * f) $G(s) = \frac{1}{s + 3{,}6}$, $H(s) = \frac{s+1}{s^2}$; $s_i = -0{,}2968 + 4{,}3290j$

2. **Dadas as funções de transferência de malha fechada (realimentação unitária), traçar o LGR e testar se o ponto $s_i$ pertence ao LGR:**
   * a) $\frac{C(s)}{R(s)} = \frac{s^2 + 1}{2(s^2 + 2s + 1)}$; $s_i = -0{,}5000 + 0{,}5000j$
   * b) $\frac{C(s)}{R(s)} = \frac{1}{s^4 + 4s^3 + 11s^2 + 14s + 11}$; $s_i = -1{,}0000 - 1{,}5811j$

---

# 3. AÇÕES DE CONTROLE BÁSICAS

## 3.1 Introdução

A introdução de um controlador em um determinado sistema visa a modificação de sua dinâmica, manipulando a relação entrada/saída através da atuação sobre um ou mais dos seus parâmetros, com o objetivo de satisfazer certas especificações com relação à sua resposta.

* **Variáveis Manipuladas:** Parâmetros do sistema que sofrem ação direta do controlador.
* **Variáveis Controladas:** Parâmetros nos quais se deseja obter as mudanças requeridas.

### Configurações de Controladores
* **Controladores Série:** Inserido no ramo direto (em série com a planta). Em geral, é mais simples de projetar.
  ```
  [R(s)] --->(+)---> [E(s)] ---> [Controlador] ---> [U(s)] ---> [Planta] ---> [C(s)]
              ^ (-)                                                           |
              |_______________________________________________________________|
  ```
* **Controladores por Realimentação:** Inserido no ramo de realimentação. Exige menor número de componentes em alguns casos.

---

## 3.2 Ações Proporcional, Integral e Derivativa (P-I-D)

### Controle Proporcional (P)

A saída do controlador é diretamente proporcional ao sinal de erro:
$$u(t) = K_p \cdot e(t) \implies U(s) = K_p \cdot E(s)$$

**Resumo do Controle P:**
* É um amplificador com ganho ajustável ($K_p$).
* O aumento de $K_p$ **diminui o erro em regime permanente** ($e_{ss}$).
* O aumento de $K_p$ torna o sistema mais oscilatório, podendo levá-lo à instabilidade.
* Melhora o regime permanente, porém pode piorar a resposta transitória.
* Para $G(s) = \frac{1}{\tau s + 1}$, o erro a degrau é $e_{ss} = \frac{1}{1 + K_p}$, sendo nulo apenas quando $K_p \to \infty$.

---

### Controlador Proporcional + Integral (PI)

A ação integral produz um sinal proporcional à integral do erro no tempo:
$$u(t) = K_p \left( e(t) + \frac{1}{\tau_i} \int_{0}^{t} e(\tau) d\tau \right) \implies U(s) = \left( K_p + \frac{K_i}{s} \right) E(s) = \frac{K_p s + K_i}{s} E(s)$$
onde $\tau_i = \frac{K_p}{K_i}$ é o tempo integrativo (*reset time*).

**Resumo do Controle PI:**
* **Zera o erro em regime permanente** para entradas degrau (aumenta o tipo do sistema).
* Adiciona um **pólo em $p = 0$** e um **zero em $z = -K_i / K_p$**.
* Utilizado quando a resposta transitória é aceitável, mas a resposta em regime permanente é insatisfatória.
* Por aumentar a ordem do sistema, pode degradar a estabilidade transitória se não for bem projetado.

---

### Controlador Proporcional + Derivativo (PD)

A ação derivativa responde à taxa de variação do erro no tempo:
$$u(t) = K_p \left( e(t) + \tau_d \frac{de(t)}{dt} \right) \implies U(s) = (K_p + K_d s) E(s)$$
onde $K_d = K_p \cdot \tau_d$, sendo $\tau_d$ a constante derivativa.

**Resumo do Controle PD:**
* Leva em conta a taxa de variação (tendência futura) do erro.
* Adiciona um **zero em $z = -K_p / K_d$**.
* **Melhora a resposta transitória** (aumenta o amortecimento, reduz o tempo de acomodação e o sobre-sinal).
* **Não altera o erro em regime permanente** (não adiciona pólo na origem).
* Desvantagem: Amplifica ruídos de alta frequência, podendo saturar atuadores.

---

### Controlador Proporcional + Integral + Derivativo (PID)

Combina as três ações em um único controlador:
$$U(s) = \left( K_p + \frac{K_i}{s} + K_d s \right) E(s) = \frac{K_d s^2 + K_p s + K_i}{s} E(s)$$

**Resumo do Controle PID:**
* Utilizado quando tanto a resposta transitória quanto a resposta em regime permanente são insatisfatórias.
* Adiciona um **pólo em $p = 0$** e **2 zeros** (reais ou complexos conjugados, dependendo dos parâmetros).

---

## 3.3 Ações de Controle Avanço-Atraso

### Controlador Avanço de Fase (Lead)

Possui a função de transferência:
$$G_c(s) = \frac{U(s)}{E(s)} = K_c \frac{s + z}{s + p} = K_c \frac{\tau s + 1}{\alpha \tau s + 1}, \quad \text{com } p > z \text{ e } 0 < \alpha < 1$$
em que $z = \frac{1}{\tau}$ e $p = \frac{1}{\alpha \tau}$.

**Resumo:**
* Introduz um zero e um pólo ($p > z$).
* **Melhora a resposta transitória** (análogo ao PD), fornecendo adiantamento de fase.
* Aumenta a margem de fase e a largura de banda.

---

### Controlador Atraso de Fase (Lag)

Possui a função de transferência:
$$G_c(s) = K_c \frac{s + z}{s + p} = K_c \frac{\tau s + 1}{\beta \tau s + 1}, \quad \text{com } z > p \text{ e } \beta > 1$$
em que $z = \frac{1}{\tau}$ e $p = \frac{1}{\beta \tau}$.

**Resumo:**
* Introduz um zero e um pólo ($z > p$).
* **Melhora a resposta em regime permanente** (análogo ao PI), reduzindo significativamente o erro.
* Atrasa a fase e reduz a largura de banda (torna o sistema menos sensível a ruído).

---

### Controlador Avanço-Atraso de Fase (Lead-Lag)

Combina ambas as características:
$$G_c(s) = K_c \left( \frac{\tau_1 s + 1}{\alpha \tau_1 s + 1} \right) \left( \frac{\tau_2 s + 1}{\beta \tau_2 s + 1} \right), \quad \text{com } 0 < \alpha < 1, \; \beta > 1$$

**Resumo:**
* Introduz dois zeros e dois pólos.
* Utilizado para melhorar simultaneamente o **desempenho transitório e em regime permanente** (análogo ao PID).
