// LGR completo — varredura em K para desenho dos ramos (fundo do gráfico)
// Não é um dos 12 passos oficiais; usa os passos 1–3 como base numérica.
import type { Complex } from "./tipos";
import { criarComplexo, moduloComplexo } from "./complexos";
import { somarPolinomios, preencherZerosEsquerda } from "./polinomios";
import { encontrarRaizes } from "./raizes";

function ordenarRamosPorProximidade(
  anteriores: readonly Complex[],
  atuais: Complex[],
): Complex[] {
  const n = atuais.length;
  const saida: Complex[] = new Array(n);
  const usados = new Set<number>();
  for (let i = 0; i < n; i++) {
    let melhor = -1;
    let menorDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (usados.has(j)) continue;
      const d = Math.hypot(
        anteriores[i].re - atuais[j].re,
        anteriores[i].im - atuais[j].im,
      );
      if (d < menorDist) {
        menorDist = d;
        melhor = j;
      }
    }
    saida[i] = atuais[melhor];
    usados.add(melhor);
  }
  return saida;
}

export function calcularRamosLgr(
  numerador: readonly number[],
  denominador: readonly number[],
  ganhoMaximo?: number,
): { Ks: number[]; ramos: Complex[][] } {
  const numeroPolos = denominador.length - 1;
  let teto = ganhoMaximo ?? 100;
  if (ganhoMaximo === undefined) {
    teto = 1000;
    for (const candidato of [100, 500, 1000, 5000]) {
      const poli = somarPolinomios(
        denominador,
        preencherZerosEsquerda(numerador, denominador.length).map(
          (v) => v * candidato,
        ),
      );
      const rr = encontrarRaizes(poli);
      if (rr.some((r) => moduloComplexo(r) > 50)) {
        teto = candidato;
        break;
      }
    }
  }
  const faixaBaixa = Array.from({ length: 120 }, (_, i) => (i / 119) * 0.5);
  const faixaAlta = Array.from(
    { length: 600 },
    (_, i) => 0.5 * Math.pow(teto / 0.5, i / 599),
  );
  const ganhos = [...new Set([...faixaBaixa, ...faixaAlta])].sort(
    (a, b) => a - b,
  );
  const ramos: Complex[][] = [];
  let anteriores: Complex[] | null = null;
  for (const ganho of ganhos) {
    const poli = somarPolinomios(
      denominador,
      preencherZerosEsquerda(numerador, denominador.length).map(
        (v) => v * ganho,
      ),
    );
    let raizesAtuais = encontrarRaizes(poli);
    while (raizesAtuais.length < numeroPolos)
      raizesAtuais.push(criarComplexo(NaN, NaN));
    raizesAtuais = raizesAtuais.slice(0, numeroPolos);
    if (anteriores)
      raizesAtuais = ordenarRamosPorProximidade(anteriores, raizesAtuais);
    anteriores = raizesAtuais;
    ramos.push(raizesAtuais);
  }
  return { Ks: ganhos, ramos };
}
