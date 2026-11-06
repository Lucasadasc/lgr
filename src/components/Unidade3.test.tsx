import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Unidade3, { models, analisar, projetar, poly, parse, gerarPassos, PassosUnidade3 } from './Unidade3';
const transpose = (a: number[][]) => a[0].map((_, j) => a.map(r => r[j]));
describe('Unidade 3 · lista e projetos', () => {
  it('inclui todos os exercícios e deixa projetos habilitados somente nas questões 2, 3 e 4', () => {
    expect(models).toHaveLength(5);
    expect(models.map(m => m.projeto)).toEqual([false, false, true, true, true]);
    const html = renderToStaticMarkup(<Unidade3 />);
    expect(html).toContain('Incluir polinomio desejado');
    expect(html).not.toContain('<textarea>1 14');
    expect(html).toContain('Questão 4');
  });
  for (const m of models.filter(x => x.projeto)) {
    it(`${m.name}: ganhos produzem os polinômios especificados`, () => {
      const { aa, bb, cc } = analisar(m.a, m.b, m.c);
      const kNegativo = projetar(aa, bb, m.p);
      const fechada = aa.map((r, i) => r.map((x, j) => x - bb[i][0] * kNegativo[0][j]));
      poly(fechada).forEach((v, i) => expect(v).toBeCloseTo(parse(m.p).flat()[i], 7));
      const l = transpose(projetar(transpose(aa), transpose(cc), m.o));
      const erro = aa.map((r, i) => r.map((x, j) => x - l[i][0] * cc[0][j]));
      poly(erro).forEach((v, i) => expect(v).toBeCloseTo(parse(m.o).flat()[i], 7));
    });
  }
  it('confere a forma canônica e os polos repetidos da questão 4', () => {
    const m = models[4];
    expect(poly(parse(m.a))).toEqual([1, 3, 7, 5]);
    expect(parse(m.c)).toEqual([[-2, 4, 3]]);
    expect(parse(m.p)).toEqual([[1, 13, 56, 80]]);
    expect(parse(m.o)).toEqual([[1, 4, 5, 2]]);
  });
  it('rejeita polinômios vazios, grau errado e valores não finitos', () => {
    const { aa, bb } = analisar(models[0].a, models[0].b, models[0].c);
    for (const p of ['', '1 2', '1 NaN 2 3', '0 1 2 3']) expect(() => projetar(aa, bb, p)).toThrow();
  });
});

describe('Unidade 3 · memória de cálculo', () => {
  it.each(models)('$name: apresenta os cálculos intermediários sem erros de LaTeX', m => {
    const steps = gerarPassos(m.a, m.b, m.c, m.projeto, m.p, m.o, m === models[4]);
    expect(steps.length).toBe(m.projeto ? (m === models[4] ? 17 : 16) : 8);
    const html = renderToStaticMarkup(<PassosUnidade3 steps={steps} current={0} all />);
    expect(html).not.toContain('katex-error');
    expect(html).toContain('Faddeev');
    expect(html).toContain('operações elementares');
    expect(html).toContain('Colocamos os vetores lado a lado');
    expect(html).toContain('Empilhamos os vetores linha');
    expect(html).not.toContain('data-inactive="true"');
    if (m.projeto) {
      expect(html).toContain('Usamos Horner');
      expect(html).toContain('O polinômio obtido coincide');
      expect(html).not.toContain('A verificação não atingiu');
    }
  });
  it('mantém todas as etapas no documento para impressão, indicando apenas a etapa selecionada para a tela', () => {
    const m = models[0];
    const steps = gerarPassos(m.a, m.b, m.c, false, '', '');
    const html = renderToStaticMarkup(<PassosUnidade3 steps={steps} current={3} all={false} />);
    expect(html.match(/data-inactive="true"/g)).toHaveLength(7);
    expect(html).toContain('Passo 4 de 8');
    expect(html).toContain('Verificar observabilidade pelo posto');
  });
  it('não exige polinômios desejados quando a opção está desmarcada', () => {
    const m = models[2];
    const steps = gerarPassos(m.a, m.b, m.c, false, 'inválido', '');
    expect(steps).toHaveLength(8);
    expect(steps.some(s => s.title.includes('Ackermann'))).toBe(false);
  });
  it('isola dados inválidos do projeto sem perder a análise nem o outro projeto', () => {
    const m = models[2];
    const steps = gerarPassos(m.a, m.b, m.c, true, '1 2', m.o);
    expect(steps.some(s => s.title === 'Revisar dados · realimentação')).toBe(true);
    expect(steps.some(s => s.title === 'Verificar o projeto de observador')).toBe(true);
    expect(steps.some(s => s.title === 'Calcular o polinômio característico')).toBe(true);
  });
  it('explica por que um sistema singular não permite o projeto', () => {
    const steps = gerarPassos('0 0;0 -1', '0;0', '0 0', true, '1 3 2', '1 3 2');
    const html = renderToStaticMarkup(<PassosUnidade3 steps={steps} current={0} all />);
    expect(html).toContain('sistema não é controlável');
    expect(html).toContain('sistema não é observável');
    expect(steps.some(s => s.title.includes('Aplicar Ackermann'))).toBe(false);
  });
});
