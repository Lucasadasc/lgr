import { useState } from 'react';
import { MathView } from './MathView';
import { StepNavigator } from './StepNavigator';
import { polinomioLatex } from '../lib/controladores/formatacao';
import { raizesVerificadas } from '../lib/controladores';
import './unidade3.css';
type M = number[][];
const mul=(a:M,b:M):M=>a.map(r=>b[0].map((_,j)=>r.reduce((v,x,k)=>v+x*b[k][j],0)));
const eye=(n:number):M=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
const add=(a:M,b:M,k=1):M=>a.map((r,i)=>r.map((x,j)=>x+k*b[i][j]));
const tr=(a:M):M=>a[0].map((_,i)=>a.map(r=>r[i]));
function reduce(a:M){const b=a.map(r=>[...r]);let rank=0;for(let j=0;j<b[0].length&&rank<b.length;j++){let p=rank;for(let i=rank;i<b.length;i++)if(Math.abs(b[i][j])>Math.abs(b[p][j]))p=i;if(Math.abs(b[p][j])<1e-10)continue;[b[p],b[rank]]=[b[rank],b[p]];const d=b[rank][j];b[rank]=b[rank].map(x=>x/d);for(let i=0;i<b.length;i++)if(i!==rank){const k=b[i][j];b[i]=b[i].map((x,c)=>x-k*b[rank][c]);}rank++;}return {b,rank};}
function inv(a:M){const n=a.length;if(reduce(a).rank<n)throw Error('Matriz singular: projeto indisponível.');return reduce(a.map((r,i)=>[...r,...eye(n)[i]])).b.map(r=>r.slice(n));}
export function poly(a:M){const n=a.length;let b=eye(n);const c=[1];for(let k=1;k<=n;k++){b=mul(a,b);const v=-b.reduce((s,r,i)=>s+r[i],0)/k;c.push(v);b=add(b,eye(n),v);}return c;}
const ctrl=(a:M,b:M)=>{const cols=[b];for(let i=1;i<a.length;i++)cols.push(mul(a,cols[i-1]));return a.map((_,i)=>cols.flatMap(c=>c[i]));};
export function gain(a:M,b:M,ps:number[]){let q=eye(a.length);for(const c of ps.slice(1))q=add(mul(q,a),eye(a.length),c);return mul(mul([eye(a.length)[a.length-1]],inv(ctrl(a,b))),q);}
const matrix=(m:M)=>'\\begin{bmatrix}'+m.map(r=>r.map(x=>Math.abs(x)<1e-9?'0':Number(x.toPrecision(7))).join('&')).join('\\\\')+'\\end{bmatrix}';
export const models = [
  { name: 'Questão 1 · Sistema 1', a: '-4 3 0\n-1 -4 -1\n0 0 -2', b: '0\n0\n3', c: '1 0 0', projeto: false, p: '', o: '', descricao: 'Encontre o polinômio característico e analise estabilidade, controlabilidade e observabilidade.' },
  { name: 'Questão 1 · Sistema 2', a: '-5 1 0\n2 7 -1\n0 -3 6', b: '0\n0\n1', c: '1 -2 3', projeto: false, p: '', o: '', descricao: 'Encontre o polinômio característico e analise estabilidade, controlabilidade e observabilidade.' },
  { name: 'Questão 2 · Realimentação e observador', a: '-4 3 0\n-1 -4 -1\n0 0 -2', b: '0\n0\n3', c: '1 0 0', projeto: true, p: '1 14 45 50', o: '1 12 22 20', descricao: 'Realimentação: polos −2 ± i e −10. Observador: polos −1 ± i e −10.' },
  { name: 'Questão 3 · Realimentação e observador', a: '-5 1 0\n2 7 -1\n0 -3 6', b: '0\n0\n1', c: '1 -2 3', projeto: true, p: '1 14 45 50', o: '1 12 22 20', descricao: 'Realimentação: polos −2 ± i e −10. Observador: polos −1 ± i e −10.' },
  { name: 'Questão 4 · Forma canônica controlável', a: '0 1 0\n0 0 1\n-5 -7 -3', b: '0\n0\n1', c: '-2 4 3', projeto: true, p: '1 13 56 80', o: '1 4 5 2', descricao: 'G(s) = (3s² + 4s − 2)/(s³ + 3s² + 7s + 5). Observador: −1, −1 e −2. Realimentação: −4, −4 e −5.' },
];
export const parse = (s: string) => {
  if (!s.trim()) throw Error('Preencha os coeficientes antes de calcular.');
  const rows = s.trim().split(/\n|;/);
  if (rows.some(r => !r.trim())) throw Error('Remova as linhas vazias entre os coeficientes.');
  return rows.map(r => r.trim().split(/[ ,]+/).map(Number));
};
export function analisar(a: string, b: string, c: string) {
  const aa = parse(a), bb = parse(b), cc = parse(c), n = aa.length;
  if (n < 1 || n > 6 || aa.some(r => r.length !== n) || bb.length !== n || bb.some(r => r.length !== 1) || cc.length !== 1 || cc[0].length !== n || [...aa.flat(), ...bb.flat(), ...cc.flat()].some(x => !Number.isFinite(x)))
    throw Error('Confira as dimensões: A quadrada (1 a 6), B coluna e C linha, com valores finitos.');
  return { aa, bb, cc, n, u: ctrl(aa, bb), v: tr(ctrl(tr(aa), tr(cc))), pol: poly(aa) };
}
export function projetar(a: M, b: M, coeficientes: string) {
  const ps = parse(coeficientes).flat();
  if (ps.length !== a.length + 1 || ps[0] !== 1 || ps.some(x => !Number.isFinite(x)))
    throw Error('Informe n+1 coeficientes finitos do polinômio desejado, começando por 1.');
  return gain(a, b, ps);
}
export interface PassoUnidade3 { title: string; content: React.ReactNode }
const formula = (math: string) => <div className="u3-formula" tabIndex={0}><MathView math={math} block /></div>;
const number = (x: number) => String(Number(x.toPrecision(7)));
const polynomial = (values: number[]) => polinomioLatex(values);

function escalonarComMemoria(input: M) {
  const a = input.map(r => [...r]);
  const operations: { label: string; matrix: M }[] = [];
  const save = (label: string) => operations.push({ label, matrix: a.map(r => [...r]) });
  let rank = 0;
  for (let j = 0; j < a[0].length && rank < a.length; j++) {
    let pivot = rank;
    for (let i = rank; i < a.length; i++) if (Math.abs(a[i][j]) > Math.abs(a[pivot][j])) pivot = i;
    if (Math.abs(a[pivot][j]) < 1e-10) continue;
    if (pivot !== rank) { [a[pivot], a[rank]] = [a[rank], a[pivot]]; save(`L${rank + 1} ↔ L${pivot + 1}`); }
    const d = a[rank][j];
    if (d !== 1) { a[rank] = a[rank].map(x => x / d); save(`L${rank + 1} ← L${rank + 1} / (${number(d)})`); }
    for (let i = 0; i < a.length; i++) if (i !== rank) {
      const factor = a[i][j];
      if (factor === 0) continue;
      a[i] = a[i].map((x, k) => x - factor * a[rank][k]);
      save(`L${i + 1} ← L${i + 1} − (${number(factor)}) L${rank + 1}`);
    }
    rank++;
  }
  return { rank, operations, matrix: a };
}

export function gerarPassos(a: string, b: string, c: string, incluir: boolean, p: string, o: string, canonical = false): PassoUnidade3[] {
  const { aa, bb, cc, n, u, v, pol } = analisar(a, b, c);
  const steps: PassoUnidade3[] = [];
  const push = (title: string, content: React.ReactNode) => steps.push({ title, content });
  if (canonical) push('Construir a forma canônica controlável', <>
    <p>Partimos da função de transferência com denominador mônico. Não cancelamos fatores: a representação mantém os três estados da questão.</p>
    {formula('G(s)=\\frac{3s^2+4s-2}{s^3+3s^2+7s+5}')}
    <p>A última linha de A recebe os coeficientes do denominador em ordem crescente, com sinais invertidos: −5, −7, −3. As duas primeiras linhas representam a cadeia de integradores. B seleciona o último estado. C recebe os coeficientes do numerador em ordem crescente: −2, 4, 3. Como a função é estritamente própria, D = 0.</p>
    {formula(`A=${matrix(aa)},\\quad B=${matrix(bb)},\\quad C=${matrix(cc)}`)}
  </>);
  push('Identificar o modelo e suas dimensões', <>
    <p>O sistema tem {n} estados, uma entrada e uma saída. Vamos analisar a dinâmica interna a partir de A e a influência da entrada e da medição a partir de B e C.</p>
    {formula('\\dot{x}=Ax+Bu,\\qquad y=Cx')}
    {formula(`A=${matrix(aa)}`)}{formula(`B=${matrix(bb)},\\quad C=${matrix(cc)}`)}
  </>);
  const si = '\\begin{bmatrix}' + aa.map((r, i) => r.map((x, j) => i === j ? (x === 0 ? 's' : `s${x < 0 ? '+' : '-'}${number(Math.abs(x))}`) : number(-x)).join('&')).join('\\\\') + '\\end{bmatrix}';
  push('Montar sI − A', <><p>Multiplicamos a identidade por s e subtraímos A. Na diagonal obtemos s − aᵢᵢ; fora dela, invertemos o sinal dos elementos de A.</p>{formula(`sI-A=${si}`)}<p>O determinante desta matriz é o polinômio característico.</p>{formula('\\Delta(s)=\\det(sI-A)')}</>);
  let previous = eye(n);
  const coefficients: React.ReactNode[] = [];
  for (let k = 1; k <= n; k++) {
    const product = mul(aa, previous), trace = product.reduce((sum, row, i) => sum + row[i], 0);
    const coefficient = -trace / k;
    previous = add(product, eye(n), coefficient);
    coefficients.push(<div key={k}><h4>Coeficiente c{k}</h4>{formula(`AB_{${k - 1}}=${matrix(product)}`)}{formula(`c_{${k}}=-\\frac{\\operatorname{tr}(AB_{${k - 1}})}{${k}}=-\\frac{${number(trace)}}{${k}}=${number(coefficient)}`)}{formula(`B_{${k}}=AB_{${k - 1}}+c_{${k}}I=${matrix(previous)}`)}</div>);
  }
  push('Calcular o polinômio característico', <><p>Para calcular o determinante de forma sistemática usamos Faddeev–LeVerrier. Bₖ é uma matriz auxiliar deste método, diferente do vetor de entrada B. Começamos com B₀ = I e calculamos cada coeficiente pelo traço, a soma da diagonal.</p>{formula('B_0=I,\\quad c_k=-\\frac{\\operatorname{tr}(AB_{k-1})}{k},\\quad B_k=AB_{k-1}+c_kI')}{coefficients}{formula(`\\Delta(s)=${polynomial(pol)}`)}</>);
  const roots = raizesVerificadas(pol);
  push('Encontrar os polos e avaliar a estabilidade', <><p>Resolvemos Δ(s) = 0. Os polos são os autovalores de A; os valores abaixo foram encontrados numericamente.</p>{formula(`\\Delta(s)=${polynomial(pol)}=0`)}<ul>{roots.map((root, i) => <li key={i}>Polo {i + 1}: {number(root.re)} {root.im < 0 ? '−' : '+'} {number(Math.abs(root.im))}i</li>)}</ul><p>Um sistema contínuo é assintoticamente estável quando todos os polos têm parte real negativa. Um polo com parte real positiva implica instabilidade.</p><p><strong>{roots.every(x => x.re < -1e-8) ? 'Todos os polos estão no semiplano esquerdo: sistema assintoticamente estável.' : roots.some(x => x.re > 1e-8) ? 'Existe polo com parte real positiva: sistema instável.' : 'Há polos na fronteira numérica: é necessária análise adicional da multiplicidade e dos blocos de Jordan.'}</strong></p></>);
  function rankSteps(label: string, m: M, control: boolean) {
    const reduced = escalonarComMemoria(m);
    push(`Verificar ${label.toLowerCase()} pelo posto`, <><p>Aplicamos operações elementares às linhas. Elas preservam o posto. O número de pivôs deve ser igual ao número de estados ({n}) para que o teste seja satisfeito. Pivôs menores que 10⁻¹⁰ são tratados como zero neste cálculo.</p>
      {reduced.operations.map((operation, i) => <div key={i}><p>{operation.label}</p>{formula(matrix(operation.matrix))}</div>)}
      {!reduced.operations.length && formula(matrix(reduced.matrix))}
      {formula(`\\operatorname{posto}(${control ? 'U' : 'V'})=${reduced.rank}${reduced.rank === n ? '=' : '<'}${n}`)}
      <p><strong>{reduced.rank === n ? `Sistema ${control ? 'controlável: a entrada pode atuar em todos os estados.' : 'observável: a saída permite reconstruir todos os estados.'}` : `Sistema não ${control ? 'controlável: não é possível alocar livremente todos os polos por realimentação.' : 'observável: um observador completo não pode ter todos os polos livremente alocados.'}`}</strong></p></>);
    return reduced.rank;
  }
  let column = bb;
  const columns = [formula(`B=${matrix(bb)}`)];
  for (let k = 1; k < n; k++) { const prior = column; column = mul(aa, column); columns.push(formula(`A^{${k}}B=A(A^{${k - 1}}B)=${matrix(aa)}${matrix(prior)}=${matrix(column)}`)); }
  push('Construir a matriz de controlabilidade', <><p>Multiplicamos B sucessivamente por A. Cada coluna descreve como a entrada alcança os estados por meio da dinâmica do sistema.</p>{columns.map((content, i) => <div key={i}>{content}</div>)}<p>Colocamos os vetores lado a lado, nesta ordem:</p>{formula(`U=[B\\ AB\\ \\cdots\\ A^{n-1}B]=${matrix(u)}`)}</>);
  const rankU = rankSteps('Controlabilidade', u, true);
  let row = cc;
  const rows = [formula(`C=${matrix(cc)}`)];
  for (let k = 1; k < n; k++) { const prior = row; row = mul(row, aa); rows.push(formula(`CA^{${k}}=(CA^{${k - 1}})A=${matrix(prior)}${matrix(aa)}=${matrix(row)}`)); }
  push('Construir a matriz de observabilidade', <><p>Multiplicamos C sucessivamente por A. As linhas representam as informações sobre os estados presentes na saída e em suas derivadas.</p>{rows.map((content, i) => <div key={i}>{content}</div>)}<p>Empilhamos os vetores linha, nesta ordem:</p>{formula(`V=\\begin{bmatrix}C\\\\CA\\\\\\vdots\\\\CA^{n-1}\\end{bmatrix}=${matrix(v)}`)}</>);
  const rankV = rankSteps('Observabilidade', v, false);
  if (!incluir) return steps;
  function design(observer: boolean, text: string, rank: number) {
    const name = observer ? 'observador' : 'realimentação';
    if (rank !== n) { push(`Condição para o projeto de ${name}`, <p>O posto é {rank}, menor que {n}. O sistema não é {observer ? 'observável' : 'controlável'}: o projeto completo por Ackermann está indisponível. A análise anterior permanece válida.</p>); return; }
    try {
      // Valida o grau e os coeficientes antes de construir a memória.
      const rawGain = observer ? projetar(tr(aa), tr(cc), text) : projetar(aa, bb, text);
      const ps = parse(text).flat(), symbol = observer ? 'o' : 'c';
      push(`Definir o polinômio desejado · ${name}`, <><p>Os coeficientes informados definem um polinômio mônico de grau {n}. Quando partimos dos polos desejados, multiplicamos os fatores (s − pᵢ). Polos complexos conjugados produzem fatores quadráticos reais.</p>{formula(`q_${symbol}(s)=\\prod_{i=1}^{${n}}(s-p_i)=${polynomial(ps)}`)}<p>{observer ? 'O erro de estimação deve evoluir segundo A − LC.' : 'Adotamos u = Kx, como na lista. Portanto, a matriz de malha fechada é A + BK, e o ganho de Ackermann convencional precisa ter o sinal invertido.'}</p></>);
      let q = eye(n);
      const terms: React.ReactNode[] = [];
      for (let k = 1; k < ps.length; k++) {
        const before = q;
        q = add(mul(q, aa), eye(n), ps[k]);
        terms.push(<div key={k}>{formula(`Q_{${k}}=Q_{${k - 1}}A+(${number(ps[k])})I=${matrix(before)}${matrix(aa)}+(${number(ps[k])})I=${matrix(q)}`)}</div>);
      }
      push(`Avaliar q${observer ? 'ₒ' : '꜀'}(A) · ${name}`, <><p>Substituímos s pela matriz A. Usamos Horner para mostrar cada multiplicação e soma. Começamos com Q₀ = I; o último resultado é q(A).</p>{terms}{formula(`q_${symbol}(A)=${matrix(q)}`)}</>);
      const inverse = inv(observer ? v : u), en = [eye(n)[n - 1]];
      const gainValue = observer ? tr(rawGain) : rawGain.map(r => r.map(x => -x));
      const intermediate = observer ? mul(q, inverse) : mul(en, inverse);
      push(`Aplicar Ackermann · ${name}`, <>
        <p>{observer ? 'Pela dualidade, usamos a matriz de observabilidade V e o último vetor da base eₙ. A ordem dos produtos é importante.' : 'Usamos a inversa da matriz de controlabilidade U e o último vetor da base eₙ. O sinal negativo corresponde à convenção u = Kx.'}</p>
        {formula(observer ? 'L=q_o(A)V^{-1}e_n' : 'K=-e_n^TU^{-1}q_c(A)')}
        {formula(`${observer ? 'V' : 'U'}^{-1}=${matrix(inverse)}`)}{formula(`e_n^T=${matrix(en)}`)}
        {formula(observer ? `q_o(A)V^{-1}=${matrix(intermediate)}` : `e_n^TU^{-1}=${matrix(intermediate)}`)}
        {formula(observer ? `L=${matrix(intermediate)}${matrix(tr(en))}=${matrix(gainValue)}` : `K=-${matrix(intermediate)}${matrix(q)}=${matrix(gainValue)}`)}
      </>);
      const product = observer ? mul(gainValue, cc) : mul(bb, gainValue);
      const closed = add(aa, product, observer ? -1 : 1), actual = poly(closed);
      const residual = Math.max(...actual.map((x, i) => Math.abs(x - ps[i]) / Math.max(1, Math.abs(ps[i]))));
      push(`Verificar o projeto de ${name}`, <>
        {formula(observer ? `LC=${matrix(product)}` : `BK=${matrix(product)}`)}
        {formula(`${observer ? 'A-LC' : 'A+BK'}=${matrix(aa)}${observer ? '-' : '+'}${matrix(product)}=${matrix(closed)}`)}
        <p>Recalculamos o polinômio característico da matriz obtida e comparamos seus coeficientes com o polinômio desejado.</p>
        {formula(`\\det(sI-(${observer ? 'A-LC' : 'A+BK'}))=${polynomial(actual)}`)}
        {formula(`q_${symbol}(s)=${polynomial(ps)}`)}
        <p>Maior erro relativo escalonado entre coeficientes: {residual.toExponential(3)}. <strong>{residual <= 1e-7 ? 'O polinômio obtido coincide com o desejado dentro da tolerância de 10⁻⁷.' : 'A verificação não atingiu a tolerância de 10⁻⁷. Reveja a escala dos dados antes de usar o ganho.'}</strong></p>
        {observer ? <>{formula('\\dot{\\hat{x}}=A\\hat{x}+Bu+L(y-C\\hat{x})')}{formula('e=x-\\hat{x},\\qquad\\dot{e}=(A-LC)e')}</> : formula(`u=Kx=${matrix(gainValue)}x`)}
      </>);
    } catch (e) { push(`Revisar dados · ${name}`, <p role="alert">{(e as Error).message}</p>); }
  }
  design(false, p, rankU);
  design(true, o, rankV);
  return steps;
}

export function PassosUnidade3({ steps, current, all }: { steps: PassoUnidade3[]; current: number; all: boolean }) {
  return <div className="u3-steps">{steps.map((step, i) => <section key={i} className="u3-step" data-inactive={!all && i !== current ? 'true' : undefined} aria-label={`Passo ${i + 1}: ${step.title}`}><p className="u3-step-count">Passo {i + 1} de {steps.length}</p><h2>{step.title}</h2>{step.content}</section>)}</div>;
}

export default function Unidade3() {
  const [selected, setSelected] = useState(0);
  const [a, A] = useState(models[0].a), [b, B] = useState(models[0].b), [c, C] = useState(models[0].c);
  const [p, P] = useState(''), [o, O] = useState('');
  const [incluir, setIncluir] = useState(false);
  const [result, R] = useState<PassoUnidade3[] | null>(null), [err, E] = useState('');
  const [current, setCurrent] = useState(0);
  const [all, setAll] = useState(false);
  const invalidate = () => { R(null); E(''); };
  function selecionar(index: number) {
    const m = models[index];
    setSelected(index); A(m.a); B(m.b); C(m.c); P(m.p); O(m.o); setIncluir(m.projeto); invalidate();
  }
  function solve() {
    try {
      const canonical = selected === 4 && a === models[4].a && b === models[4].b && c === models[4].c;
      R(gerarPassos(a, b, c, incluir, p, o, canonical));
      setCurrent(0);
      E('');
    } catch (e) { E((e as Error).message); R(null); }
  }
  const field = (label: string, value: string, setter: (s: string) => void) => <label key={label}>{label}<textarea value={value} onChange={e => { setter(e.target.value); invalidate(); }} /></label>;
  return <article className="u3"><h1>Espaço de estados</h1><p>Analise estabilidade, controlabilidade e observabilidade. Projete realimentação de estados e observadores por Ackermann.</p>
    <label className="no-print">Exercício<select value={selected} onChange={e => selecionar(Number(e.target.value))}>{models.map((m, i) => <option value={i} key={m.name}>{m.name}</option>)}</select></label>
    <p>{models[selected].descricao}</p>
    <div className="u3-inputs no-print">{field('Matriz A', a, A)}{field('Vetor B', b, B)}{field('Vetor C', c, C)}</div>
    <label className="u3-checkbox no-print"><input type="checkbox" checked={incluir} aria-controls="u3-polinomios" onChange={e => { setIncluir(e.target.checked); invalidate(); }} />Incluir polinomio desejado</label>
    {incluir && <div id="u3-polinomios" className="no-print"><div className="u3-inputs">{field('Polinômio desejado · realimentação', p, P)}{field('Polinômio desejado · observador', o, O)}</div><p>Informe os coeficientes em ordem decrescente, começando por 1. Os exemplos são calculados a partir dos polos do enunciado.</p></div>}
    <p className="no-print">Separe linhas das matrizes por quebra de linha e valores por espaço. Sem polinômio desejado, será realizada apenas a análise do sistema.</p>
    <div className="u3-actions no-print"><button className="btn btn-primary" onClick={solve}>{incluir ? 'Analisar e projetar' : 'Analisar sistema'}</button>{' '}<button className="btn btn-secondary" onClick={() => window.print()} disabled={!result}>Imprimir resolução</button></div>
    {err && <p role="alert">{err}</p>}{result && <div className="u3-resolution">
      <h2>{models[selected].name} · Resolução</h2>
      <div className="no-print"><StepNavigator steps={result.map((step, i) => ({ title: step.title, stepNumber: i + 1, hasChart: false }))} currentStepIndex={current} onSelectStep={setCurrent} viewAllMode={all} onToggleViewAll={() => setAll(value => !value)} /></div>
      <div aria-live="polite" className="u3-sr-only">{all ? `Exibindo todos os ${result.length} passos` : `Passo ${current + 1} de ${result.length}: ${result[current].title}`}</div>
      <PassosUnidade3 steps={result} current={current} all={all} />
    </div>}
  </article>;
}
