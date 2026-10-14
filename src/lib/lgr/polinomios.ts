// Utilitários de polinômios (coefs em ordem decrescente, como numpy.poly)
import type { Complex } from "./tipos";
import {
  criarComplexo,
  somarComplexos,
  multiplicarComplexos,
} from "./complexos";

export function analisarCoeficientes(texto: string): number[] | null {
  try {
    const valores = texto
      .trim()
      .split(/[\s,;]+/)
      .filter(Boolean)
      .map(Number);
    if (valores.length === 0 || valores.some((v) => Number.isNaN(v)))
      return null;
    return valores;
  } catch {
    return null;
  }
}

export function multiplicarPolinomios(
  a: readonly number[],
  b: readonly number[],
): number[] {
  const saida = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++) saida[i + j] += a[i] * b[j];
  return saida;
}

export function preencherZerosEsquerda(
  coeficientes: readonly number[],
  tamanho: number,
): number[] {
  return coeficientes.length >= tamanho
    ? [...coeficientes]
    : [...new Array(tamanho - coeficientes.length).fill(0), ...coeficientes];
}

export function somarPolinomios(
  a: readonly number[],
  b: readonly number[],
): number[] {
  const n = Math.max(a.length, b.length);
  const pa = preencherZerosEsquerda(a, n);
  const pb = preencherZerosEsquerda(b, n);
  return pa.map((v, i) => v + pb[i]);
}

export function subtrairPolinomios(
  a: readonly number[],
  b: readonly number[],
): number[] {
  const n = Math.max(a.length, b.length);
  const pa = preencherZerosEsquerda(a, n);
  const pb = preencherZerosEsquerda(b, n);
  return pa.map((v, i) => v - pb[i]);
}

export function derivarPolinomio(polinomio: readonly number[]): number[] {
  if (polinomio.length <= 1) return [0];
  const grau = polinomio.length - 1;
  return polinomio.slice(0, -1).map((c, k) => c * (grau - k));
}

export function avaliarPolinomioReal(
  polinomio: readonly number[],
  x: number,
): number {
  return polinomio.reduce((acc, c) => acc * x + c, 0);
}

export function avaliarPolinomioComplexo(
  polinomio: readonly number[],
  s: Complex,
): Complex {
  let acumulado: Complex = criarComplexo(0, 0);
  for (const c of polinomio)
    acumulado = somarComplexos(
      multiplicarComplexos(acumulado, s),
      criarComplexo(c, 0),
    );
  return acumulado;
}
