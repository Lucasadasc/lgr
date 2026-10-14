import { avaliarPolinomioComplexo, anguloEmGraus, dividirComplexos, moduloComplexo, type Complex } from '../lgr';
import { converterEspecificacao, validarTf, produtoTf, fecharMalha, raizesVerificadas, type EntradaProjeto, type ResultadoProjetoBase } from './index';
import { numeroLatex } from './formatacao';

export interface ConfiguracaoPersonalizada {
  modo: 'informar' | 'sintetizar';
  numerador: string;
  denominador: string;
}
interface Afim { constante: number; termos: Record<string, number> }
const coefParametro = (termos: Record<string, number>, nome: string) => Object.prototype.hasOwnProperty.call(termos, nome) ? termos[nome] : 0;
const escalar = (a: Afim, k: number): Afim => ({ constante: a.constante * k, termos: Object.fromEntries(Object.entries(a.termos).map(([p, v]) => [p, v * k]).filter(([, v]) => v !== 0)) });
const somar = (a: Afim, b: Afim): Afim => {
  const termos = { ...a.termos };
  for (const [p, v] of Object.entries(b.termos)) { termos[p] = coefParametro(termos, p) + v; if (termos[p] === 0) delete termos[p]; }
  return { constante: a.constante + b.constante, termos };
};
const constante = (n: number): Afim => ({ constante: n, termos: {} });

// Parser de expressões afins: nunca executa código digitado pelo usuário.
export function analisarExpressaoAfim(texto: string): Afim {
  const tokens = texto.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z][a-zA-Z0-9_]*|[()+\-*/]|\S/g) ?? [];
  let i = 0;
  const fator = (): Afim => {
    const t = tokens[i++];
    if (t === '+' || t === '-') return escalar(fator(), t === '-' ? -1 : 1);
    if (t === '(') { const a = expressao(); if (tokens[i++] !== ')') throw Error('Feche os parênteses do coeficiente.'); return a; }
    if (t && /^(?:\d|\.)/.test(t) && Number.isFinite(Number(t))) return constante(Number(t));
    if (t && /^[a-zA-Z][a-zA-Z0-9_]{0,11}$/.test(t)) return { constante: 0, termos: { [t]: 1 } };
    throw Error('Coeficiente inválido. Use números, parâmetros e +, −, *, / ou parênteses.');
  };
  const produto = (): Afim => {
    let a = fator();
    while (tokens[i] === '*' || tokens[i] === '/') {
      const op = tokens[i++], b = fator();
      if (op === '/') {
        if (Object.keys(b.termos).length || b.constante === 0) throw Error('Divida somente por uma constante numérica diferente de zero.');
        a = escalar(a, 1 / b.constante);
      } else {
        if (Object.keys(a.termos).length && Object.keys(b.termos).length) throw Error('A síntese aceita coeficientes afins: produtos entre parâmetros não são suportados.');
        a = Object.keys(a.termos).length ? escalar(a, b.constante) : escalar(b, a.constante);
      }
    }
    return a;
  };
  const expressao = (): Afim => {
    let a = produto();
    while (tokens[i] === '+' || tokens[i] === '-') { const op = tokens[i++]; a = somar(a, escalar(produto(), op === '-' ? -1 : 1)); }
    return a;
  };
  const resultado = expressao();
  if (i !== tokens.length || ![resultado.constante, ...Object.values(resultado.termos)].every(Number.isFinite)) throw Error('Expressão inválida ou não finita. Separe coeficientes por ponto e vírgula.');
  return resultado;
}
export const nomeParametroLatex = (nome: string) => `\\mathrm{${nome.replaceAll('_', '\\_')}}`;
const afimLatex = (a: Afim) => [...(a.constante ? [numeroLatex(a.constante)] : []), ...Object.entries(a.termos).map(([p, v]) => `${v === 1 ? '' : v === -1 ? '-' : numeroLatex(v)}${nomeParametroLatex(p)}`)].join(' + ').replaceAll('+ -', '- ') || '0';
const polinomioAfimLatex = (a: Afim[]) => a.flatMap((c, i) => c.constante === 0 && !Object.keys(c.termos).length ? [] : [`(${afimLatex(c)})${a.length - i - 1 ? `s^{${a.length - i - 1}}` : ''}`]).join(' + ') || '0';
export function analisarModeloPersonalizado(c: ConfiguracaoPersonalizada) {
  const ler = (s: string) => {
    const partes = /[;,]/.test(s) ? s.split(/[;,]/) : /^[\d.eE+\-\s]+$/.test(s) ? s.trim().split(/\s+/) : [s];
    if (!s.trim() || partes.some(p => !p.trim()) || partes.length > 13) throw Error('Informe de 1 a 13 coeficientes. Separe expressões por ;.');
    return partes.map(analisarExpressaoAfim);
  };
  const num = ler(c.numerador), den = ler(c.denominador);
  if (den.every(a => a.constante === 0 && Object.keys(a.termos).length === 0)) throw Error('O denominador não pode ser nulo.');
  const parametros = [...new Set([...num, ...den].flatMap(a => Object.keys(a.termos)))];
  if (c.modo === 'informar' && parametros.length) throw Error('Para usar parâmetros, selecione Calcular parâmetros a partir do polo.');
  if (c.modo !== 'informar' && c.modo !== 'sintetizar') throw Error('Escolha informar ou sintetizar o controlador.');
  return { num, den, parametros, latex: `\\frac{${polinomioAfimLatex(num)}}{${polinomioAfimLatex(den)}}` };
}
export interface ResultadoPersonalizado extends ResultadoProjetoBase {
  tipo: 'personalizado';
  entrada: EntradaProjeto<'personalizado'>;
  modeloLatex: string;
  parametros: Record<string, number>;
  constanteEquacao: Complex;
  contribuicoes: { nome: string; valor: Complex }[];
  poloAtendido: boolean;
}
export function resolverPersonalizado(entrada: EntradaProjeto): ResultadoPersonalizado {
  const config = entrada.personalizado;
  if (!config) throw Error('Informe a configuração do controlador personalizado.');
  const modelo = analisarModeloPersonalizado(config);
  const G = validarTf(entrada.G), H = validarTf(entrada.H), GH = produtoTf(G, H);
  const esp = converterEspecificacao(entrada.especificacao), sd = esp.sd;
  const nGH = avaliarPolinomioComplexo(GH.num, sd), dGH = avaliarPolinomioComplexo(GH.den, sd);
  const avaliar = (campo: string | null): Complex => {
    const num = modelo.num.map(a => campo ? coefParametro(a.termos, campo) : a.constante);
    const den = modelo.den.map(a => campo ? coefParametro(a.termos, campo) : a.constante);
    const n = avaliarPolinomioComplexo(num, sd), d = avaliarPolinomioComplexo(den, sd);
    return { re: d.re * dGH.re - d.im * dGH.im + n.re * nGH.re - n.im * nGH.im,
      im: d.re * dGH.im + d.im * dGH.re + n.re * nGH.im + n.im * nGH.re };
  };
  const constanteEquacao = avaliar(null);
  const contribuicoes = modelo.parametros.map(nome => ({ nome, valor: avaliar(nome) }));
  const parametros: Record<string, number> = {};
  if (config.modo === 'sintetizar') {
    if (!contribuicoes.length || contribuicoes.length > 2) throw Error('Um polo complexo fornece duas equações reais. Informe um ou dois parâmetros independentes nos coeficientes.');
    const escalas = contribuicoes.map(c => Math.hypot(c.valor.re, c.valor.im));
    if (escalas.some(s => !Number.isFinite(s) || s === 0)) throw Error('Um parâmetro não influencia a equação neste polo. Altere o modelo ou o polo.');
    const a = contribuicoes[0].valor, x = a.re / escalas[0], y = a.im / escalas[0];
    if (contribuicoes.length === 1) parametros[contribuicoes[0].nome] = -(x * constanteEquacao.re + y * constanteEquacao.im) / escalas[0];
    else {
      const b = contribuicoes[1].valor, u = b.re / escalas[1], v = b.im / escalas[1], det = x * v - y * u;
      if (Math.abs(det) <= 1e-12) throw Error('As equações são singulares: os parâmetros não têm solução real única neste polo.');
      parametros[contribuicoes[0].nome] = (-constanteEquacao.re * v + constanteEquacao.im * u) / det / escalas[0];
      parametros[contribuicoes[1].nome] = (-x * constanteEquacao.im + y * constanteEquacao.re) / det / escalas[1];
    }
  }
  const valorCoef = (a: Afim) => a.constante + Object.entries(a.termos).reduce((s, [p, v]) => s + v * parametros[p], 0);
  const Gc = validarTf({ num: modelo.num.map(valorCoef), den: modelo.den.map(valorCoef) });
  const malha = produtoTf(Gc, GH), fechada = fecharMalha(produtoTf(Gc, G), H);
  const polos = raizesVerificadas(fechada.den);
  const escala = fechada.den.reduce((s, c) => s * moduloComplexo(sd) + Math.abs(c), 0);
  const residuo = moduloComplexo(avaliarPolinomioComplexo(fechada.den, sd)) / (escala || 1);
  const erroPolo = polos.length ? Math.min(...polos.map(p => Math.hypot(p.re - sd.re, p.im - sd.im))) : Infinity;
  const poloAtendido = Number.isFinite(residuo) && residuo < 1e-8 && erroPolo < 1e-6 * Math.max(1, moduloComplexo(sd));
  if (config.modo === 'sintetizar' && !poloAtendido) throw Error('Os parâmetros não satisfazem as duas equações no polo desejado. Altere o modelo ou o polo.');
  const valorGH = moduloComplexo(dGH) ? dividirComplexos(nGH, dGH) : null;
  const denL = avaliarPolinomioComplexo(malha.den, sd);
  const L = moduloComplexo(denL) ? dividirComplexos(avaliarPolinomioComplexo(malha.num, sd), denL) : null;
  const avisos: string[] = [];
  if (!poloAtendido) avisos.push('O controlador informado não posiciona os polos no par desejado. A resposta abaixo avalia o controlador efetivamente informado.');
  if (Gc.num.length > Gc.den.length) avisos.push('O controlador é impróprio. Confira a causalidade da discretização.');
  if (raizesVerificadas(Gc.den).some(p => p.re >= 0)) avisos.push('O controlador isolado tem polos fora do semiplano esquerdo. Confira a malha fechada completa.');
  return { tipo: 'personalizado', entrada: { ...entrada, G, H, topologia: 'personalizado', personalizado: { ...config } }, ...esp,
    modeloLatex: modelo.latex, parametros, constanteEquacao, contribuicoes, poloAtendido,
    Kc: 1, GH, Gc, estrutura: Gc, malha, fechada, polos, erroPolo, residuo, parcelas: [],
    faseGH: valorGH ? anguloEmGraus(valorGH) : 0, moduloGH: valorGH ? moduloComplexo(valorGH) : Infinity,
    faseGanho: GH.num[0] / GH.den[0] < 0 ? 180 : 0,
    erroAngulo: L ? Math.abs((((anguloEmGraus(L) - 180) % 360) + 540) % 360 - 180) : Infinity,
    erroModulo: L ? Math.abs(moduloComplexo(L) - 1) : Infinity, avisos };
}
