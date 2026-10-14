import { resolverPersonalizado, type ConfiguracaoPersonalizada, type ResultadoPersonalizado } from "./personalizado";
import {
  anguloEmGraus,
  avaliarPolinomioComplexo,
  dividirComplexos,
  encontrarRaizes,
  moduloComplexo,
  multiplicarPolinomios,
  somarPolinomios,
} from "../lgr";
import type { Complex } from "../lgr";

export interface FuncaoTransferencia {
  num: number[];
  den: number[];
}
export type TopologiaClassica = "PD" | "PI" | "PID";
export type Topologia = TopologiaClassica | "primeiraOrdem" | "personalizado";
export type Especificacao =
  | { modo: "mpTs"; mp: number; ts: number; faixa: 2 | 5; margem: number }
  | { modo: "zetaWn"; zeta: number; wn: number }
  | { modo: "polo"; re: number; im: number };
export interface EntradaProjeto<T extends Topologia = Topologia> {
  G: FuncaoTransferencia;
  H: FuncaoTransferencia;
  topologia: T;
  especificacao: Especificacao;
  personalizado?: ConfiguracaoPersonalizada;
}
export interface ParcelaGeometria {
  tipo: "polo" | "zero";
  raiz: Complex;
  vetor: Complex;
  angulo: number;
  distancia: number;
}
export interface ResultadoProjetoBase {
  entrada: EntradaProjeto;
  sd: Complex;
  zeta: number;
  wn: number;
  wnMin?: number;
  Kc: number;
  GH: FuncaoTransferencia;
  Gc: FuncaoTransferencia;
  estrutura: FuncaoTransferencia;
  malha: FuncaoTransferencia;
  fechada: FuncaoTransferencia;
  faseGH: number;
  moduloGH: number;
  parcelas: ParcelaGeometria[];
  faseGanho: number;
  polos: Complex[];
  erroPolo: number;
  residuo: number;
  erroAngulo: number;
  erroModulo: number;
  avisos: string[];
}

export interface ResultadoClassico extends ResultadoProjetoBase {
  tipo: "classico";
  entrada: EntradaProjeto<TopologiaClassica>;
  z: number;
  Kp: number;
  Ki: number;
  Kd: number;
  alfa: number;
  faseIntegral: number;
}
export interface ResultadoPrimeiraOrdem extends ResultadoProjetoBase {
  tipo: "primeiraOrdem";
  entrada: EntradaProjeto<"primeiraOrdem">;
  a: number;
  b: number;
  valorGH: Complex;
}
export type ResultadoProjeto = ResultadoClassico | ResultadoPrimeiraOrdem | ResultadoPersonalizado;

export function limparPolinomio(coefs: readonly number[]): number[] {
  if (!coefs.length || coefs.some((c) => !Number.isFinite(c)))
    throw new Error("Informe coeficientes finitos e não vazios.");
  const a = [...coefs];
  while (a.length > 1 && a[0] === 0) a.shift();
  return a;
}
export function validarTf(tf: FuncaoTransferencia): FuncaoTransferencia {
  const num = limparPolinomio(tf.num),
    den = limparPolinomio(tf.den);
  if (den.every((c) => c === 0))
    throw new Error("O denominador não pode ser nulo.");
  return { num, den };
}
export function produtoTf(
  a: FuncaoTransferencia,
  b: FuncaoTransferencia,
): FuncaoTransferencia {
  return {
    num: multiplicarPolinomios(a.num, b.num),
    den: multiplicarPolinomios(a.den, b.den),
  };
}
export function raizesVerificadas(coefs: number[]): Complex[] {
  const c = limparPolinomio(coefs);
  if (c.length === 1) return [];
  const monico = c.map((v) => v / c[0]);
  const raizes = encontrarRaizes(monico);
  const validas =
    raizes.length === c.length - 1 &&
    raizes.every((p) => {
      const escala = monico.reduce(
        (s, v) => s * moduloComplexo(p) + Math.abs(v),
        0,
      );
      const residuo = moduloComplexo(avaliarPolinomioComplexo(monico, p));
      return (
        Number.isFinite(p.re) &&
        Number.isFinite(p.im) &&
        Number.isFinite(escala) &&
        residuo <= 1e-7 * Math.max(escala, Number.MIN_VALUE)
      );
    });
  if (!validas)
    throw new Error(
      "O cálculo das raízes não convergiu com precisão suficiente. Reveja a escala e o grau dos polinômios.",
    );
  return raizes;
}
export function fecharMalha(
  direta: FuncaoTransferencia,
  H: FuncaoTransferencia,
): FuncaoTransferencia {
  return validarTf({
    num: multiplicarPolinomios(direta.num, H.den),
    den: somarPolinomios(
      multiplicarPolinomios(direta.den, H.den),
      multiplicarPolinomios(direta.num, H.num),
    ),
  });
}
function positivo(x: number, nome: string) {
  if (!Number.isFinite(x) || x <= 0)
    throw new Error(`${nome} deve ser positivo e finito.`);
}
export function converterEspecificacao(e: Especificacao): {
  sd: Complex;
  zeta: number;
  wn: number;
  wnMin?: number;
} {
  if (e.modo === "polo") {
    if (
      !Number.isFinite(e.re) ||
      !Number.isFinite(e.im) ||
      e.re >= 0 ||
      e.im === 0
    )
      throw new Error(
        "Informe um polo com parte real negativa e parte imaginária diferente de zero.",
      );
    const sd = { re: e.re, im: Math.abs(e.im) },
      wn = Math.hypot(sd.re, sd.im);
    return { sd, wn, zeta: -sd.re / wn };
  }
  let zeta: number, wn: number, wnMin: number | undefined;
  if (e.modo === "mpTs") {
    if (!Number.isFinite(e.mp) || e.mp <= 0 || e.mp >= 100)
      throw new Error("Mp deve estar entre 0 e 100%, sem os extremos.");
    positivo(e.ts, "O tempo de acomodação");
    positivo(e.margem, "O fator de frequência");
    if (e.margem < 1)
      throw new Error("O fator de frequência deve ser pelo menos 1.");
    if (e.faixa !== 2 && e.faixa !== 5)
      throw new Error("Escolha a faixa de 2% ou 5%.");
    const l = Math.log(e.mp / 100);
    zeta = -l / Math.hypot(Math.PI, l);
    wnMin = (e.faixa === 2 ? 4 : 3) / (zeta * e.ts);
    wn = wnMin * e.margem;
  } else {
    zeta = e.zeta;
    wn = e.wn;
  }
  if (!Number.isFinite(zeta) || zeta <= 0 || zeta >= 1)
    throw new Error(
      "ζ deve estar entre 0 e 1 para este projeto com polos complexos.",
    );
  positivo(wn, "ωn");
  return {
    sd: { re: -zeta * wn, im: wn * Math.sqrt(1 - zeta * zeta) },
    zeta,
    wn,
    wnMin,
  };
}
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
export function projetarControlador(
  entrada: EntradaProjeto<TopologiaClassica>,
): ResultadoClassico;
export function projetarControlador(
  entrada: EntradaProjeto<"primeiraOrdem">,
): ResultadoPrimeiraOrdem;
export function projetarControlador(entrada: EntradaProjeto): ResultadoProjeto;
export function projetarControlador(entrada: EntradaProjeto): ResultadoProjeto {
  if (entrada.topologia === "personalizado") return resolverPersonalizado(entrada);
  if (!["PD", "PI", "PID", "primeiraOrdem"].includes(entrada.topologia))
    throw new Error("Escolha PD, PI, PID ou o controlador a/(s+b).");
  const G = validarTf(entrada.G),
    H = validarTf(entrada.H);
  const esp = converterEspecificacao(entrada.especificacao),
    { sd } = esp;
  const GH = produtoTf(G, H);
  const n = avaliarPolinomioComplexo(GH.num, sd),
    d = avaliarPolinomioComplexo(GH.den, sd);
  if (moduloComplexo(n) === 0 || moduloComplexo(d) === 0)
    throw new Error(
      "O polo desejado coincide com um polo ou zero de G(s)H(s). Escolha outro ponto.",
    );
  const valor = dividirComplexos(n, d),
    faseGH = anguloEmGraus(valor),
    moduloGH = moduloComplexo(valor);
  if (!Number.isFinite(moduloGH) || moduloGH <= 0)
    throw new Error("Não foi possível avaliar G(s)H(s) neste ponto.");
  let parametros:
    | Pick<
        ResultadoClassico,
        "tipo" | "entrada" | "z" | "Kp" | "Ki" | "Kd" | "alfa" | "faseIntegral"
      >
    | Pick<ResultadoPrimeiraOrdem, "tipo" | "entrada" | "a" | "b" | "valorGH">;
  let estrutura: FuncaoTransferencia, Kc: number;
  if (entrada.topologia === "primeiraOrdem") {
    // sd + b + a GH(sd) = 0. Os parâmetros reais vêm das partes
    // imaginária e real, sem supor ganho positivo ou polo estável de Gc.
    if (Math.abs(valor.im) <= 1e-12 * moduloGH)
      throw new Error(
        "Não existe solução real finita para a e b neste polo: a parte imaginária de G(s)H(s) é nula ou numericamente singular. Escolha outro polo.",
      );
    const a = -sd.im / valor.im;
    const b = -sd.re - a * valor.re;
    if (![a, b].every(Number.isFinite) || a === 0)
      throw new Error(
        "O cálculo de a e b produziu parâmetros não finitos ou ganho nulo. Reveja o polo e os coeficientes.",
      );
    Kc = a;
    estrutura = { num: [1], den: [1, b] };
    parametros = {
      tipo: "primeiraOrdem",
      entrada: {
        ...entrada,
        topologia: "primeiraOrdem",
        G,
        H,
        especificacao: { ...entrada.especificacao },
      },
      a,
      b,
      valorGH: valor,
    };
  } else {
    const integral = entrada.topologia !== "PD";
    const faseIntegral = integral ? anguloEmGraus(sd) : 0;
    const alvo = (((180 - faseGH + faseIntegral) % 360) + 360) % 360;
    const quantidadeZeros = entrada.topologia === "PID" ? 2 : 1;
    const alfa = alvo / quantidadeZeros;
    if (alfa <= 1e-8 || alfa >= 180 - 1e-8)
      throw new Error(
        "Esta topologia não permite um zero real finito com ganho positivo no polo escolhido. Altere o polo ou o controlador.",
      );
    const z = sd.im / Math.tan((alfa * Math.PI) / 180) - sd.re;
    const distancia = Math.hypot(sd.re + z, sd.im);
    Kc =
      (integral ? moduloComplexo(sd) : 1) /
      (Math.pow(distancia, quantidadeZeros) * moduloGH);
    if (![z, Kc].every(Number.isFinite) || Kc <= 0)
      throw new Error(
        "O cálculo resultou em parâmetros não finitos. Escolha outro polo.",
      );
    estrutura = {
      num: quantidadeZeros === 2 ? [1, 2 * z, z * z] : [1, z],
      den: integral ? [1, 0] : [1],
    };
    parametros = {
      tipo: "classico",
      entrada: {
        ...entrada,
        topologia: entrada.topologia,
        G,
        H,
        especificacao: { ...entrada.especificacao },
      },
      z,
      alfa,
      faseIntegral,
      Kp:
        entrada.topologia === "PD"
          ? Kc * z
          : entrada.topologia === "PID"
            ? 2 * Kc * z
            : Kc,
      Ki: integral ? Kc * (quantidadeZeros === 2 ? z * z : z) : 0,
      Kd: entrada.topologia === "PI" ? 0 : Kc,
    };
  }
  const Gc = { num: estrutura.num.map((c) => Kc * c), den: estrutura.den };
  const malha = produtoTf(Gc, GH),
    fechada = fecharMalha(produtoTf(Gc, G), H);
  const polos = raizesVerificadas(fechada.den);
  const parcelas: ParcelaGeometria[] = [];
  for (const tipo of ["zero", "polo"] as const) {
    for (const raiz of raizesVerificadas(tipo === "zero" ? GH.num : GH.den)) {
      const vetor = { re: sd.re - raiz.re, im: sd.im - raiz.im };
      parcelas.push({
        tipo,
        raiz,
        vetor,
        angulo: anguloEmGraus(vetor),
        distancia: moduloComplexo(vetor),
      });
    }
  }
  const L = dividirComplexos(
    avaliarPolinomioComplexo(malha.num, sd),
    avaliarPolinomioComplexo(malha.den, sd),
  );
  const caracteristica = avaliarPolinomioComplexo(fechada.den, sd);
  const escala = fechada.den.reduce(
    (a, c) => a * moduloComplexo(sd) + Math.abs(c),
    0,
  );
  const residuo = moduloComplexo(caracteristica) / (escala || 1);
  if (!Number.isFinite(residuo) || residuo > 1e-7) {
    throw new Error(
      "O controlador calculado não satisfez a equação característica com precisão suficiente. Reveja a escala dos coeficientes ou o polo desejado.",
    );
  }
  const avisos: string[] = [];
  if (parametros.tipo === "classico" && parametros.z < 0)
    avisos.push(
      "O zero do controlador está no semiplano direito. O projeto tem fase não mínima.",
    );
  if (parametros.tipo === "primeiraOrdem") {
    if (parametros.b <= 0)
      avisos.push(
        "O polo do controlador isolado não é assintoticamente estável. Confira a estabilidade da malha fechada.",
      );
    if (parametros.a < 0)
      avisos.push(
        "O cálculo exige ganho a negativo. O sinal faz parte do controlador projetado.",
      );
  }
  if (Gc.num.length > Gc.den.length)
    avisos.push(
      "O controlador ideal é impróprio. A discretização pode resultar em uma equação não causal.",
    );
  if (entrada.especificacao.modo === "mpTs")
    avisos.push(
      "O polo é calculado por uma aproximação de segunda ordem. Confira os limites na resposta completa.",
    );
  return {
    ...parametros,
    ...esp,
    Kc,
    GH,
    Gc,
    estrutura,
    malha,
    fechada,
    faseGH,
    moduloGH,
    parcelas,
    faseGanho: GH.num[0] / GH.den[0] < 0 ? 180 : 0,
    polos,
    erroPolo: Math.min(
      ...polos.map((p) => Math.hypot(p.re - sd.re, p.im - sd.im)),
    ),
    residuo,
    erroAngulo: Math.abs(wrap(anguloEmGraus(L) - 180)),
    erroModulo: Math.abs(moduloComplexo(L) - 1),
    avisos,
  };
}
