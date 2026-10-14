import type { Complex } from "./tipos";

export function criarComplexo(re: number, im = 0): Complex {
  return { re, im };
}

export function somarComplexos(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function subtrairComplexos(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function multiplicarComplexos(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function dividirComplexos(a: Complex, b: Complex): Complex {
  const divisor = b.re * b.re + b.im * b.im || 1e-300;
  return {
    re: (a.re * b.re + a.im * b.im) / divisor,
    im: (a.im * b.re - a.re * b.im) / divisor,
  };
}

export function moduloComplexo(z: Complex): number {
  return Math.hypot(z.re, z.im);
}

export function anguloEmGraus(z: Complex): number {
  return (Math.atan2(z.im, z.re) * 180) / Math.PI;
}

export function ehNumeroReal(z: Complex, tolerancia = 1e-6): boolean {
  return Math.abs(z.im) < tolerancia;
}
