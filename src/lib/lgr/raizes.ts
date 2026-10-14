// Raízes de polinômios via Durand-Kerner (Weierstrass) — suficiente p/ graus 1..8 do LGR
// Retorna [] se polinômio constante.
import type { Complex } from "./tipos";
import {
  criarComplexo,
  somarComplexos,
  subtrairComplexos,
  multiplicarComplexos,
  dividirComplexos,
  moduloComplexo,
} from "./complexos";

export function encontrarRaizes(coeficientes: readonly number[]): Complex[] {
  const copia = [...coeficientes];
  while (copia.length > 1 && Math.abs(copia[0]) < 1e-14) copia.shift();
  // zeros na origem (termo independente = 0) são raízes s=0 — extrai antes
  let quantidadeZerosOrigem = 0;
  while (copia.length > 1 && Math.abs(copia[copia.length - 1]) < 1e-14) {
    copia.pop();
    quantidadeZerosOrigem++;
  }
  const zerosOrigem: Complex[] = Array.from(
    { length: quantidadeZerosOrigem },
    () => criarComplexo(0, 0),
  );
  const grau = copia.length - 1;
  if (grau <= 0) return zerosOrigem;
  if (grau === 1)
    return [...zerosOrigem, criarComplexo(-copia[1] / copia[0], 0)];
  // normaliza mônico
  const lider = copia[0];
  const monico = copia.map((v) => v / lider);
  const raizes: Complex[] = [];
  for (let k = 0; k < grau; k++) {
    const angulo = (2 * Math.PI * k) / grau + 0.4;
    raizes.push({ re: 0.8 * Math.cos(angulo), im: 0.8 * Math.sin(angulo) });
  }
  const avaliar = (s: Complex): Complex => {
    let acumulado: Complex = criarComplexo(0, 0);
    for (const coef of monico)
      acumulado = somarComplexos(
        multiplicarComplexos(acumulado, s),
        criarComplexo(coef, 0),
      );
    return acumulado;
  };
  for (let it = 0; it < 3000; it++) {
    let maiorDelta = 0;
    for (let i = 0; i < grau; i++) {
      const valor = avaliar(raizes[i]);
      let denominador: Complex = criarComplexo(1, 0);
      for (let j = 0; j < grau; j++)
        if (i !== j)
          denominador = multiplicarComplexos(
            denominador,
            subtrairComplexos(raizes[i], raizes[j]),
          );
      if (moduloComplexo(denominador) < 1e-300) continue;
      const delta = dividirComplexos(valor, denominador);
      raizes[i] = subtrairComplexos(raizes[i], delta);
      maiorDelta = Math.max(maiorDelta, moduloComplexo(delta));
    }
    if (maiorDelta < 1e-12) break;
  }
  return [
    ...zerosOrigem,
    ...raizes.map((r) => ({
      re: Math.abs(r.re) < 1e-9 ? 0 : r.re,
      im: Math.abs(r.im) < 1e-9 ? 0 : r.im,
    })),
  ];
}
