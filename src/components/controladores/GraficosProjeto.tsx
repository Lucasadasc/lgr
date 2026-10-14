import { useMemo } from "react";
import LgrPlot, { type Trace } from "../Unit2Plot";
import { calcularRamosLgr } from "../../lib/lgr";
import {
  produtoTf,
  raizesVerificadas,
  type ResultadoProjeto,
} from "../../lib/controladores";
import type { RespostaDegrau } from "../../lib/controladores/simulacao";

export default function GraficosProjeto({
  r,
  resposta,
}: {
  r: ResultadoProjeto;
  resposta: RespostaDegrau;
}) {
  const traces = useMemo<Trace[]>(() => {
    const base = produtoTf(r.estrutura, r.GH);
    // Kc é o parâmetro da varredura. Escalar o numerador por Kc permite
    // varrer um multiplicador de 0 a 100 e mantém o ganho original da planta.
    const numerador = base.num.map((c) => c * r.Kc);
    // Em uma malha imprópria, varremos o ganho recíproco em D/(Kc*N).
    // D + λ*Kc*N = 0 e Kc*N + (1/λ)*D = 0 têm as mesmas raízes.
    const impropria = numerador.length > base.den.length;
    const { ramos } = calcularRamosLgr(
      impropria ? base.den : numerador,
      impropria ? numerador : base.den,
      100,
    );
    const pontosX: (number | null)[] = [],
      pontosY: (number | null)[] = [];
    for (
      let ramo = 0;
      ramo < Math.max(base.num.length, base.den.length) - 1;
      ramo++
    ) {
      for (const pontos of ramos) {
        pontosX.push(pontos[ramo].re);
        pontosY.push(pontos[ramo].im);
      }
      pontosX.push(null);
      pontosY.push(null);
    }
    const polos = raizesVerificadas(base.den),
      zeros = raizesVerificadas(base.num);
    return [
      {
        x: pontosX,
        y: pontosY,
        mode: "lines",
        name: "LGR compensado",
        line: { color: "#475569", width: 1.5 },
      },
      {
        x: polos.map((p) => p.re),
        y: polos.map((p) => p.im),
        mode: "markers",
        name: "Polos da malha aberta",
        marker: { color: "#dc2626", symbol: "x", size: 10 },
      },
      {
        x: zeros.map((p) => p.re),
        y: zeros.map((p) => p.im),
        mode: "markers",
        name: "Zeros da malha aberta",
        marker: { color: "#16a34a", symbol: "circle-open", size: 10 },
      },
      {
        x: r.polos.map((p) => p.re),
        y: r.polos.map((p) => p.im),
        mode: "markers",
        name: "Polos no ganho projetado",
        marker: { color: "#0f172a", symbol: "diamond-open", size: 13 },
      },
      {
        x: [r.sd.re, r.sd.re],
        y: [r.sd.im, -r.sd.im],
        mode: "markers",
        name: "Polos desejados",
        marker: { color: "#0f172a", symbol: "star", size: 11 },
      },
    ];
  }, [r]);
  const temporal = useMemo<Trace[]>(() => {
    if (resposta.yss === null || !resposta.t.length) return [];
    const faixa =
      r.entrada.especificacao.modo === "mpTs"
        ? r.entrada.especificacao.faixa
        : 2;
    const fim = resposta.horizonte,
      ss = resposta.yss,
      delta = (Math.abs(ss) * faixa) / 100;
    return [
      {
        x: resposta.t,
        y: resposta.y,
        mode: "lines",
        name: "Saída ao degrau unitário",
        line: { color: "#0f172a" },
      },
      {
        x: [0, fim],
        y: [ss, ss],
        mode: "lines",
        name: "Valor final",
        line: { color: "#475569", dash: "dash" },
      },
      {
        x: [0, fim],
        y: [ss + delta, ss + delta],
        mode: "lines",
        name: `Faixa de ${faixa}%`,
        line: { color: "#92400e", dash: "dot" },
      },
      {
        x: [0, fim],
        y: [ss - delta, ss - delta],
        mode: "lines",
        showlegend: false,
        line: { color: "#92400e", dash: "dot" },
      },
    ];
  }, [r, resposta]);
  const foco = useMemo(
    () => [...r.polos, r.sd, { re: r.sd.re, im: -r.sd.im }],
    [r],
  );
  return (
    <>
      <p id="descricao-lgr-projeto" className="ajuda">
        O gráfico compara os polos efetivos com o par desejado no LGR compensado. Confira também os demais polos.
      </p>
      <LgrPlot
        title="LGR com controlador"
        descritoPor="descricao-lgr-projeto"
        traces={traces}
        foco={foco}
      />
      {temporal.length > 0 && (
        <>
          <p id="descricao-degrau" className="ajuda">
            Entrada degrau unitário, estados iniciais nulos. A faixa de
            acomodação é relativa ao valor final da saída.
          </p>
          <LgrPlot
            title="Resposta da malha fechada ao degrau"
            descritoPor="descricao-degrau"
            traces={temporal}
            temporal
          />
        </>
      )}
    </>
  );
}
