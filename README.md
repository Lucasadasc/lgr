# LGR · Sistemas de Controle

Aplicação React/TypeScript para as duas unidades da disciplina. Os cálculos são executados no navegador.

## Executar

Requer Node.js 22.12+ (ou 24+) e npm.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm test
npm run build
```

## Primeira unidade

Análise do LGR em dez passos, testador de ponto, exemplos e estúdio de controladores P, PI, PD, PID, avanço e atraso. O acoplamento agora multiplica os coeficientes polinomiais, sem criar expressões ambíguas para o parser.

## Segunda unidade

Selecione **2ª Unidade · Projeto e discretização**. A primeira lista possui quatro questões e a segunda duas. É possível editar os exemplos ou importar a planta da primeira unidade.

- Projeto de PD, PI, PID com zeros iguais e a/(s+b) por critérios de ângulo e módulo. Controladores personalizados podem ser informados por coeficientes ou sintetizados por até dois parâmetros reais em expressões afins.
- Especificação por Mp/acomodação, ζ/ωn ou polo complexo.
- Passos por badges clicáveis, navegação anterior/próximo e visualização de todos; resolução essencial ou memória completa; polos e resposta ao degrau com requisitos medidos.
- Tustin, Euler forward e backward para o controlador ou a malha aberta, com memória algébrica das substituições, expansão dos termos, denominador comum, normalização, equação de diferenças e análise de causalidade.
- Impressão da resolução atual ou da lista completa, incluindo discretização quando selecionada.
- Envio da planta compensada à análise dos dez passos da primeira unidade.

Os dados de cada unidade permanecem ao alternar a navegação durante a sessão. Alterar uma entrada invalida a resolução anterior. O projeto pela aproximação de segunda ordem pode não cumprir os requisitos da resposta completa: a interface indica os limites não atendidos. Não há busca automática de sintonia nem simulação de malha digital fechada.

Os gráficos da segunda unidade são carregados sob demanda e acompanham o tema claro/escuro.

## Referência e verificação

Conteúdo e módulos da segunda unidade adaptados de [EugenioVLopes/lgr-projeto-controle](https://github.com/EugenioVLopes/lgr-projeto-controle), commit `833155b873686dc3306cedeb21d264c73c4b6935`. A licença MIT original está em [docs/LICENSE-referencia](docs/LICENSE-referencia).

Os 70 testes cobrem ganhos, polos, resíduos, realimentação não unitária, soluções analíticas e referências SciPy, discretização, entradas inválidas e relatórios. Consulte [o conteúdo da segunda unidade](docs/segunda-unidade.md) e [a verificação da lista 2](docs/verificacao-lista2.md).

## Controlador personalizado

Escolha **Personalizado · coeficientes livres**. Em **Informar Gc(s)**, preencha os coeficientes numéricos; a aplicação avalia o sistema sem ajustar o controlador. Em **Calcular parâmetros a partir do polo**, use até duas incógnitas reais em coeficientes afins, separados por `;`. Por exemplo, numerador `a` e denominador `1; b` representam a/(s+b). Também são aceitos coeficientes como `2*b+1` e `(a+1)/2`.

Um polo complexo fornece duas equações reais. Sistemas singulares, incompatíveis, não finitos ou com mais de duas incógnitas são rejeitados. Produtos entre parâmetros, potências de parâmetros e divisão por parâmetros não são suportados. No modo de avaliação, o aplicativo informa quando o par desejado não foi atingido.

A memória completa da discretização aparece no último badge ao selecionar **Memória completa**. Os PDFs incluem essa memória automaticamente quando a discretização está marcada, independentemente do detalhamento em tela.
