export interface ComplexNum {
  re: number;
  im: number;
}

export interface PoleZero {
  id: string;
  re: number;
  im: number;
  multiplicity: number;
}

export interface RealSegment {
  start: number; // can be -Infinity
  end: number;   // can be Infinity
  inclusiveStart: boolean;
  inclusiveEnd: boolean;
  explanation: string;
}

export interface AsymptoteInfo {
  numAsymptotes: number;
  sigmaA: number;
  sigmaFormula: string;
  anglesDeg: number[];
  anglesRad: number[];
  anglesFormula: string[];
}

export interface BreakawayPoint {
  s: ComplexNum;
  k: number;
  isValid: boolean;
  type: 'breakaway' | 'breakin' | 'complex' | 'invalid';
  reason: string;
}

export interface ImaginaryCrossing {
  omega: number; // point is +- j*omega
  kLim: number;
  s: ComplexNum;
  stabilityRange: string;
}

export interface DepartureAngle {
  point: ComplexNum;
  isPole: boolean;
  angleDeg: number;
  angleRad: number;
  vectors: {
    from: ComplexNum;
    isPole: boolean;
    angleDeg: number;
    distance: number;
  }[];
  formula: string;
}

export interface RouthRow {
  power: string;
  coeffs: (number | string)[];
  kExprs?: string[];
}

export interface LgrStepData {
  stepNumber: number;
  title: string;
  subtitle: string;
  summary: string;
  latexFormulas: string[];
  explanation: string;
  hasChart: boolean;
  chartHighlights?: {
    poles?: boolean;
    zeros?: boolean;
    realSegments?: boolean;
    asymptotes?: boolean;
    breakaway?: boolean;
    imaginaryCrossings?: boolean;
    departureAngles?: boolean;
    fullLocus?: boolean;
  };
  details: Record<string, any>;
}

export interface LgrTrajectoryPoint {
  re: number;
  im: number;
  k: number;
  branchIndex: number;
}

export interface LgrSolution {
  openLoopNum: number[]; // e.g. [1, 2] for s + 2
  openLoopDen: number[]; // e.g. [1, 4, 0] for s^2 + 4s
  nP: number;
  nZ: number;
  poles: PoleZero[];
  zeros: PoleZero[];
  realSegments: RealSegment[];
  asymptotes: AsymptoteInfo;
  breakawayCandidates: BreakawayPoint[];
  validBreakaways: BreakawayPoint[];
  imaginaryCrossings: ImaginaryCrossing[];
  routhTable: RouthRow[];
  departureAngles: DepartureAngle[];
  arrivalAngles: DepartureAngle[];
  steps: LgrStepData[];
  trajectories: LgrTrajectoryPoint[][]; // array of branches, each branch is an array of points
  maxRecommendedGain: number;
}

export type InputMode = 'poly' | 'factored' | 'expr';

export interface TransferFunctionInput {
  gNum: string;
  gDen: string;
  hNum: string;
  hDen: string;
  gZeros?: string;
  gPoles?: string;
  gGain?: string;
  hZeros?: string;
  hPoles?: string;
  hGain?: string;
  exprG?: string;
  exprH?: string;
}

export interface PresetItem {
  id: string;
  category: 'exemplo' | 'exercicio' | 'tipica';
  name: string;
  description: string;
  gNum: string;
  gDen: string;
  hNum: string;
  hDen: string;
  kDefault?: number;
  testPoint?: { re: number; im: number };
}
