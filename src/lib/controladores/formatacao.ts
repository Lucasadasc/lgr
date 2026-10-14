import type { FuncaoTransferencia } from "./index";
import type { MetodoDiscreto, ResultadoDiscreto } from "./discretizacao";

export const numeroLatex = (x: number): string => {
  if (!Number.isFinite(x)) return "\\text{não definido}";
  if (x === 0) return "0";
  if (Math.abs(x) < 1e-4 || Math.abs(x) >= 1e6) {
    const [m, e] = x.toExponential(6).split("e");
    return `${Number(m)}\\cdot10^{${Number(e)}}`;
  }
  return String(Number(x.toPrecision(7)));
};
export const polinomioLatex = (coefs: number[], variavel = "s") =>
  coefs
    .flatMap((c, i) => {
      if (c === 0) return [];
      const grau = coefs.length - 1 - i;
      const coef =
        grau && Math.abs(c) === 1 ? (c < 0 ? "-" : "") : numeroLatex(c);
      return [
        `${coef}${grau === 0 ? "" : grau === 1 ? variavel : `${variavel}^{${grau}}`}`,
      ];
    })
    .join(" + ")
    .replaceAll("+ -", "- ") || "0";
export const tfLatex = (f: FuncaoTransferencia, variavel = "s") =>
  `\\frac{${polinomioLatex(f.num, variavel)}}{${polinomioLatex(f.den, variavel)}}`;
export const METODOS_DISCRETOS: Record<
  MetodoDiscreto,
  { nome: string; substituicao: string }
> = {
  forward: { nome: "Euler forward", substituicao: "\\frac{z-1}{T}" },
  backward: { nome: "Euler backward", substituicao: "\\frac{z-1}{Tz}" },
  tustin: { nome: "Tustin", substituicao: "\\frac{2}{T}\\frac{z-1}{z+1}" },
};
export function equacaoDiferencas(
  d: ResultadoDiscreto,
  quebrarLinhas = false,
): string {
  const termos = (
    coefs: number[],
    sinal: number,
    variavel: string,
    avanco = 0,
  ) =>
    coefs.flatMap((c, i) => {
      if (c === 0) return [];
      const deslocamento = avanco - i;
      return [
        `${numeroLatex(c * sinal)}${variavel}[k${deslocamento < 0 ? deslocamento : deslocamento > 0 ? `+${deslocamento}` : ""}]`,
      ];
    });
  const juntar = (t: string[]) => t.join(" + ").replaceAll("+ -", "- ");
  if (quebrarLinhas) {
    const todos = [
      ...termos(d.coefSaida.slice(1), -1, "u", -1),
      ...termos(d.coefEntrada, 1, "e", d.avanco),
    ];
    const linhas: string[] = [];
    for (let i = 0; i < todos.length; i += 3)
      linhas.push(juntar(todos.slice(i, i + 3)));
    return `\\begin{aligned}u[k]&=${linhas[0] || "0"}${linhas
      .slice(1)
      .map((l) => `\\\\ &\\quad + (${l})`)
      .join("")}\\end{aligned}`;
  }
  return `u[k] = ${juntar(termos(d.coefSaida.slice(1), -1, "u", -1)) || "0"} + ${juntar(termos(d.coefEntrada, 1, "e", d.avanco)) || "0"}`;
}
