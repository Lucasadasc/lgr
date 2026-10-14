import { preencherZerosEsquerda } from "../lgr";
import {
  validarTf,
  raizesVerificadas,
  type FuncaoTransferencia,
} from "./index";
import type { Complex } from "../lgr";

export interface RespostaDegrau {
  status: "ok" | "instavel" | "marginal" | "impropria" | "falha";
  mensagem?: string;
  polos: Complex[];
  t: number[];
  y: number[];
  yss: number | null;
  y0: number | null;
  mp: number | null;
  ts2: number | null;
  ts5: number | null;
  horizonte: number;
}
// Dormand–Prince 5(4). Estados na forma canônica controlável; não usa
// decomposição em resíduos, que fica singular quando há polos repetidos.
const A = [
  [],
  [1 / 5],
  [3 / 40, 9 / 40],
  [44 / 45, -56 / 15, 32 / 9],
  [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
  [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
  [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
];
const B5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
const B4 = [
  5179 / 57600,
  0,
  7571 / 16695,
  393 / 640,
  -92097 / 339200,
  187 / 2100,
  1 / 40,
];

export function simularDegrau(
  tf: FuncaoTransferencia,
  horizonte?: number,
): RespostaDegrau {
  const { num, den } = validarTf(tf);
  const polos = raizesVerificadas(den);
  const partes = polos.map((p) => p.re);
  const estavel = partes.every((p) => p < -1e-9);
  const lento = estavel && polos.length ? -1 / Math.max(...partes) : 1;
  const fim = horizonte ?? Math.max(5, 20 * lento);
  if (!Number.isFinite(fim) || fim <= 0)
    throw new Error("O horizonte da simulação deve ser positivo e finito.");
  const vazio: RespostaDegrau = {
    status: "ok",
    polos,
    t: [],
    y: [],
    yss: null,
    y0: null,
    mp: null,
    ts2: null,
    ts5: null,
    horizonte: fim,
  };
  if (polos.some((p) => !Number.isFinite(p.re) || !Number.isFinite(p.im)))
    return {
      ...vazio,
      status: "falha",
      mensagem: "Não foi possível determinar a estabilidade da malha.",
    };
  if (!estavel)
    return {
      ...vazio,
      status: partes.some((p) => p > 1e-9) ? "instavel" : "marginal",
      mensagem:
        "A malha não é assintoticamente estável. Mp e acomodação não são definidos.",
    };
  if (num.length > den.length)
    return {
      ...vazio,
      status: "impropria",
      mensagem:
        "A malha fechada é imprópria. Sua resposta ao degrau contém impulsos e não pode ser mostrada como uma curva ordinária.",
    };
  const grau = den.length - 1,
    lider = den[0];
  const a = den.map((v) => v / lider),
    b = preencherZerosEsquerda(num, den.length).map((v) => v / lider);
  const direto = b[0];
  const C = Array.from(
    { length: grau },
    (_, i) => b[grau - i] - direto * a[grau - i],
  );
  const derivada = (x: number[]) =>
    x.map((_, i) =>
      i < grau - 1
        ? x[i + 1]
        : 1 - x.reduce((s, xi, j) => s + a[grau - j] * xi, 0),
    );
  const saida = (x: number[]) =>
    direto + C.reduce((s, ci, i) => s + ci * x[i], 0);
  let x = new Array<number>(grau).fill(0),
    tempo = 0;
  const quantidade = 4000,
    intervalo = fim / quantidade;
  let h = Math.min(
    intervalo,
    0.05 / Math.max(1, ...polos.map((p) => Math.hypot(p.re, p.im))),
  );
  const t = [0],
    y = [direto];
  let tentativas = 0;
  for (let amostra = 1; amostra <= quantidade; amostra++) {
    const alvo = (fim * amostra) / quantidade;
    while (tempo < alvo - Number.EPSILON * Math.max(1, alvo)) {
      if (++tentativas > 150000)
        return {
          ...vazio,
          status: "falha",
          mensagem:
            "A integração atingiu o limite de passos. Reduza o horizonte ou reveja os coeficientes.",
        };
      const passo = Math.min(h, alvo - tempo);
      if (passo < Number.EPSILON * Math.max(1, tempo))
        return {
          ...vazio,
          status: "falha",
          mensagem:
            "A integração perdeu precisão. Reveja a escala dos coeficientes.",
        };
      const k: number[][] = [];
      for (const linha of A) {
        const estado = x.map(
          (xi, i) => xi + passo * linha.reduce((s, c, j) => s + c * k[j][i], 0),
        );
        k.push(derivada(estado));
      }
      const novo = x.map(
        (xi, i) => xi + passo * B5.reduce((s, c, j) => s + c * k[j][i], 0),
      );
      const erro = Math.max(
        0,
        ...x.map(
          (xi, i) =>
            Math.abs(
              passo * B5.reduce((s, c, j) => s + (c - B4[j]) * k[j][i], 0),
            ) /
            (1e-10 + 1e-8 * Math.max(Math.abs(xi), Math.abs(novo[i]))),
        ),
      );
      if (!Number.isFinite(erro) || novo.some((v) => !Number.isFinite(v)))
        return {
          ...vazio,
          status: "falha",
          mensagem: "A integração produziu valores não finitos.",
        };
      if (erro <= 1) {
        x = novo;
        tempo += passo;
      }
      h =
        passo *
        Math.min(5, Math.max(0.2, erro === 0 ? 5 : 0.9 * Math.pow(erro, -0.2)));
    }
    t.push(alvo);
    y.push(saida(x));
  }
  const yss = b[grau] / a[grau];
  if (!Number.isFinite(yss) || y.some((v) => !Number.isFinite(v)))
    return {
      ...vazio,
      status: "falha",
      mensagem: "Não foi possível calcular uma resposta finita.",
    };
  const magnitude = Math.abs(yss);
  const acomodacao = (faixa: number): number | null => {
    if (magnitude < 1e-12) return null;
    let ultimo = -1;
    y.forEach((v, i) => {
      if (Math.abs(v - yss) > faixa * magnitude) ultimo = i;
    });
    if (ultimo === y.length - 1) return null;
    return ultimo < 0 ? 0 : t[ultimo + 1];
  };
  // Inclui y(0+), exposto separadamente. Um salto inicial acima do valor
  // final não pode ser escondido para declarar aprovação do limite de Mp.
  const mp =
    magnitude < 1e-12
      ? null
      : (Math.max(0, ...y.map((v) => Math.sign(yss) * (v - yss))) / magnitude) *
        100;
  return {
    ...vazio,
    t,
    y,
    yss,
    y0: direto,
    mp,
    ts2: acomodacao(0.02),
    ts5: acomodacao(0.05),
  };
}
