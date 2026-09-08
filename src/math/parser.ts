import { Complex } from './complex';
import { Polynomial } from './polynomial';

/**
 * Parse an input string into a Polynomial
 * Supports:
 * - Comma/space-separated coefficients: "1, 4, 0" or "1 4 0"
 * - Polynomial terms: "s^2 + 4s" or "s^3 + 6s^2 + 25s"
 * - Factored products: "s*(s+4)*(s^2 + 8s + 32)"
 */
export function parsePolynomialInput(input: string): Polynomial {
  if (!input || input.trim() === '') {
    return new Polynomial([1]);
  }

  const clean = input.trim().replace(/\s+/g, ' ');

  // 1. Check if it's purely comma or space separated numbers
  // e.g. "1, 4, 0" or "1, -2.5, 3"
  const isNumericList = /^[-+]?([0-9]+(\.[0-9]+)?|[0-9]*\.[0-9]+)(\s*,\s*[-+]?([0-9]+(\.[0-9]+)?|[0-9]*\.[0-9]+))*$/.test(
    clean
  );

  if (isNumericList && clean.includes(',')) {
    const coeffs = clean.split(',').map((s) => parseFloat(s.trim()));
    if (coeffs.every((c) => !isNaN(c))) {
      return new Polynomial(coeffs);
    }
  }

  // 2. Check if it's space-separated numbers without variable s
  if (!clean.toLowerCase().includes('s')) {
    const parts = clean.split(/[\s,]+/).map(Number);
    if (parts.length > 0 && parts.every((p) => !isNaN(p))) {
      return new Polynomial(parts);
    }
  }

  // 3. Product of factors e.g. "s * (s + 2) * (s + 4)^2"
  if (clean.includes('(') || clean.includes('*')) {
    try {
      return parseFactoredExpression(clean);
    } catch {
      // Fallback
    }
  }

  // 4. Standard polynomial in s: "s^3 + 6s^2 + 25s + 10"
  return parseStandardPolynomial(clean);
}

/**
 * Parse roots string (real or complex) like "0, -4, -4+4j, -4-4j"
 */
export function parseRootsToPolynomial(rootsStr: string, gain: number = 1): Polynomial {
  if (!rootsStr || rootsStr.trim() === '') {
    return new Polynomial([gain]);
  }

  const items = rootsStr.split(',').map((s) => s.trim()).filter(Boolean);
  let poly = new Polynomial([gain]);

  for (const item of items) {
    const complexRoot = parseComplexNumber(item);
    if (complexRoot.isReal()) {
      // (s - root.re)
      poly = poly.mul(new Polynomial([1, -complexRoot.re]));
    } else {
      // (s - (re + im*j))
      // If user provided a single complex root without conjugate, we multiply by (s - z)
      // but in control systems, complex poles come in conjugate pairs:
      // s^2 - 2*re*s + (re^2 + im^2)
      // Check if user already typed both or just one
      const re = complexRoot.re;
      const im = complexRoot.im;
      poly = poly.mul(new Polynomial([1, -2 * re, re * re + im * im]));
    }
  }

  return poly;
}

export function parseComplexNumber(str: string): Complex {
  const clean = str.replace(/\s+/g, '').replace(/i/g, 'j');

  // Pure real number: "4" or "-2.5"
  if (!clean.includes('j')) {
    const val = parseFloat(clean);
    return new Complex(isNaN(val) ? 0 : val, 0);
  }

  // Pure imaginary: "4j" or "-3.5j" or "j" or "-j"
  if (clean === 'j' || clean === '+j') return new Complex(0, 1);
  if (clean === '-j') return new Complex(0, -1);

  const pureImMatch = clean.match(/^([-+]?[0-9]*\.?[0-9]+)j$/);
  if (pureImMatch) {
    return new Complex(0, parseFloat(pureImMatch[1]));
  }

  // Mixed: " -4 + 4j " or " 2 - 3j "
  const mixedMatch = clean.match(/^([-+]?[0-9]*\.?[0-9]+)([-+][0-9]*\.?[0-9]*)j$/);
  if (mixedMatch) {
    const re = parseFloat(mixedMatch[1]);
    let imStr = mixedMatch[2];
    if (imStr === '+' || imStr === '') imStr = '1';
    if (imStr === '-') imStr = '-1';
    const im = parseFloat(imStr);
    return new Complex(re, im);
  }

  return new Complex(0, 0);
}

/**
 * Parses expression with parenthesized factors
 */
function parseFactoredExpression(expr: string): Polynomial {
  // Normalize tokens
  let s = expr.replace(/\s+/g, '');
  // Match factors like (s+2), (s^2+4s+5)^2, s, s^2
  const factorRegex = /(\([^)]+\)(\^\d+)?|[a-zA-Z](\^\d+)?|\d+(\.\d+)?)/g;
  const matches = s.match(factorRegex);

  if (!matches || matches.length === 0) {
    return parseStandardPolynomial(expr);
  }

  let result = new Polynomial([1]);

  for (const match of matches) {
    let factor = match;
    let power = 1;

    if (factor.includes('^')) {
      const parts = factor.split('^');
      factor = parts[0];
      power = parseInt(parts[1], 10) || 1;
    }

    if (factor.startsWith('(') && factor.endsWith(')')) {
      factor = factor.slice(1, -1);
    }

    const subPoly = parseStandardPolynomial(factor);
    for (let p = 0; p < power; p++) {
      result = result.mul(subPoly);
    }
  }

  return result;
}

/**
 * Parses standard polynomial like "s^3 + 6s^2 + 25s + 10" or "s^2 + 4"
 */
function parseStandardPolynomial(polyStr: string): Polynomial {
  let s = polyStr.replace(/\s+/g, '').replace(/-/g, '+-');
  if (s.startsWith('+-')) s = s.slice(1);
  const terms = s.split('+').filter(Boolean);

  const termMap = new Map<number, number>(); // power -> coefficient
  let maxDegree = 0;

  for (const term of terms) {
    let coeff = 1;
    let power = 0;

    if (term.toLowerCase().includes('s')) {
      const parts = term.toLowerCase().split('s');
      const cStr = parts[0];
      if (cStr === '' || cStr === '+') coeff = 1;
      else if (cStr === '-') coeff = -1;
      else coeff = parseFloat(cStr);

      const pStr = parts[1];
      if (!pStr || pStr === '') power = 1;
      else if (pStr.startsWith('^')) power = parseInt(pStr.slice(1), 10) || 1;
      else power = 1;
    } else {
      coeff = parseFloat(term);
      power = 0;
    }

    if (!isNaN(coeff)) {
      termMap.set(power, (termMap.get(power) || 0) + coeff);
      maxDegree = Math.max(maxDegree, power);
    }
  }

  const coeffs: number[] = [];
  for (let p = maxDegree; p >= 0; p--) {
    coeffs.push(termMap.get(p) || 0);
  }

  return new Polynomial(coeffs.length > 0 ? coeffs : [1]);
}
