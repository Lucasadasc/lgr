import { describe, expect, it } from 'vitest';
import { projetarControlador, type EntradaProjeto } from './index';
import { analisarExpressaoAfim } from './personalizado';
import { EXERCICIOS_LISTA2 } from './exemplos';
import { criarResolucaoImpressao, requisitosImpressao } from './impressao';
import { discretizar } from './discretizacao';
import { equacaoDiferencas } from './formatacao';
import { avaliarPolinomioComplexo, dividirComplexos } from '../lgr';

const entrada = (num = 'a', den = '1; b', modo: 'informar' | 'sintetizar' = 'sintetizar'): EntradaProjeto<'personalizado'> => ({
  G: { num: [1], den: [1, 1] }, H: { num: [1], den: [1] }, topologia: 'personalizado',
  especificacao: { modo: 'polo', re: -2, im: 3 }, personalizado: { modo, numerador: num, denominador: den },
});

describe('controlador personalizado', () => {
  it('sintetiza a/(s+b) pela equação característica independente', () => {
    const r = projetarControlador(entrada());
    if (r.tipo !== 'personalizado') throw Error('Tipo incorreto');
    expect(r.parametros).toEqual({ a: 10, b: 3 });
    expect(r.fechada.den).toEqual([1, 4, 13]);
    expect(r.poloAtendido).toBe(true);
    expect(r.residuo).toBeLessThan(1e-12);
  });
  it('inclui os ganhos originais de G e H na síntese da lista 2', () => {
    const r = projetarControlador({ ...EXERCICIOS_LISTA2[1].entrada, topologia: 'personalizado', personalizado: entrada().personalizado });
    if (r.tipo !== 'personalizado') throw Error('Tipo incorreto');
    expect(r.parametros.a).toBeCloseTo(7995 / 2104, 10);
    expect(r.parametros.b).toBeCloseTo(738 / 263, 10);
  });
  it('resolve expressões afins e nomes de parâmetros diferentes', () => {
    const r = projetarControlador(entrada('ganho', '1; 2*polo+1'));
    if (r.tipo !== 'personalizado') throw Error('Tipo incorreto');
    expect(r.parametros).toEqual({ ganho: 10, polo: 1 });
    expect(analisarExpressaoAfim('constructor+1').termos.constructor).toBe(1);
    expect(analisarExpressaoAfim('-(2*a+1)/4')).toEqual({ constante: -0.25, termos: { a: -0.5 } });
  });
  it('resolve um parâmetro quando as duas equações são compatíveis', () => {
    const r = projetarControlador({ ...entrada('k', '1; 0'), especificacao: { modo: 'polo', re: -0.5, im: Math.sqrt(3) / 2 } });
    if (r.tipo !== 'personalizado') throw Error('Tipo incorreto');
    expect(r.parametros.k).toBeCloseTo(1, 12);
    expect(r.poloAtendido).toBe(true);
  });
  it('avalia o controlador informado sem afirmar que posicionou o par', () => {
    const r = projetarControlador(entrada('1', '1; 1', 'informar'));
    if (r.tipo !== 'personalizado') throw Error('Tipo incorreto');
    expect(r.Gc).toEqual({ num: [1], den: [1, 1] });
    expect(r.poloAtendido).toBe(false);
    expect(requisitosImpressao(criarResolucaoImpressao(r)).every(c => c.atende)).toBe(false);
  });
  it('gera relatório de malha estática sem polos', () => {
    const r = projetarControlador({ ...entrada('2', '1', 'informar'), G: { num: [1], den: [1] } });
    expect(r.polos).toEqual([]);
    expect(() => requisitosImpressao(criarResolucaoImpressao(r))).not.toThrow();
  });
  it.each([
    ['a*b', '1; b', /afins/], ['a+b', '1; 1', /singulares/],
    ['a', '1; 0', /não satisfazem/], ['a+b+c', '1; b', /um ou dois/],
    ['1', '0', /denominador/], ['1; ', '1', /coeficientes/],
    ['globalThis.alert(1)', '1', /inválid/], ['1/0', '1', /constante/],
  ])('rejeita modelo inválido %s / %s', (num, den, message) => {
    expect(() => projetarControlador(entrada(num, den))).toThrow(message);
  });
});

describe('memória algébrica da discretização', () => {
  it('expõe a expansão e a normalização do integrador por Tustin', () => {
    const d = discretizar({ num: [1], den: [1, 0] }, 0.5, 'tustin');
    expect(d.memoria.u).toEqual([4, -4]);
    expect(d.memoria.v).toEqual([1, 1]);
    expect(d.memoria.numeradorBruto).toEqual([1, 1]);
    expect(d.memoria.denominadorBruto).toEqual([4, -4]);
    expect(d.num).toEqual([0.25, 0.25]);
    expect(d.den).toEqual([1, -1]);
  });
  it('mantém o sinal correto do termo de saída do PD por Tustin', () => {
    const d = discretizar({ num: [0.03046, 0.26376], den: [1] }, 2, 'tustin');
    expect(d.den).toEqual([1, 1]);
    expect(d.num[0]).toBeCloseTo(0.29422);
    expect(equacaoDiferencas(d)).toContain('-1u[k-1]');
  });
  it.each(['forward', 'backward', 'tustin'] as const)('preserva a função por substituição em %s', metodo => {
    const tf = { num: [2, 3, 4], den: [1, 5, 6] }, T = 0.25, z = { re: 1.5, im: 0.7 };
    const d = discretizar(tf, T, metodo);
    const s = dividirComplexos(avaliarPolinomioComplexo(d.memoria.u, z), avaliarPolinomioComplexo(d.memoria.v, z));
    const esperado = dividirComplexos(avaliarPolinomioComplexo(tf.num, s), avaliarPolinomioComplexo(tf.den, s));
    const obtido = dividirComplexos(avaliarPolinomioComplexo(d.num, z), avaliarPolinomioComplexo(d.den, z));
    expect(obtido.re).toBeCloseTo(esperado.re, 11);
    expect(obtido.im).toBeCloseTo(esperado.im, 11);
  });
});
