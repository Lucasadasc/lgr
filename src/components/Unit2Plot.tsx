import { useEffect, useRef, useState } from "react";
import type { Config, Data, Layout } from "plotly.js";
import type PlotlyType from "plotly.js-basic-dist-min";
import { coresDoTema, type Tema } from "../lib/plotTema";

export type Trace = Data;

let plotlyPromise: Promise<typeof PlotlyType> | null = null;
function carregarPlotly(): Promise<typeof PlotlyType> {
  if (!plotlyPromise) {
    plotlyPromise = import("plotly.js-basic-dist-min").then(
      (mod) => mod.default,
    );
  }
  return plotlyPromise;
}

export interface PontoFoco {
  re: number;
  im: number;
}

function alcanceDoFoco(
  foco: PontoFoco[],
): { x: [number, number]; y: [number, number] } | undefined {
  const xs = foco.map((p) => p.re).filter((v) => Number.isFinite(v));
  const ys = foco.map((p) => p.im).filter((v) => Number.isFinite(v));
  if (!xs.length) return undefined;
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxAbsY = ys.length ? Math.max(...ys.map((v) => Math.abs(v))) : 0;
  const spanX = Math.max(maxX - minX, 1);
  const cx = (minX + maxX) / 2;
  const lado = Math.max((spanX / 2) * 1.6 + 0.8, maxAbsY * 1.6 + 0.8, 1.5);
  return { x: [cx - lado, cx + lado], y: [-lado, lado] };
}

export default function LgrPlot({
  traces,
  title,
  descritoPor,
  tema: temaProp,
  foco,
  temporal = false,
}: {
  traces: Trace[];
  title: string;
  descritoPor?: string;
  tema?: Tema;
  foco?: PontoFoco[];
  temporal?: boolean;
}) {
  const [temaAtual, setTemaAtual] = useState<Tema>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  useEffect(() => {
    const observer = new MutationObserver(() => setTemaAtual(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  const tema = temaProp ?? temaAtual;
  const ref = useRef<HTMLDivElement>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ehMobile, setEhMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 560 : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 560px)");
    const onChange = () => setEhMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Limpeza ao desmontar: libera o gráfico do DOM.
  useEffect(() => {
    const alvo = ref.current;
    return () => {
      if (alvo && plotlyPromise) {
        void plotlyPromise
          .then((Plotly) => {
            try {
              Plotly.purge(alvo);
            } catch {}
          })
          .catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    let montado = true;
    const el = ref.current;
    if (!el) return;
    setCarregando(true);
    setErro(null);
    void carregarPlotly()
      .then((Plotly) => {
        if (!montado) return;
        const cores = coresDoTema();
        const alcance = foco?.length ? alcanceDoFoco(foco) : undefined;
        const layout: Partial<Layout> = {
          autosize: true,
          title: { text: "" },
          paper_bgcolor: cores.surface,
          plot_bgcolor: cores.surface,
          font: { color: cores.ink, family: cores.font },
          xaxis: {
            title: { text: temporal ? "Tempo (s)" : "Real" },
            zeroline: true,
            zerolinecolor: cores.border,
            gridcolor: cores.grid,
            tickfont: { color: cores.muted },
            ...(alcance ? { range: alcance.x, autorange: false } : {}),
          },
          yaxis: {
            title: { text: temporal ? "Saída y(t)" : "Imag (jω)" },
            zeroline: true,
            zerolinecolor: cores.border,
            gridcolor: cores.grid,
            tickfont: { color: cores.muted },
            ...(temporal ? {} : { scaleanchor: "x" }),
            ...(alcance ? { range: alcance.y, autorange: false } : {}),
          },
          margin: { l: 45, r: 15, t: 15, b: 40 },
          showlegend: true,
          legend: { orientation: "h", x: 0, y: ehMobile ? -0.25 : -0.2, font: { size: ehMobile ? 10 : 12 } },
        };
        const config: Partial<Config> = {
          responsive: true,
          displaylogo: false,
          displayModeBar: true,
          scrollZoom: true,
          modeBarButtonsToRemove: ["select2d", "lasso2d", "zoomIn2d", "zoomOut2d", "autoScale2d"],
          toImageButtonOptions: { format: "png" },
        };
        const themedTraces = traces.map((trace) => {
          const data = trace as { line?: { color?: string }; marker?: { color?: string } };
          const color = (value?: string) => value === '#0f172a' ? cores.ink : value === '#475569' ? cores.muted : value === '#dc2626' ? cores.pole : value === '#16a34a' ? cores.zero : value;
          return { ...trace,
            ...(data.line ? { line: { ...data.line, color: trace.name === "LGR compensado" ? cores.locus : color(data.line.color) } } : {}),
            ...(data.marker ? { marker: { ...data.marker, color: color(data.marker.color) } } : {}),
          } as Trace;
        });
        return Plotly.react(el, themedTraces, layout, config).then(() => { if (montado) setCarregando(false); });
      })
      .catch(() => {
        if (montado) {
          setCarregando(false);
          setErro(
            "Gráfico indisponível offline. Recalcule para tentar de novo.",
          );
        }
      });
    return () => {
      montado = false;
    };
  }, [traces, title, ehMobile, tema, foco, temporal]);

  return (
    <div className="plot-container">
      <div className="plot-header"><strong>{title}</strong></div>
    <div
      ref={ref}
      role="figure"
      aria-label={`${title} — gráfico interativo com zoom e salvamento`}
      aria-describedby={descritoPor}
      style={{ width: "100%", height: ehMobile ? 480 : 420, minHeight: 240 }}
    >
      {carregando && <p className="plot-carregando">Carregando gráfico…</p>}
      {erro && (
        <p className="plot-carregando" role="status">
          {erro}
        </p>
      )}
    </div>
    </div>
  );
}
