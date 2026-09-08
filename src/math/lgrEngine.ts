import { Complex } from './complex';
import { Polynomial } from './polynomial';
import { calculateRouthAndCrossings } from './routhHurwitz';
import {
  AsymptoteInfo,
  BreakawayPoint,
  DepartureAngle,
  ImaginaryCrossing,
  LgrSolution,
  LgrStepData,
  LgrTrajectoryPoint,
  PoleZero,
  RealSegment,
  RouthRow,
} from '../types/lgr';

export function solveLgr(openLoopNum: Polynomial, openLoopDen: Polynomial): LgrSolution {
  // 1. Poles and Zeros
  const rawPoles = openLoopDen.findRoots();
  const rawZeros = openLoopNum.findRoots();

  const poles: PoleZero[] = openLoopDen.groupPoleZeros('p');
  const zeros: PoleZero[] = openLoopNum.groupPoleZeros('z');

  const nP = rawPoles.length;
  const nZ = rawZeros.length;

  // 2. Real segments (Step 4)
  const realSegments = calculateRealSegments(rawPoles, rawZeros);

  // 3. Asymptotes (Step 7)
  const asymptotes = calculateAsymptotes(rawPoles, rawZeros, nP, nZ);

  // 4. Breakaway / Break-in points (Step 8)
  const { candidates: breakawayCandidates, valid: validBreakaways } = calculateBreakawayPoints(
    openLoopNum,
    openLoopDen,
    realSegments
  );

  // 5. Imaginary Crossings & Routh Table (Step 9)
  const { routhTable, crossings: imaginaryCrossings, stabilityRange } = calculateRouthAndCrossings(
    openLoopNum,
    openLoopDen
  );

  // 6. Departure & Arrival Angles (Step 10)
  const departureAngles = calculateDepartureAngles(rawPoles, rawZeros, true);
  const arrivalAngles = calculateDepartureAngles(rawZeros, rawPoles, false);

  // 7. Full Root Locus Trajectories
  const { trajectories, maxRecommendedGain } = generateLgrTrajectories(
    openLoopNum,
    openLoopDen,
    rawPoles,
    rawZeros
  );

  // 8. Generate 10 Structured Steps
  const steps: LgrStepData[] = [
    buildStep1(openLoopNum, openLoopDen),
    buildStep2(openLoopNum, openLoopDen, poles, zeros, nP, nZ),
    buildStep3(poles, zeros, nP, nZ),
    buildStep4(realSegments),
    buildStep5(nP, nZ),
    buildStep6(),
    buildStep7(asymptotes, nP, nZ),
    buildStep8(openLoopNum, openLoopDen, breakawayCandidates, validBreakaways),
    buildStep9(routhTable, imaginaryCrossings, stabilityRange),
    buildStep10(departureAngles, arrivalAngles),
  ];

  return {
    openLoopNum: openLoopNum.coeffs,
    openLoopDen: openLoopDen.coeffs,
    nP,
    nZ,
    poles,
    zeros,
    realSegments,
    asymptotes,
    breakawayCandidates,
    validBreakaways,
    imaginaryCrossings,
    routhTable,
    departureAngles,
    arrivalAngles,
    steps,
    trajectories,
    maxRecommendedGain,
  };
}

/**
 * Step 4: Real Axis Segments calculation
 */
function calculateRealSegments(poles: Complex[], zeros: Complex[]): RealSegment[] {
  // Collect all real poles and zeros
  const realPoles = poles.filter((p) => p.isReal()).map((p) => p.re);
  const realZeros = zeros.filter((z) => z.isReal()).map((z) => z.re);

  // All critical points on real axis, sorted in descending order
  const allPoints = [...realPoles, ...realZeros].sort((a, b) => b - a);

  // Deduplicate points for segment bounds
  const uniqueDescending: number[] = [];
  for (const pt of allPoints) {
    if (uniqueDescending.length === 0 || Math.abs(uniqueDescending[uniqueDescending.length - 1] - pt) > 1e-4) {
      uniqueDescending.push(pt);
    }
  }

  const segments: RealSegment[] = [];

  // For any interval (unique[i+1], unique[i]), count how many real poles+zeros lie strictly to the right (> midpoint)
  for (let i = 0; i < uniqueDescending.length; i++) {
    const right = uniqueDescending[i];
    const left = i + 1 < uniqueDescending.length ? uniqueDescending[i + 1] : -Infinity;
    const mid = isFinite(left) ? (left + right) / 2 : right - 1;

    // Count real poles + zeros > mid
    const countToRight = allPoints.filter((pt) => pt > mid).length;

    if (countToRight % 2 === 1) {
      segments.push({
        start: isFinite(left) ? parseFloat(left.toFixed(4)) : -Infinity,
        end: parseFloat(right.toFixed(4)),
        inclusiveStart: isFinite(left),
        inclusiveEnd: true,
        explanation: `Intervalo à esquerda de ${countToRight} elemento(s) real(is) (ímpar) -> Pertence ao LGR`,
      });
    }
  }

  return segments;
}

/**
 * Step 7: Asymptotes calculation
 */
function calculateAsymptotes(
  poles: Complex[],
  zeros: Complex[],
  nP: number,
  nZ: number
): AsymptoteInfo {
  const numAsymptotes = nP - nZ;
  if (numAsymptotes <= 0) {
    return {
      numAsymptotes: 0,
      sigmaA: 0,
      sigmaFormula: 'n_P - n_Z \\le 0 \\implies \\text{Sem assíntotas (todos os ramos vão para zeros finitos)}',
      anglesDeg: [],
      anglesRad: [],
      anglesFormula: [],
    };
  }

  const sumPolesRe = poles.reduce((acc, p) => acc + p.re, 0);
  const sumZerosRe = zeros.reduce((acc, z) => acc + z.re, 0);
  const sigmaA = (sumPolesRe - sumZerosRe) / numAsymptotes;
  const sigmaARounded = parseFloat(sigmaA.toFixed(4));

  const anglesDeg: number[] = [];
  const anglesRad: number[] = [];
  const anglesFormula: string[] = [];

  for (let q = 0; q < numAsymptotes; q++) {
    const deg = ((2 * q + 1) * 180) / numAsymptotes;
    const normalized = Math.abs(deg % 360);
    anglesDeg.push(parseFloat(normalized.toFixed(2)));
    anglesRad.push((normalized * Math.PI) / 180);
    anglesFormula.push(`\\phi_{A,${q}} = \\frac{2(${q}) + 1}{${numAsymptotes}} \\times 180^\\circ = ${parseFloat(normalized.toFixed(2))}^\\circ`);
  }

  const sigmaFormula = `\\sigma_A = \\frac{\\sum \\text{Re}(pólos) - \\sum \\text{Re}(zeros)}{n_P - n_Z} = \\frac{(${sumPolesRe.toFixed(2)}) - (${sumZerosRe.toFixed(2)})}{${numAsymptotes}} = ${sigmaARounded}`;

  return {
    numAsymptotes,
    sigmaA: sigmaARounded,
    sigmaFormula,
    anglesDeg,
    anglesRad,
    anglesFormula,
  };
}

/**
 * Step 8: Breakaway / Break-in Points
 */
function calculateBreakawayPoints(
  num: Polynomial,
  den: Polynomial,
  realSegments: RealSegment[]
): { candidates: BreakawayPoint[]; valid: BreakawayPoint[] } {
  // K(s) = -D(s) / N(s)
  // dK/ds = 0 -> D'(s)*N(s) - D(s)*N'(s) = 0
  const dDen = den.derivative();
  const dNum = num.derivative();

  const dDen_Num = dDen.mul(num);
  const den_dNum = den.mul(dNum);
  const derivPoly = dDen_Num.sub(den_dNum);

  const roots = derivPoly.findRoots();
  const candidates: BreakawayPoint[] = [];

  for (const r of roots) {
    // Evaluate K at s = r
    // K = - den(s) / num(s)
    const denVal = den.eval(r);
    const numVal = num.eval(r);
    const kComplex = denVal.div(numVal).mul(-1);

    if (r.isReal()) {
      const realS = r.re;
      const kVal = kComplex.re;

      // Check if realS lies in any real segment
      const inSegment = realSegments.some((seg) => {
        const afterStart = seg.start === -Infinity ? true : realS >= seg.start - 1e-4;
        const beforeEnd = realS <= seg.end + 1e-4;
        return afterStart && beforeEnd;
      });

      const isValid = inSegment && kVal >= -1e-6;
      let type: BreakawayPoint['type'] = 'invalid';
      let reason = '';

      if (isValid) {
        // Second derivative test to distinguish breakaway vs break-in
        const delta = 1e-3;
        const kLeft = -den.eval(realS - delta).re / num.eval(realS - delta).re;
        const kRight = -den.eval(realS + delta).re / num.eval(realS + delta).re;
        const d2K = (kLeft - 2 * kVal + kRight) / (delta * delta);

        type = d2K < 0 ? 'breakaway' : 'breakin';
        reason = `${type === 'breakaway' ? 'Ponto de Saída' : 'Ponto de Entrada'} no eixo real (K = ${kVal.toFixed(4)} >= 0 e pertence ao LGR)`;
      } else if (!inSegment) {
        reason = `Descartado: não pertence a nenhum segmento do LGR no eixo real`;
      } else {
        reason = `Descartado: ganho K = ${kVal.toFixed(4)} < 0 (inválido para K > 0)`;
      }

      candidates.push({
        s: { re: parseFloat(realS.toFixed(4)), im: 0 },
        k: parseFloat(kVal.toFixed(4)),
        isValid,
        type,
        reason,
      });
    } else {
      // Complex saddle point
      candidates.push({
        s: { re: parseFloat(r.re.toFixed(4)), im: parseFloat(r.im.toFixed(4)) },
        k: parseFloat(kComplex.re.toFixed(4)),
        isValid: false,
        type: 'complex',
        reason: 'Raiz complexa da derivada (fora do eixo real)',
      });
    }
  }

  const valid = candidates.filter((c) => c.isValid);
  return { candidates, valid };
}

/**
 * Step 10: Departure / Arrival Angles for complex poles / zeros
 */
function calculateDepartureAngles(
  targets: Complex[],
  others: Complex[],
  isPole: boolean
): DepartureAngle[] {
  const angles: DepartureAngle[] = [];

  for (let i = 0; i < targets.length; i++) {
    const pt = targets[i];
    if (pt.isReal() || pt.im <= 0) continue; // Only calculate for positive imaginary part of complex pair

    const vectors: DepartureAngle['vectors'] = [];
    let sumOtherTargets = 0;
    let sumOthers = 0;

    // From other targets (poles if calculating pole departure)
    for (let j = 0; j < targets.length; j++) {
      if (i !== j) {
        const diff = pt.sub(targets[j]);
        const ang = diff.argDeg();
        sumOtherTargets += ang;
        vectors.push({
          from: targets[j].toObject(),
          isPole,
          angleDeg: parseFloat(ang.toFixed(2)),
          distance: parseFloat(diff.abs().toFixed(3)),
        });
      }
    }

    // From others (zeros if calculating pole departure)
    for (let j = 0; j < others.length; j++) {
      const diff = pt.sub(others[j]);
      const ang = diff.argDeg();
      sumOthers += ang;
      vectors.push({
        from: others[j].toObject(),
        isPole: !isPole,
        angleDeg: parseFloat(ang.toFixed(2)),
        distance: parseFloat(diff.abs().toFixed(3)),
      });
    }

    // Formula: theta_p = 180 - sum(poles) + sum(zeros)
    let finalAngle = isPole
      ? 180 - sumOtherTargets + sumOthers
      : 180 - sumOtherTargets + sumOthers;

    finalAngle = ((finalAngle % 360) + 360) % 360;
    const finalAngleRounded = parseFloat(finalAngle.toFixed(2));

    const formula = isPole
      ? `\\theta_{partida} = 180^\\circ - \\sum \\theta_i + \\sum \\phi_j = 180^\\circ - (${sumOtherTargets.toFixed(1)}^\\circ) + (${sumOthers.toFixed(1)}^\\circ) = ${finalAngleRounded}^\\circ`
      : `\\phi_{chegada} = 180^\\circ - \\sum \\phi_j + \\sum \\theta_i = 180^\\circ - (${sumOtherTargets.toFixed(1)}^\\circ) + (${sumOthers.toFixed(1)}^\\circ) = ${finalAngleRounded}^\\circ`;

    angles.push({
      point: pt.toObject(),
      isPole,
      angleDeg: finalAngleRounded,
      angleRad: (finalAngleRounded * Math.PI) / 180,
      vectors,
      formula,
    });
  }

  return angles;
}

/**
 * Generate full Root Locus Trajectories with root continuation
 */
function generateLgrTrajectories(
  num: Polynomial,
  den: Polynomial,
  poles: Complex[],
  zeros: Complex[]
): { trajectories: LgrTrajectoryPoint[][]; maxRecommendedGain: number } {
  const nP = poles.length;
  if (nP === 0) return { trajectories: [], maxRecommendedGain: 100 };

  // Calculate automatic gain span
  let maxK = 100;
  const allPoints = [...poles, ...zeros];
  const maxSpan = allPoints.reduce((acc, p) => Math.max(acc, p.abs()), 1);
  maxK = Math.max(100, Math.pow(maxSpan, 2) * 15);

  // Adaptive logarithmic/polynomial gain distribution
  const numSteps = 450;
  const kValues: number[] = [0];
  for (let i = 1; i <= numSteps; i++) {
    const t = i / numSteps;
    // Cubic scaling for high resolution near poles and large sweep for asymptotes
    const k = Math.pow(t, 2.8) * maxK;
    kValues.push(k);
  }

  const branches: LgrTrajectoryPoint[][] = Array.from({ length: nP }, () => []);

  // Initialize branches at K = 0 (the open loop poles)
  let prevRoots = [...poles];
  for (let b = 0; b < nP; b++) {
    branches[b].push({
      re: poles[b].re,
      im: poles[b].im,
      k: 0,
      branchIndex: b,
    });
  }

  // Trace roots for each K
  for (let i = 1; i < kValues.length; i++) {
    const k = kValues[i];
    const polyK = den.add(num.mul(k));
    const currentRoots = polyK.findRoots();

    if (currentRoots.length < nP) continue;

    // Minimum weight Hungarian-like nearest neighbor matching to keep branches continuous
    const matched = matchRootsContinuity(prevRoots, currentRoots);

    for (let b = 0; b < nP; b++) {
      const root = matched[b];
      branches[b].push({
        re: parseFloat(root.re.toFixed(4)),
        im: parseFloat(root.im.toFixed(4)),
        k: parseFloat(k.toFixed(4)),
        branchIndex: b,
      });
    }
    prevRoots = matched;
  }

  return { trajectories: branches, maxRecommendedGain: maxK };
}

function matchRootsContinuity(prev: Complex[], current: Complex[]): Complex[] {
  const n = prev.length;
  const matched: Complex[] = new Array(n);
  const used = new Set<number>();

  for (let i = 0; i < n; i++) {
    let bestIdx = -1;
    let minDist = Infinity;
    for (let j = 0; j < current.length; j++) {
      if (!used.has(j)) {
        const dist = Math.hypot(current[j].re - prev[i].re, current[j].im - prev[i].im);
        if (dist < minDist) {
          minDist = dist;
          bestIdx = j;
        }
      }
    }
    if (bestIdx !== -1) {
      matched[i] = current[bestIdx];
      used.add(bestIdx);
    } else {
      matched[i] = prev[i];
    }
  }

  return matched;
}

// ----------------------------------------------------------------------------
// Step Builders (Matching DCA/UFRN Section 2.2)
// ----------------------------------------------------------------------------

function buildStep1(num: Polynomial, den: Polynomial): LgrStepData {
  const gNumStr = num.formatLatex('s');
  const gDenStr = den.formatLatex('s');

  return {
    stepNumber: 1,
    title: 'Escrever o Polinômio Característico',
    subtitle: 'Formulação da equação característica na forma padrão',
    summary: 'Colocar a equação de malha fechada na forma 1 + K P(s) = 0.',
    latexFormulas: [
      '1 + G(s)H(s) = 1 + K P(s) = 0',
      `P(s) = \\frac{N(s)}{D(s)} = \\frac{${gNumStr}}{${gDenStr}}`,
      `1 + K \\frac{${gNumStr}}{${gDenStr}} = 0`,
    ],
    explanation:
      'Os pólos de malha fechada são as raízes da equação 1 + G(s)H(s) = 0. Isolamos o ganho de interesse K de modo que a equação característica assuma a forma canônica 1 + K·P(s) = 0.',
    hasChart: false,
    details: { gNumStr, gDenStr },
  };
}

function buildStep2(
  num: Polynomial,
  den: Polynomial,
  poles: PoleZero[],
  zeros: PoleZero[],
  nP: number,
  nZ: number
): LgrStepData {
  const factoredNum = num.formatFactoredLatex('s');
  const factoredDen = den.formatFactoredLatex('s');

  const polesList = poles.map((p) => {
    const c = new Complex(p.re, p.im);
    return `s = ${c.format()}${p.multiplicity > 1 ? ` (multiplicidade ${p.multiplicity})` : ''}`;
  });

  const zerosList = zeros.length > 0
    ? zeros.map((z) => {
        const c = new Complex(z.re, z.im);
        return `s = ${c.format()}${z.multiplicity > 1 ? ` (multiplicidade ${z.multiplicity})` : ''}`;
      })
    : ['Nenhum zero finito (zeros no infinito)'];

  return {
    stepNumber: 2,
    title: 'Fatorar o Polinômio P(s) em Pólos e Zeros',
    subtitle: 'Determinação das raízes do numerador e denominador',
    summary: `Identificados ${nP} pólos (n_P = ${nP}) e ${nZ} zeros (n_Z = ${nZ}) de malha aberta.`,
    latexFormulas: [
      `1 + K \\frac{\\prod_{j=1}^{n_Z} (s + z_j)}{\\prod_{i=1}^{n_P} (s + p_i)} = 1 + K \\frac{${factoredNum}}{${factoredDen}} = 0`,
      `n_P = ${nP}, \\quad n_Z = ${nZ}`,
    ],
    explanation:
      'Fatoramos o polinômio P(s) em termos de seus pólos e zeros de malha aberta. O grau do denominador define nP e o grau do numerador define nZ.',
    hasChart: false,
    details: { polesList, zerosList, nP, nZ },
  };
}

function buildStep3(poles: PoleZero[], zeros: PoleZero[], nP: number, nZ: number): LgrStepData {
  return {
    stepNumber: 3,
    title: 'Assinalar Pólos e Zeros no Plano s',
    subtitle: 'Localização dos pontos de partida e término do LGR',
    summary: 'Os pólos (×) marcam o início do LGR (K = 0) e os zeros (○) marcam o término (K → ∞).',
    latexFormulas: [
      '\\text{Pólos (\\mathbf{\\times})}: K = 0 \\quad \\text{e} \\quad \\text{Zeros (\\mathbf{\\circ})}: K \\to \\infty',
    ],
    explanation:
      'Traçamos no plano complexo s = σ + jω os pólos de malha aberta com o símbolo × (vermelho) e os zeros de malha aberta com o símbolo ○ (azul). Cada ramo do LGR deve iniciar em um pólo em K=0 e convergir para um zero (finito ou no infinito) quando K cresce.',
    hasChart: true,
    chartHighlights: { poles: true, zeros: true },
    details: { poles, zeros, nP, nZ },
  };
}

function buildStep4(realSegments: RealSegment[]): LgrStepData {
  const segmentsFormatted = realSegments.length > 0
    ? realSegments.map(
        (seg) =>
          `[${isFinite(seg.start) ? seg.start : '-\\infty'}, ${seg.end}]`
      ).join(' \\cup ')
    : '\\emptyset \\text{ (Nenhum segmento no eixo real)}';

  return {
    stepNumber: 4,
    title: 'Segmentos do Eixo Real Pertencentes ao LGR',
    subtitle: 'Aplicação da regra do número ímpar de pólos e zeros reais',
    summary: `O LGR existe nos segmentos do eixo real situados à esquerda de uma quantidade ímpar de pólos e zeros reais: ${segmentsFormatted}.`,
    latexFormulas: [
      `s \\in ${segmentsFormatted}`,
    ],
    explanation:
      'Para qualquer ponto de teste sobre o eixo real, apenas os pólos e zeros reais situados à sua direita contribuem com 180° cada para o critério de fase. Portanto, o LGR existe no eixo real nos intervalos situados à esquerda de um número ímpar de pólos e zeros reais.',
    hasChart: true,
    chartHighlights: { poles: true, zeros: true, realSegments: true },
    details: { realSegments },
  };
}

function buildStep5(nP: number, nZ: number): LgrStepData {
  const ls = Math.max(nP, nZ);
  return {
    stepNumber: 5,
    title: 'Número de Ramos / Lugares Separados (LS)',
    subtitle: 'Definição da quantidade de ramos contínuos do LGR',
    summary: `O número de ramos separados é LS = n_P = ${ls}.`,
    latexFormulas: [`LS = n_P = ${ls} \\quad (\\text{para } n_P \\ge n_Z)`],
    explanation:
      'Cada pólo de malha fechada descreve uma curva contínua à medida que K varia de 0 a +∞. O número total de ramos independentes do LGR é igual ao número de pólos de malha aberta nP (quando nP ≥ nZ).',
    hasChart: false,
    details: { ls, nP, nZ },
  };
}

function buildStep6(): LgrStepData {
  return {
    stepNumber: 6,
    title: 'Simetria em Relação ao Eixo Real',
    subtitle: 'Propriedade reflexiva do plano complexo',
    summary: 'O diagrama do LGR é estritamente simétrico em relação ao eixo horizontal (eixo real σ).',
    latexFormulas: ['P(s) \\text{ com coeficientes reais} \\implies s_k = \\sigma \\pm j\\omega'],
    explanation:
      'Como os coeficientes da equação característica são números reais, quaisquer raízes complexas devem obrigatoriamente surgir em pares conjugados. Dessa forma, todo o LGR é perfeitamente espelhado em torno do eixo real σ.',
    hasChart: false,
    details: {},
  };
}

function buildStep7(
  asymptotes: AsymptoteInfo,
  nP: number,
  nZ: number
): LgrStepData {
  const anglesStr = asymptotes.anglesDeg.length > 0
    ? asymptotes.anglesDeg.map((a) => `${a}^\\circ`).join(', ')
    : 'Nenhum';

  return {
    stepNumber: 7,
    title: 'Assíntotas para Zeros no Infinito',
    subtitle: 'Cálculo do centro de gravidade σ_A e ângulos das assíntotas ϕ_A',
    summary: `${asymptotes.numAsymptotes} ramos convergem para zeros no infinito ao longo de assíntotas centradas em σ_A = ${asymptotes.sigmaA} com ângulos ${anglesStr}.`,
    latexFormulas: [
      asymptotes.sigmaFormula,
      ...asymptotes.anglesFormula,
    ],
    explanation:
      'Quando nP > nZ, existem (nP - nZ) ramos que não terminam em zeros finitos e prosseguem em direção ao infinito ao longo de linhas retas chamadas assíntotas, que se cruzam no ponto σ_A do eixo real.',
    hasChart: true,
    chartHighlights: { poles: true, zeros: true, realSegments: true, asymptotes: true },
    details: { asymptotes, nP, nZ },
  };
}

function buildStep8(
  num: Polynomial,
  den: Polynomial,
  candidates: BreakawayPoint[],
  valid: BreakawayPoint[]
): LgrStepData {
  const dDen = den.derivative();
  const dNum = num.derivative();
  const derivPoly = dDen.mul(num).sub(den.mul(dNum));
  const derivStr = derivPoly.formatLatex('s');

  const validStr = valid.length > 0
    ? valid.map((v) => `s = ${v.s.re} \\quad (K = ${v.k})`).join('; ')
    : '\\text{Não há pontos de saída/entrada válidos}';

  return {
    stepNumber: 8,
    title: 'Pontos de Saída e Entrada no Eixo Real',
    subtitle: 'Determinação dos pontos onde os ramos saem ou entram no eixo real',
    summary: valid.length > 0
      ? `Pontos válidos encontrados: ${validStr}.`
      : 'Não existem pontos de saída/entrada no eixo real para este sistema.',
    latexFormulas: [
      'K = -\\frac{D(s)}{N(s)} \\implies \\frac{dK}{ds} = -\\frac{D\'(s)N(s) - D(s)N\'(s)}{N(s)^2} = 0',
      `D'(s)N(s) - D(s)N'(s) = ${derivStr} = 0`,
      `\\text{Pontos Válidos}: ${validStr}`,
    ],
    explanation:
      'Os pontos de saída (breakaway) e entrada (break-in) ocorrem quando dois ou mais ramos colidem no eixo real e passam para o plano complexo (ou vice-versa). Encontramos as raízes de dK/ds = 0 e verificamos se pertencem aos segmentos do LGR no eixo real e possuem ganho K ≥ 0.',
    hasChart: false,
    details: { candidates, valid },
  };
}

function buildStep9(
  routhTable: RouthRow[],
  crossings: ImaginaryCrossing[],
  stabilityRange: string
): LgrStepData {
  const crossingsStr = crossings.length > 0
    ? crossings.map((c) => `s = \\pm ${c.omega}j \\quad \\text{em } K_{lim} = ${c.kLim}`).join(', ')
    : '\\text{Não há cruzamento com o eixo imaginário para } K > 0';

  return {
    stepNumber: 9,
    title: 'Cruzamento com o Eixo Imaginário (jω)',
    subtitle: 'Determinação do ganho crítico K_lim e frequência de oscilação marginal',
    summary: crossings.length > 0
      ? `Cruzamento em ${crossingsStr}. Faixa de estabilidade: ${stabilityRange}.`
      : `O sistema permanece estável/sem cruzar jω para K > 0 (${stabilityRange}).`,
    latexFormulas: [
      '1 + K P(s) = 0 \\implies D(s) + K N(s) = 0',
      `\\text{Cruzamento } j\\omega: ${crossingsStr}`,
      `\\text{Faixa de Estabilidade}: ${stabilityRange}`,
    ],
    explanation:
      'Utilizamos o Critério de Routh-Hurwitz (ou substituímos s = jω na equação característica) para encontrar os ganhos K_lim nos quais as raízes cruzam o eixo imaginário jω, marcando a fronteira de estabilidade do sistema.',
    hasChart: true,
    chartHighlights: {
      poles: true,
      zeros: true,
      realSegments: true,
      asymptotes: true,
      imaginaryCrossings: true,
    },
    details: { routhTable, crossings, stabilityRange },
  };
}

function buildStep10(
  departureAngles: DepartureAngle[],
  arrivalAngles: DepartureAngle[]
): LgrStepData {
  const departureLatex = departureAngles.length > 0
    ? departureAngles.map((d) => d.formula)
    : ['\\text{Sem pólos complexos conjugados}'];

  const arrivalLatex = arrivalAngles.length > 0
    ? arrivalAngles.map((a) => a.formula)
    : ['\\text{Sem zeros complexos conjugados}'];

  return {
    stepNumber: 10,
    title: 'Ângulos de Partida/Chegada e Traçado Completo',
    subtitle: 'Determinação dos vetores angulares e curvas completas do LGR',
    summary: 'Cálculo dos ângulos de partida (θ_partida) para pólos complexos e ângulos de chegada (ϕ_chegada) para zeros complexos, com visualização de todo o LGR.',
    latexFormulas: [
      '\\theta_{partida} = 180^\\circ - \\sum \\theta_i + \\sum \\phi_j',
      '\\phi_{chegada} = 180^\\circ - \\sum \\phi_j + \\sum \\theta_i',
      ...departureLatex,
      ...arrivalLatex,
    ],
    explanation:
      'Para pólos e zeros complexos, o LGR parte ou chega em ângulos tangentes específicos determinados pela soma vetorial de todos os demais pólos e zeros do sistema até o ponto complexo.',
    hasChart: true,
    chartHighlights: {
      poles: true,
      zeros: true,
      realSegments: true,
      asymptotes: true,
      imaginaryCrossings: true,
      departureAngles: true,
      fullLocus: true,
    },
    details: { departureAngles, arrivalAngles },
  };
}
