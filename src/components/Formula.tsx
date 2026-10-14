import katex from "katex";
import "katex/dist/katex.min.css";

export function polinomioParaLatex(
  coeficientes: readonly number[],
  variavel = "s",
): string {
  const grau = coeficientes.length - 1;
  const partes: string[] = [];
  coeficientes.forEach((coef, k) => {
    const expoente = grau - k;
    if (Math.abs(coef) < 1e-12) return;
    const abs = Math.abs(coef);
    const coefStr =
      expoente === 0
        ? `${+abs.toFixed(4)}`
        : Math.abs(abs - 1) < 1e-12
          ? ""
          : `${+abs.toFixed(4)}`;
    let termo = "";
    if (expoente === 0) termo = coefStr;
    else if (expoente === 1) termo = `${coefStr}${variavel}`;
    else termo = `${coefStr}${variavel}^{${expoente}}`;
    if (partes.length === 0) partes.push(coef < 0 ? `-${termo}` : termo);
    else partes.push(coef < 0 ? ` - ${termo}` : ` + ${termo}`);
  });
  return partes.join("") || "0";
}

export {
  anguloMemoriaParaLatex,
  anguloParcelaParaLatex,
  coeficienteLider,
  complexoParaLatex,
  distanciaParaLatex,
  fatorLinearParaLatex,
  fatoresParaLatex,
  formatarNumLatex,
  polinomioFatoradoParaLatex,
  vetorParaLatex,
} from "../lib/lgr/formatacao";

export default function Formula({
  latex,
  display = false,
  descricao,
  id,
  inline = false,
}: {
  latex: string;
  display?: boolean;
  descricao?: string;
  id?: string;
  inline?: boolean;
}) {
  const html = katex.renderToString(latex, { throwOnError: false, displayMode: display, strict: "ignore" });
  if (inline) {
    return (
      <span
        className="formula-inline"
        role="img"
        aria-label={descricao ?? latex}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <div
      id={id}
      className="formula formula-box"
      role="img"
      aria-label={descricao ?? latex}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
