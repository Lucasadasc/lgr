import { ComplexNum } from '../types/lgr';

export class Complex {
  readonly re: number;
  readonly im: number;

  constructor(re: number = 0, im: number = 0) {
    this.re = Math.abs(re) < 1e-12 ? 0 : re;
    this.im = Math.abs(im) < 1e-12 ? 0 : im;
  }

  static from(c: ComplexNum | number): Complex {
    if (typeof c === 'number') return new Complex(c, 0);
    return new Complex(c.re, c.im);
  }

  add(other: Complex | number): Complex {
    const o = Complex.from(other);
    return new Complex(this.re + o.re, this.im + o.im);
  }

  sub(other: Complex | number): Complex {
    const o = Complex.from(other);
    return new Complex(this.re - o.re, this.im - o.im);
  }

  mul(other: Complex | number): Complex {
    const o = Complex.from(other);
    return new Complex(
      this.re * o.re - this.im * o.im,
      this.re * o.im + this.im * o.re
    );
  }

  div(other: Complex | number): Complex {
    const o = Complex.from(other);
    const denom = o.re * o.re + o.im * o.im;
    if (denom === 0) {
      return new Complex(Infinity, Infinity);
    }
    return new Complex(
      (this.re * o.re + this.im * o.im) / denom,
      (this.im * o.re - this.re * o.im) / denom
    );
  }

  abs(): number {
    return Math.hypot(this.re, this.im);
  }

  argRad(): number {
    return Math.atan2(this.im, this.re);
  }

  argDeg(): number {
    let deg = (Math.atan2(this.im, this.re) * 180) / Math.PI;
    if (deg < -1e-9) deg += 360;
    return Math.abs(deg) < 1e-9 ? 0 : deg;
  }

  argDegSigned(): number {
    const deg = (Math.atan2(this.im, this.re) * 180) / Math.PI;
    return Math.abs(deg) < 1e-9 ? 0 : deg;
  }

  conj(): Complex {
    return new Complex(this.re, -this.im);
  }

  sqrt(): Complex {
    const r = this.abs();
    const theta = this.argRad();
    return new Complex(
      Math.sqrt(r) * Math.cos(theta / 2),
      Math.sqrt(r) * Math.sin(theta / 2)
    );
  }

  pow(n: number): Complex {
    const r = Math.pow(this.abs(), n);
    const theta = this.argRad() * n;
    return new Complex(r * Math.cos(theta), r * Math.sin(theta));
  }

  isReal(tol: number = 1e-6): boolean {
    return Math.abs(this.im) < tol;
  }

  isZero(tol: number = 1e-6): boolean {
    return this.abs() < tol;
  }

  equals(other: Complex | ComplexNum, tol: number = 1e-6): boolean {
    return Math.abs(this.re - other.re) < tol && Math.abs(this.im - other.im) < tol;
  }

  toObject(): ComplexNum {
    return { re: this.re, im: this.im };
  }

  format(decimals: number = 4): string {
    const reStr = parseFloat(this.re.toFixed(decimals));
    const imStr = parseFloat(Math.abs(this.im).toFixed(decimals));

    if (Math.abs(this.im) < 1e-6) {
      return `${reStr}`;
    }
    if (Math.abs(this.re) < 1e-6) {
      return this.im < 0 ? `-${imStr}j` : `${imStr}j`;
    }
    const sign = this.im < 0 ? '-' : '+';
    return `${reStr} ${sign} ${imStr}j`;
  }

  formatLatex(decimals: number = 4): string {
    const reStr = parseFloat(this.re.toFixed(decimals));
    const imVal = parseFloat(Math.abs(this.im).toFixed(decimals));

    if (Math.abs(this.im) < 1e-6) {
      return `${reStr}`;
    }
    if (Math.abs(this.re) < 1e-6) {
      return this.im < 0 ? `-${imVal}j` : `${imVal}j`;
    }
    const sign = this.im < 0 ? '-' : '+';
    return `${reStr} ${sign} ${imVal}j`;
  }
}
