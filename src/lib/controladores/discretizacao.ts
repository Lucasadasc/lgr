import { multiplicarPolinomios, somarPolinomios } from "../lgr";
import {
  limparPolinomio,
  validarTf,
  raizesVerificadas,
  type FuncaoTransferencia,
  type ResultadoProjeto,
} from "./index";
export type MetodoDiscreto = "forward" | "backward" | "tustin";
export interface ConfiguracaoDiscreta {
  alvo: "Gc" | "malha";
  metodo: MetodoDiscreto;
  periodo: number;
}
export interface DiscretizacaoProjeto {
  configuracao: ConfiguracaoDiscreta;
  continua: FuncaoTransferencia;
  resultado: ResultadoDiscreto;
  polos: ReturnType<typeof raizesVerificadas>;
  estabilidade: "estavel" | "instavel" | "marginal";
}
export interface TermoSubstituicao {
  origem: 'N' | 'D'; coeficiente: number; potencia: number; potenciaComum: number; expandido: number[];
}
export interface MemoriaDiscretizacao {
  u: number[]; v: number[]; grauComum: number; termos: TermoSubstituicao[];
  numeradorBruto: number[]; denominadorBruto: number[]; lider: number;
}
export interface ResultadoDiscreto extends FuncaoTransferencia {
  metodo: MetodoDiscreto;
  periodo: number;
  causal: boolean;
  coefSaida: number[];
  coefEntrada: number[];
  avanco: number;
  memoria: MemoriaDiscretizacao;
}
const potencia = (a: number[], n: number) => {
  let r = [1];
  for (let i = 0; i < n; i++) r = multiplicarPolinomios(r, a);
  return r;
};
export function discretizar(
  tf: FuncaoTransferencia,
  periodo: number,
  metodo: MetodoDiscreto,
): ResultadoDiscreto {
  if (!["forward", "backward", "tustin"].includes(metodo))
    throw new Error("Escolha Euler forward, Euler backward ou Tustin.");
  if (!Number.isFinite(periodo) || periodo <= 0)
    throw new Error("O período de amostragem deve ser positivo e finito.");
  const { num, den } = validarTf(tf);
  const u =
    metodo === "tustin"
      ? [2 / periodo, -2 / periodo]
      : [1 / periodo, -1 / periodo];
  const v = metodo === "tustin" ? [1, 1] : metodo === "backward" ? [1, 0] : [1];
  const maximo = Math.max(num.length, den.length) - 1;
  const termos: TermoSubstituicao[] = [];
  const substituir = (p: number[], origem: 'N' | 'D') => {
    let soma = [0];
    p.forEach((c, i) => {
      const grau = p.length - 1 - i;
      const termo = multiplicarPolinomios(
        potencia(u, grau),
        potencia(v, maximo - grau),
      ).map((x) => x * c);
      termos.push({ origem, coeficiente: c, potencia: grau, potenciaComum: maximo - grau, expandido: termo });
      soma = somarPolinomios(soma, termo);
    });
    // Preserva termos pequenos: apagar um coeficiente não nulo pode mudar
    // o grau e declarar causal uma equação que requer amostras futuras.
    while (soma.length > 1 && soma[0] === 0) soma.shift();
    return limparPolinomio(soma);
  };
  const nz = substituir(num, 'N'),
    dz = substituir(den, 'D'),
    lider = dz[0];
  if (lider === 0)
    throw new Error("A substituição resultou em denominador nulo.");
  const n = nz.map((c) => c / lider),
    d = dz.map((c) => c / lider);
  if ([...n, ...d].some((c) => !Number.isFinite(c)))
    throw new Error("O período produziu coeficientes não finitos.");
  const avanco = Math.max(0, n.length - d.length);
  return {
    num: n,
    den: d,
    metodo,
    periodo,
    causal: avanco === 0,
    coefSaida: d,
    coefEntrada: [...new Array(Math.max(0, d.length - n.length)).fill(0), ...n],
    avanco,
    memoria: { u, v, grauComum: maximo, termos, numeradorBruto: nz, denominadorBruto: dz, lider },
  };
}

export function discretizarProjeto(
  r: ResultadoProjeto,
  c: ConfiguracaoDiscreta,
): DiscretizacaoProjeto {
  if (c.alvo !== "Gc" && c.alvo !== "malha")
    throw new Error(
      "Escolha o controlador ou a malha aberta completa para discretizar.",
    );
  const continua = c.alvo === "Gc" ? r.Gc : r.malha;
  const resultado = discretizar(continua, c.periodo, c.metodo);
  const polos = raizesVerificadas(resultado.den);
  const modulos = polos.map((p) => Math.hypot(p.re, p.im));
  return {
    configuracao: { ...c },
    continua,
    resultado,
    polos,
    estabilidade: modulos.some((m) => m > 1 + 1e-8)
      ? "instavel"
      : modulos.some((m) => m >= 1 - 1e-8)
        ? "marginal"
        : "estavel",
  };
}
