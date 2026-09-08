import { Complex } from './complex';
import { ComplexNum, PoleZero } from '../types/lgr';

export class Polynomial {
  /**
   * Coeffs in descending power order:
   * [a_n, a_{n-1}, ..., a_1, a_0] -> a_n*s^n + ... + a_0
   */
  readonly coeffs: number[];

  constructor(coeffs: number[]) {
    // Clean leading zeros
    let firstNonZero = 0;
    while (firstNonZero < coeffs.length - 1 && Math.abs(coeffs[firstNonZero]) < 1e-12) {
      firstNonZero++;
    }
    const trimmed = coeffs.slice(firstNonZero).map((c) => (Math.abs(c) < 1e-12 ? 0 : c));
    this.coeffs = trimmed.length > 0 ? trimmed : [0];
  }

  static fromRoots(roots: (Complex | ComplexNum | number)[]): Polynomial {
    let p = new Polynomial([1]);
    for (const r of roots) {
      const root = Complex.from(r);
      if (root.isReal()) {
        // Multiply by (s - r.re)
        p = p.mul(new Polynomial([1, -root.re]));
      } else {
        // Find if conjugate exists or handle complex multiplication
        // (s - (a + bj))(s - (a - bj)) = s^2 - 2a s + (a^2 + b^2)
        // Here we can multiply by quadratic factors directly
      }
    }
    return p;
  }

  get degree(): number {
    return this.coeffs.length - 1;
  }

  isZero(): boolean {
    return this.coeffs.length === 1 && this.coeffs[0] === 0;
  }

  eval(s: Complex | number): Complex {
    const c = Complex.from(s);
    let result = new Complex(0, 0);
    for (const coeff of this.coeffs) {
      result = result.mul(c).add(coeff);
    }
    return result;
  }

  add(other: Polynomial): Polynomial {
    const maxLen = Math.max(this.coeffs.length, other.coeffs.length);
    const a = this.padLeft(maxLen);
    const b = other.padLeft(maxLen);
    const res = a.map((val, idx) => val + b[idx]);
    return new Polynomial(res);
  }

  sub(other: Polynomial): Polynomial {
    const maxLen = Math.max(this.coeffs.length, other.coeffs.length);
    const a = this.padLeft(maxLen);
    const b = other.padLeft(maxLen);
    const res = a.map((val, idx) => val - b[idx]);
    return new Polynomial(res);
  }

  mul(other: Polynomial | number): Polynomial {
    if (typeof other === 'number') {
      return new Polynomial(this.coeffs.map((c) => c * other));
    }
    const n = this.coeffs.length;
    const m = other.coeffs.length;
    const result = new Array(n + m - 1).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        result[i + j] += this.coeffs[i] * other.coeffs[j];
      }
    }
    return new Polynomial(result);
  }

  derivative(): Polynomial {
    const deg = this.degree;
    if (deg === 0) return new Polynomial([0]);
    const dCoeffs: number[] = [];
    for (let i = 0; i < deg; i++) {
      dCoeffs.push(this.coeffs[i] * (deg - i));
    }
    return new Polynomial(dCoeffs);
  }

  /**
   * Durand-Kerner (Weierstrass) method to find all real and complex roots
   */
  findRoots(maxIter: number = 200, tol: number = 1e-10): Complex[] {
    const deg = this.degree;
    if (deg <= 0) return [];
    if (deg === 1) {
      // a*s + b = 0 -> s = -b/a
      const [a, b] = this.coeffs;
      return [new Complex(-b / a, 0)];
    }
    if (deg === 2) {
      const [a, b, c] = this.coeffs;
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        return [
          new Complex((-b + Math.sqrt(disc)) / (2 * a), 0),
          new Complex((-b - Math.sqrt(disc)) / (2 * a), 0),
        ];
      } else {
        const re = -b / (2 * a);
        const im = Math.sqrt(-disc) / (2 * a);
        return [new Complex(re, im), new Complex(re, -im)];
      }
    }

    // Monic normalization: s^n + a_{n-1}s^{n-1} + ... + a_0
    const leading = this.coeffs[0];
    const monic = this.coeffs.map((c) => c / leading);

    // Initial root approximation (Aberth radius initialization)
    const roots: Complex[] = [];
    let maxCoeff = 0;
    for (let i = 1; i <= deg; i++) {
      maxCoeff = Math.max(maxCoeff, Math.abs(monic[i]));
    }
    const R = 1 + maxCoeff;

    for (let k = 0; k < deg; k++) {
      const angle = (2 * Math.PI * k + 0.5) / deg;
      const r = Math.pow(R, (k + 1) / deg) * 0.9 + 0.1;
      roots.push(new Complex(r * Math.cos(angle), r * Math.sin(angle)));
    }

    // Iterative refinement
    for (let iter = 0; iter < maxIter; iter++) {
      let maxDelta = 0;
      for (let i = 0; i < deg; i++) {
        const zi = roots[i];
        const pz = this.evalMonic(monic, zi);
        let denom = new Complex(1, 0);
        for (let j = 0; j < deg; j++) {
          if (i !== j) {
            denom = denom.mul(zi.sub(roots[j]));
          }
        }
        const delta = pz.div(denom);
        roots[i] = zi.sub(delta);
        maxDelta = Math.max(maxDelta, delta.abs());
      }
      if (maxDelta < tol) break;
    }

    // Clean, polish & pair complex conjugates
    return this.polishRoots(roots);
  }

  private evalMonic(monic: number[], s: Complex): Complex {
    let res = new Complex(0, 0);
    for (const c of monic) {
      res = res.mul(s).add(c);
    }
    return res;
  }

  private polishRoots(roots: Complex[]): Complex[] {
    const polished: Complex[] = [];
    const used = new Set<number>();

    for (let i = 0; i < roots.length; i++) {
      if (used.has(i)) continue;
      let r = roots[i];

      // If near real axis, zero out imaginary part
      if (Math.abs(r.im) < 1e-5) {
        polished.push(new Complex(r.re, 0));
        used.add(i);
        continue;
      }

      // Find if there is a complex conjugate pair
      let pairedIdx = -1;
      let bestDist = Infinity;
      for (let j = 0; j < roots.length; j++) {
        if (i !== j && !used.has(j)) {
          const dist = Math.hypot(roots[j].re - r.re, roots[j].im + r.im);
          if (dist < 1e-4 && dist < bestDist) {
            bestDist = dist;
            pairedIdx = j;
          }
        }
      }

      if (pairedIdx !== -1) {
        const avgRe = (r.re + roots[pairedIdx].re) / 2;
        const avgIm = (Math.abs(r.im) + Math.abs(roots[pairedIdx].im)) / 2;
        const posIm = r.im > 0 ? avgIm : -avgIm;
        polished.push(new Complex(avgRe, posIm));
        polished.push(new Complex(avgRe, -posIm));
        used.add(i);
        used.add(pairedIdx);
      } else {
        polished.push(r);
        used.add(i);
      }
    }

    // Sort roots: real parts descending, then imaginary parts descending
    return polished.sort((a, b) => {
      if (Math.abs(a.re - b.re) > 1e-6) return b.re - a.re;
      return b.im - a.im;
    });
  }

  groupPoleZeros(prefix: 'p' | 'z'): PoleZero[] {
    const rawRoots = this.findRoots();
    const result: PoleZero[] = [];
    const tol = 1e-4;

    for (const r of rawRoots) {
      const existing = result.find(
        (pz) => Math.abs(pz.re - r.re) < tol && Math.abs(pz.im - r.im) < tol
      );
      if (existing) {
        existing.multiplicity += 1;
      } else {
        result.push({
          id: `${prefix}_${result.length + 1}`,
          re: Math.abs(r.re) < 1e-9 ? 0 : r.re,
          im: Math.abs(r.im) < 1e-9 ? 0 : r.im,
          multiplicity: 1,
        });
      }
    }
    return result;
  }

  formatLatex(variable: string = 's', decimals: number = 3): string {
    const deg = this.degree;
    if (this.isZero()) return '0';

    const terms: string[] = [];
    for (let i = 0; i <= deg; i++) {
      const power = deg - i;
      const rawC = this.coeffs[i];
      if (Math.abs(rawC) < 1e-9) continue;

      const c = parseFloat(rawC.toFixed(decimals));
      const absC = Math.abs(c);
      const isPositive = c > 0;
      const sign = terms.length === 0 ? (isPositive ? '' : '-') : isPositive ? ' + ' : ' - ';

      let coeffStr = '';
      if (power === 0) {
        coeffStr = `${absC}`;
      } else if (absC === 1) {
        coeffStr = power === 1 ? variable : `${variable}^{${power}}`;
      } else {
        coeffStr = power === 1 ? `${absC}${variable}` : `${absC}${variable}^{${power}}`;
      }

      terms.push(`${sign}${coeffStr}`);
    }

    return terms.length > 0 ? terms.join('') : '0';
  }

  formatFactoredLatex(variable: string = 's', decimals: number = 3): string {
    const roots = this.findRoots();
    if (roots.length === 0) {
      return parseFloat(this.coeffs[0].toFixed(decimals)).toString();
    }

    const lead = parseFloat(this.coeffs[0].toFixed(decimals));
    let leadStr = lead === 1 ? '' : lead === -1 ? '-' : `${lead}`;

    const factors: string[] = [];
    const used = new Set<number>();

    for (let i = 0; i < roots.length; i++) {
      if (used.has(i)) continue;
      const r = roots[i];

      if (r.isReal()) {
        const rootVal = parseFloat((-r.re).toFixed(decimals));
        if (Math.abs(r.re) < 1e-6) {
          factors.push(variable);
        } else if (rootVal > 0) {
          factors.push(`(${variable} + ${rootVal})`);
        } else {
          factors.push(`(${variable} - ${Math.abs(rootVal)})`);
        }
        used.add(i);
      } else {
        // Find conjugate pair
        let pair = -1;
        for (let j = i + 1; j < roots.length; j++) {
          if (!used.has(j) && Math.abs(roots[j].re - r.re) < 1e-4 && Math.abs(roots[j].im + r.im) < 1e-4) {
            pair = j;
            break;
          }
        }
        if (pair !== -1) {
          const sigma = parseFloat((-2 * r.re).toFixed(decimals));
          const magSq = parseFloat((r.re * r.re + r.im * r.im).toFixed(decimals));
          const sTerm = sigma > 0 ? ` + ${sigma}${variable}` : sigma < 0 ? ` - ${Math.abs(sigma)}${variable}` : '';
          const cTerm = magSq >= 0 ? ` + ${magSq}` : ` - ${Math.abs(magSq)}`;
          factors.push(`(${variable}^2${sTerm}${cTerm})`);
          used.add(i);
          used.add(pair);
        } else {
          const reVal = parseFloat((-r.re).toFixed(decimals));
          const imVal = parseFloat(r.im.toFixed(decimals));
          factors.push(`(${variable} ${reVal >= 0 ? '+' : '-'} ${Math.abs(reVal)} ${imVal >= 0 ? '-' : '+'} ${Math.abs(imVal)}j)`);
          used.add(i);
        }
      }
    }

    // Group repeating identical factors
    const countMap = new Map<string, number>();
    for (const f of factors) {
      countMap.set(f, (countMap.get(f) || 0) + 1);
    }

    const grouped: string[] = [];
    countMap.forEach((count, expr) => {
      if (count > 1) {
        grouped.push(`${expr}^{${count}}`);
      } else {
        grouped.push(expr);
      }
    });

    return `${leadStr}${grouped.join('')}`;
  }

  private padLeft(len: number): number[] {
    const pad = new Array(len - this.coeffs.length).fill(0);
    return [...pad, ...this.coeffs];
  }
}
