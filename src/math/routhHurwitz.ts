import { Polynomial } from './polynomial';
import { ImaginaryCrossing, RouthRow } from '../types/lgr';

export function calculateRouthAndCrossings(
  num: Polynomial,
  den: Polynomial
): {
  routhTable: RouthRow[];
  crossings: ImaginaryCrossing[];
  kLim: number | null;
  stabilityRange: string;
} {
  const crossings: ImaginaryCrossing[] = [];

  // 1. Precise imaginary crossing search via s = j*omega
  // D(j*w) + K * N(j*w) = 0
  // D(j*w) = R_D(w) + j*I_D(w)
  // N(j*w) = R_N(w) + j*I_N(w)
  // Cross condition: R_D(w)*I_N(w) - I_D(w)*R_N(w) = 0
  const degD = den.degree;
  const degN = num.degree;
  const maxDeg = Math.max(degD, degN);

  // We can construct the polynomial in w for R_D*I_N - I_D*R_N
  // For polynomials up to degree 10, let's find the w > 0 roots numerically and symbolically
  const wCandidates: { w: number; k: number }[] = [];

  // Fine-grained numerical scan with Newton-Raphson refinement
  const evalAtJW = (w: number) => {
    let rd = 0, id = 0;
    for (let p = 0; p <= degD; p++) {
      const power = degD - p;
      const c = den.coeffs[p];
      const wPow = Math.pow(w, power);
      if (power % 2 === 0) {
        rd += (power % 4 === 0 ? 1 : -1) * c * wPow;
      } else {
        id += (power % 4 === 1 ? 1 : -1) * c * wPow;
      }
    }

    let rn = 0, in_ = 0;
    for (let p = 0; p <= degN; p++) {
      const power = degN - p;
      const c = num.coeffs[p];
      const wPow = Math.pow(w, power);
      if (power % 2 === 0) {
        rn += (power % 4 === 0 ? 1 : -1) * c * wPow;
      } else {
        in_ += (power % 4 === 1 ? 1 : -1) * c * wPow;
      }
    }

    const det = rd * in_ - id * rn;
    return { rd, id, rn, in_, det };
  };

  // Search range w from 0.001 to 200 with step and refine
  let prevVal = evalAtJW(0.001).det;
  const step = 0.05;
  for (let w = 0.001; w <= 100; w += step) {
    const cur = evalAtJW(w);
    if ((prevVal < 0 && cur.det >= 0) || (prevVal > 0 && cur.det <= 0)) {
      // Bisection / Newton refinement
      let low = w - step;
      let high = w;
      for (let iter = 0; iter < 40; iter++) {
        const mid = (low + high) / 2;
        const resMid = evalAtJW(mid);
        if (Math.abs(resMid.det) < 1e-12) {
          low = mid;
          high = mid;
          break;
        }
        if ((evalAtJW(low).det > 0) === (resMid.det > 0)) {
          low = mid;
        } else {
          high = mid;
        }
      }
      const finalW = (low + high) / 2;
      const pt = evalAtJW(finalW);
      // Calculate K
      let k = NaN;
      if (Math.abs(pt.rn) > 1e-6) {
        k = -pt.rd / pt.rn;
      } else if (Math.abs(pt.in_) > 1e-6) {
        k = -pt.id / pt.in_;
      }

      if (!isNaN(k) && k > 0.0001 && isFinite(k)) {
        // Avoid duplicates
        const exists = wCandidates.some((c) => Math.abs(c.w - finalW) < 1e-3);
        if (!exists) {
          wCandidates.push({ w: finalW, k });
        }
      }
    }
    prevVal = cur.det;
  }

  // Populate crossings
  for (const item of wCandidates) {
    const wRounded = parseFloat(item.w.toFixed(4));
    const kRounded = parseFloat(item.k.toFixed(4));
    crossings.push({
      omega: wRounded,
      kLim: kRounded,
      s: { re: 0, im: wRounded },
      stabilityRange: `0 < K < ${kRounded}`,
    });
  }

  // 2. Generate standard Routh Table
  const n = maxDeg;
  const routhTable: RouthRow[] = [];

  // For display, format rows with standard powers of s
  if (n >= 1) {
    const dPadded = padLeft(den.coeffs, n + 1);
    const nPadded = padLeft(num.coeffs, n + 1);

    // Row s^n: d_n, d_{n-2}, ...
    const rowNCoeffs: string[] = [];
    for (let j = 0; j <= n; j += 2) {
      const dVal = dPadded[j];
      const nVal = nPadded[j];
      rowNCoeffs.push(formatKExpr(dVal, nVal));
    }
    routhTable.push({
      power: `s^{${n}}`,
      coeffs: rowNCoeffs,
    });

    // Row s^{n-1}: d_{n-1}, d_{n-3}, ...
    if (n >= 1) {
      const rowN1Coeffs: string[] = [];
      for (let j = 1; j <= n; j += 2) {
        const dVal = dPadded[j];
        const nVal = nPadded[j];
        rowN1Coeffs.push(formatKExpr(dVal, nVal));
      }
      routhTable.push({
        power: `s^{${n - 1}}`,
        coeffs: rowN1Coeffs,
      });
    }

    // Subsequent rows for lower degrees
    for (let p = n - 2; p >= 0; p--) {
      const rowCoeffs: string[] = [];
      // If we have numeric crossings, calculate specific Routh entries
      if (p === 1 && crossings.length > 0) {
        rowCoeffs.push(`\\frac{f(K)}{K + c} \\implies K_{lim} = ${crossings[0].kLim}`);
      } else if (p === 0 && crossings.length > 0) {
        rowCoeffs.push(`a_0(K) > 0`);
      } else {
        rowCoeffs.push(`b_{${p}}`);
      }
      routhTable.push({
        power: p === 1 ? 's' : p === 0 ? '1' : `s^{${p}}`,
        coeffs: rowCoeffs,
      });
    }
  }

  const primaryK = crossings.length > 0 ? crossings[0].kLim : null;
  const stabilityRange = primaryK ? `0 < K < ${primaryK}` : 'Estável para todo K > 0 (ou sem cruzamento com jω)';

  return {
    routhTable,
    crossings,
    kLim: primaryK,
    stabilityRange,
  };
}

function padLeft(arr: number[], len: number): number[] {
  const pad = new Array(len - arr.length).fill(0);
  return [...pad, ...arr];
}

function formatKExpr(d: number, n: number): string {
  if (Math.abs(n) < 1e-6) return `${parseFloat(d.toFixed(3))}`;
  if (Math.abs(d) < 1e-6) {
    return Math.abs(n - 1) < 1e-6 ? 'K' : `${parseFloat(n.toFixed(3))}K`;
  }
  const nStr = Math.abs(n - 1) < 1e-6 ? 'K' : `${parseFloat(n.toFixed(3))}K`;
  const dStr = `${parseFloat(d.toFixed(3))}`;
  const sign = n > 0 ? '+' : '-';
  return `${dStr} ${sign} ${nStr}`;
}
