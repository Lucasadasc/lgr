import { ResolutionStep } from "./ResolutionSteps";
import Formula, { complexoParaLatex } from "../Formula";
import type { ResultadoPrimeiraOrdem } from "../../lib/controladores";
import { numeroImpresso } from "../../lib/controladores/impressao";
import { numeroLatex as n, tfLatex } from "../../lib/controladores/formatacao";

export function MemoriaPrimeiraOrdem({ r }: { r: ResultadoPrimeiraOrdem }) {
  return (
    <>
      <Formula latex={`G(s)H(s)=${tfLatex(r.GH)}`} />
      <Formula latex={`V=G(s_d)H(s_d)=${complexoParaLatex(r.valorGH, 7)}`} />
      <Formula latex={"1+\\frac{a}{s_d+b}V=0\\quad\\Rightarrow\\quad s_d+b+aV=0"} />
      <p>
        Como a e b são reais, separamos as partes imaginária e real da equação
        característica.
      </p>
      <Formula
        latex={`a=\\frac{-\\operatorname{Im}s_d}{\\operatorname{Im}V}=\\frac{-(${n(r.sd.im)})}{${n(r.valorGH.im)}}=${n(r.a)}`}
      />
      <Formula
        latex={`b=-\\operatorname{Re}s_d-a\\operatorname{Re}V=-(${n(r.sd.re)})-(${n(r.a)})(${n(r.valorGH.re)})=${n(r.b)}`}
      />
    </>
  );
}

export default function PassosPrimeiraOrdem({
  r,
  completa,
}: {
  r: ResultadoPrimeiraOrdem;
  completa: boolean;
}) {
  return (
    <>
      <ResolutionStep index={0} title="Planta, realimentação e polo desejado">
        <div className="step-body">
          <Formula
            latex={`G(s)=${tfLatex(r.entrada.G)},\\quad H(s)=${tfLatex(r.entrada.H)}`}
          />
          <Formula
            latex={`G_c(s)=\\frac{a}{s+b},\\quad s_d=${complexoParaLatex(r.sd, 7)}`}
          />
          <p className="ajuda">
            O cálculo posiciona o par conjugado. Os demais polos e a resposta
            completa são verificados abaixo.
          </p>
          {r.entrada.especificacao.modo === "mpTs" && (
            <p className="ajuda">
              ζ = {numeroImpresso(r.zeta)}; ωn = {numeroImpresso(r.wn)} rad/s,
              pela aproximação de segunda ordem. Mp e acomodação devem ser
              conferidos na simulação.
            </p>
          )}
        </div>
      </ResolutionStep>
      <ResolutionStep index={1} title="Equação característica e cálculo de a e b">
        <div className="step-body">
          <div
            className={`memoria-completa${completa ? "" : " memoria-recolhida"}`}
          >
            <MemoriaPrimeiraOrdem r={r} />
          </div>
          <Formula latex={`a=${n(r.a)},\\qquad b=${n(r.b)}`} />
        </div>
      </ResolutionStep>
      <ResolutionStep index={2} title="Controlador e polo finais">
        <div className="step-body">
          <Formula latex={`G_c(s)=${tfLatex(r.Gc)},\\quad s_p=${n(-r.b)}`} />
          {r.avisos.map((aviso) => (
            <p key={aviso} className="ajuda">
              {aviso}
            </p>
          ))}
        </div>
      </ResolutionStep>
    </>
  );
}
