import MemoriaDiscretizacao from "./MemoriaDiscretizacao";
import { useMemo } from "react";
import Formula, { complexoParaLatex } from "../Formula";
import type { ResultadoProjeto } from "../../lib/controladores";
import {
  discretizarProjeto,
  type MetodoDiscreto,
} from "../../lib/controladores/discretizacao";
import {
  numeroLatex as n,
  tfLatex,
  METODOS_DISCRETOS,
  equacaoDiferencas,
} from "../../lib/controladores/formatacao";

import {
  configuracaoDiscreta,
  type DadosDiscretizacao,
} from "./dadosDiscretizacao";

export default function DiscretizacaoControlador({
  r,
  completa,
  dados,
  aoEditar,
}: {
  r: ResultadoProjeto;
  completa: boolean;
  dados: DadosDiscretizacao;
  aoEditar: (dados: DadosDiscretizacao) => void;
}) {
  const calculo = useMemo(() => {
    try {
      return {
        resultado: discretizarProjeto(r, configuracaoDiscreta(dados)),
        erro: null,
      };
    } catch (e) {
      return {
        resultado: null,
        erro: e instanceof Error ? e.message : "Falha na discretização.",
      };
    }
  }, [r, dados]);
  const p = calculo.resultado,
    d = p?.resultado;
  return (
    <>
      <div className="step-body">
        <div className="grid2 no-print">
          <label>
            Método
            <select className="form-input"
              value={dados.metodo}
              onChange={(e) =>
                aoEditar({ ...dados, metodo: e.target.value as MetodoDiscreto })
              }
            >
              {Object.entries(METODOS_DISCRETOS).map(([id, m]) => (
                <option value={id} key={id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Período T em segundos
            <input className="form-input"
              type="number"
              min="0"
              step="any"
              value={dados.periodo}
              onChange={(e) => aoEditar({ ...dados, periodo: e.target.value })}
            />
          </label>
          <label>
            Função a discretizar
            <select className="form-input"
              value={dados.alvo}
              onChange={(e) =>
                aoEditar({
                  ...dados,
                  alvo: e.target.value as DadosDiscretizacao["alvo"],
                })
              }
            >
              <option value="Gc">Controlador Gc(s)</option>
              <option value="malha">Malha aberta Gc(s)G(s)H(s)</option>
            </select>
          </label>
          <label className="opcao-discretizacao">
            <input className="form-input"
              type="checkbox"
              checked={dados.incluir}
              onChange={(e) =>
                aoEditar({ ...dados, incluir: e.target.checked })
              }
            />
            Incluir discretização na impressão
          </label>
        </div>
        <Formula
          latex={`s\\leftarrow ${METODOS_DISCRETOS[dados.metodo].substituicao},\\quad T=${n(Number(dados.periodo))}\\,\\mathrm{s}`}
        />
        {calculo.erro && (
          <p role="alert" className="badge-warn">
            {calculo.erro}
          </p>
        )}
        {p && d && (
          <>
            <div
              className={`memoria-completa${completa ? "" : " memoria-recolhida"}`}
            >
              <p>
                Substituímos s em cada potência, eliminamos os denominadores
                comuns e normalizamos pelo primeiro coeficiente do denominador.
              </p>
              <Formula latex={`F(s)=${tfLatex(p.continua)}`} />
              <MemoriaDiscretizacao d={d} />
            </div>
            <Formula
              latex={`${dados.alvo === "Gc" ? "G_c" : "L"}(z)=${tfLatex(d, "z")}`}
            />
            <p className="ajuda">
              e[k] é a entrada da função selecionada e u[k] é a saída.
            </p>
            <Formula latex={equacaoDiferencas(d)} />
            {!d.causal && (
              <p className="badge-warn">
                Esta aproximação exige {d.avanco} amostra(s) futura(s) da
                entrada. A equação não é causal.
              </p>
            )}
            <p
              className={
                p.estabilidade === "estavel" ? "badge-ok" : "badge-warn"
              }
            >
              {p.estabilidade === "estavel"
                ? "A função discretizada tem todos os polos dentro do círculo unitário."
                : p.estabilidade === "instavel"
                  ? "A função discretizada tem polos fora do círculo unitário."
                  : "A função discretizada tem polos sobre o círculo unitário, dentro da tolerância numérica."}
            </p>
            <p className="ajuda">
              Esta análise é da função selecionada; não é uma simulação da malha
              digital fechada.
            </p>
            <div
              className={`memoria-completa${completa ? "" : " memoria-recolhida"}`}
            >
              <p>Polos discretos</p>
              {p.polos.map((polo, i) => (
                <Formula
                  key={i}
                  latex={`z_{${i + 1}}=${complexoParaLatex(polo, 7)}`}
                />
              ))}
              <p className="mono">
                Numerador: {d.num.map(n).join("; ")}
                <br />
                Denominador: {d.den.map(n).join("; ")}
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
