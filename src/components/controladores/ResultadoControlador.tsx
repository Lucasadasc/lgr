import PassosPersonalizado from "./PassosPersonalizado";
import { useMemo, useState, type ReactNode } from "react";
import Formula, { complexoParaLatex } from "../Formula";
import { ResolutionSteps, ResolutionStep } from "./ResolutionSteps";
import GraficosProjeto from "./GraficosProjeto";
import { type ResultadoProjeto } from "../../lib/controladores";
import { simularDegrau } from "../../lib/controladores/simulacao";
import DiscretizacaoControlador from "./DiscretizacaoControlador";
import type { DadosDiscretizacao } from "./dadosDiscretizacao";
import PassosPrimeiraOrdem from "./PassosPrimeiraOrdem";
import {
  numeroLatex as n,
  tfLatex as latexTf,
} from "../../lib/controladores/formatacao";

const texto = (x: number | null, unidade = "") =>
  x === null
    ? "Não definido"
    : `${new Intl.NumberFormat("pt-BR", { maximumSignificantDigits: 6 }).format(x)}${unidade}`;

function MemoriaCompleta({
  visivel,
  children,
}: {
  visivel: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`memoria-completa${visivel ? "" : " memoria-recolhida"}`}>
      {children}
    </div>
  );
}

export default function ResultadoControlador({
  r,
  completa,
  ativo,
  aoImprimir,
  preparandoImpressao,
  discretizacao,
  aoEditarDiscretizacao,
}: {
  r: ResultadoProjeto;
  completa: boolean;
  ativo: boolean;
  aoImprimir: () => void;
  preparandoImpressao: boolean;
  discretizacao: DadosDiscretizacao;
  aoEditarDiscretizacao: (dados: DadosDiscretizacao) => void;
}) {
  const [horizonte, setHorizonte] = useState("");
  const simulacao = useMemo(() => {
    try {
      return {
        resposta: simularDegrau(
          r.fechada,
          horizonte.trim() ? Number(horizonte) : undefined,
        ),
        erro: null,
      };
    } catch (e) {
      return {
        resposta: null,
        erro: e instanceof Error ? e.message : "Falha na simulação.",
      };
    }
  }, [r, horizonte]);
  const esp = r.entrada.especificacao;
  const resposta = simulacao.resposta;
  const ts =
    esp.modo === "mpTs" && esp.faixa === 5 ? resposta?.ts5 : resposta?.ts2;
  const aprovaMp =
    resposta?.status === "ok" &&
    resposta.mp !== null &&
    esp.modo === "mpTs" &&
    resposta.mp <= esp.mp;
  const aprovaTs =
    resposta?.status === "ok" &&
    ts != null &&
    esp.modo === "mpTs" &&
    ts < esp.ts;
  const integral = r.entrada.topologia !== "PD",
    zeros = r.entrada.topologia === "PID" ? 2 : 1;
  return (
    <ResolutionSteps titles={r.tipo === 'personalizado' ? [ 'Planta e modelo personalizado', 'Parâmetros e equação característica', 'Controlador final', 'Validação da malha fechada', 'Discretização e equação de diferenças' ] : r.tipo === 'primeiraOrdem' ? [
      'Planta, realimentação e polo desejado', 'Equação característica e cálculo de a e b',
      'Controlador e polo finais', 'Validação da malha fechada', 'Discretização e equação de diferenças',
    ] : [
      'Planta, realimentação e controlador', 'Especificações e polos desejados', 'Critério do ângulo',
      'Posição do zero do controlador', 'Critério do módulo e ganho Kc', 'Controlador e ganhos finais',
      'Validação da malha fechada', 'Discretização e equação de diferenças',
    ]}>
      {r.tipo === "personalizado" ? <PassosPersonalizado r={r} /> : r.tipo === "primeiraOrdem" ? (
        <PassosPrimeiraOrdem r={r} completa={completa} />
      ) : (
        <>
          <ResolutionStep index={0} title="Planta, realimentação e controlador">
            <div className="step-body">
              <Formula
                latex={`G(s)=${latexTf(r.entrada.G)},\\quad H(s)=${latexTf(r.entrada.H)}`}
              />
              <Formula
                latex={`G_c(s)=K_c\\frac{(s+z)${zeros === 2 ? "^2" : ""}}{${integral ? "s" : "1"}}`}
              />
              <MemoriaCompleta visivel={completa}>
                <>
                  <p>
                    Realimentação negativa com o controlador em série com a
                    planta. Os coeficientes originais de G e H fazem parte do
                    cálculo do ganho.
                  </p>
                  <Formula latex={`G(s)H(s)=${latexTf(r.GH)}`} />
                </>
              </MemoriaCompleta>
            </div>
          </ResolutionStep>
          <ResolutionStep index={1} title="Especificações e polos desejados">
            <div className="step-body">
              {esp.modo === "mpTs" && (
                <>
                  <Formula
                    latex={`\\zeta=\\frac{-\\ln(M_p/100)}{\\sqrt{\\pi^2+\\ln^2(M_p/100)}}=${n(r.zeta)}`}
                  />
                  <MemoriaCompleta visivel={completa}>
                    <Formula
                      latex={`\\zeta=\\frac{-\\ln(${n(esp.mp)}/100)}{\\sqrt{\\pi^2+\\ln^2(${n(esp.mp)}/100)}}`}
                    />
                  </MemoriaCompleta>
                  <Formula
                    latex={`\\omega_{n,\\min}=\\frac{${esp.faixa === 2 ? 4 : 3}}{\\zeta t_s}=${n(r.wnMin!)}\\,\\mathrm{rad/s},\\quad\\omega_n=${n(esp.margem)}\\cdot\\omega_{n,\\min}=${n(r.wn)}`}
                  />
                  <MemoriaCompleta visivel={completa}>
                    <Formula
                      latex={`\\omega_{n,\\min}=\\frac{${esp.faixa === 2 ? 4 : 3}}{${n(r.zeta)}\\cdot${n(esp.ts)}}`}
                    />
                  </MemoriaCompleta>
                </>
              )}
              {esp.modo === "zetaWn" && (
                <Formula
                  latex={`\\zeta=${n(r.zeta)},\\quad\\omega_n=${n(r.wn)}\\,\\mathrm{rad/s}`}
                />
              )}
              <Formula
                latex={`s_d=-\\zeta\\omega_n+j\\omega_n\\sqrt{1-\\zeta^2}=${complexoParaLatex(r.sd, 6)}`}
              />
              {esp.modo === "polo" && (
                <p className="ajuda">
                  Polo informado diretamente. Usamos o conjugado no semiplano
                  superior para calcular os ângulos; o conjugado inferior também
                  será raiz.
                </p>
              )}
            </div>
          </ResolutionStep>
          <ResolutionStep index={2} title="Critério do ângulo">
            <div className="step-body">
              <Formula
                latex={`\\angle[G_c(s_d)G(s_d)H(s_d)]\\equiv180^\\circ\\pmod{360^\\circ}`}
              />
              <Formula
                latex={`\\theta_{GH}=${n(r.faseGH)}^\\circ,\\quad ${zeros}\\alpha=${n(180 - r.faseGH + r.faseIntegral)}^\\circ\\pmod{360^\\circ}\\Rightarrow\\alpha=${n(r.alfa)}^\\circ`}
              />
              <MemoriaCompleta visivel={completa}>
                <>
                  <p>
                    As fases dos zeros são somadas e as fases dos polos são
                    subtraídas. atan2 preserva o quadrante de cada vetor.
                  </p>
                  {r.parcelas.map((p, i) => (
                    <div key={i}>
                      <p className="ajuda">
                        {p.tipo === "polo" ? "Polo" : "Zero"} {i + 1}
                      </p>
                      <Formula
                        latex={`s_d-(${complexoParaLatex(p.raiz)})=${complexoParaLatex(p.vetor)},\\quad\\theta=\\operatorname{atan2}(${n(p.vetor.im)},${n(p.vetor.re)})=${n(p.angulo)}^\\circ`}
                      />
                      <Formula
                        latex={`d=\\sqrt{(${n(p.vetor.re)})^2+(${n(p.vetor.im)})^2}=${n(p.distancia)}`}
                      />
                    </div>
                  ))}
                  <Formula
                    latex={`\\theta_{GH}=${n(r.faseGanho)}^\\circ+${n(r.parcelas.filter((p) => p.tipo === "zero").reduce((s, p) => s + p.angulo, 0))}^\\circ-${n(r.parcelas.filter((p) => p.tipo === "polo").reduce((s, p) => s + p.angulo, 0))}^\\circ\\equiv${n(r.faseGH)}^\\circ`}
                  />
                  {integral && (
                    <Formula
                      latex={`\\angle s_d=${n(r.faseIntegral)}^\\circ\\quad\\text{(polo do controlador na origem)}`}
                    />
                  )}
                  <p>
                    Escolhemos o ângulo de cada zero entre 0° e 180°. No PID com
                    zeros iguais, dividimos a contribuição necessária por dois.
                  </p>
                </>
              </MemoriaCompleta>
            </div>
          </ResolutionStep>
          <ResolutionStep index={3} title="Posição do zero do controlador">
            <div className="step-body">
              <Formula
                latex={`z=\\frac{\\operatorname{Im}s_d}{\\tan\\alpha}-\\operatorname{Re}s_d=${n(r.z)}`}
              />
              <MemoriaCompleta visivel={completa}>
                <Formula
                  latex={`z=\\frac{${n(r.sd.im)}}{\\tan(${n(r.alfa)}^\\circ)}-(${n(r.sd.re)})=${n(r.z)}`}
                />
              </MemoriaCompleta>
              <Formula
                latex={`s_z=${n(-r.z)}${zeros === 2 ? "\\quad\\text{(zero duplo)}" : ""}`}
              />
            </div>
          </ResolutionStep>
          <ResolutionStep index={4} title="Critério do módulo e ganho Kc">
            <div className="step-body">
              <Formula
                latex={`|G_c(s_d)G(s_d)H(s_d)|=1,\\quad|GH(s_d)|=${n(r.moduloGH)}`}
              />
              <Formula
                latex={`K_c=\\frac{${integral ? "|s_d|" : "1"}}{|s_d+z|${zeros === 2 ? "^2" : ""}\\,|GH(s_d)|}=${n(r.Kc)}`}
              />
              <MemoriaCompleta visivel={completa}>
                <>
                  <Formula
                    latex={`|s_d+z|=\\sqrt{(${n(r.sd.re)}+${n(r.z)})^2+${n(r.sd.im)}^2}=${n(Math.hypot(r.sd.re + r.z, r.sd.im))}`}
                  />
                  <Formula
                    latex={`K_c=\\frac{${integral ? n(Math.hypot(r.sd.re, r.sd.im)) : "1"}}{(${n(Math.hypot(r.sd.re + r.z, r.sd.im))})^{${zeros}}\\cdot${n(r.moduloGH)}}=${n(r.Kc)}`}
                  />
                </>
              </MemoriaCompleta>
            </div>
          </ResolutionStep>
          <ResolutionStep index={5} title="Controlador e ganhos finais">
            <div className="step-body">
              <Formula latex={`G_c(s)=${latexTf(r.Gc)}`} />
              <dl className="ganhos-projeto">
                <div>
                  <dt>Kc</dt>
                  <dd>{texto(r.Kc)}</dd>
                </div>
                <div>
                  <dt>Kp</dt>
                  <dd>{texto(r.Kp)}</dd>
                </div>
                <div>
                  <dt>Ki</dt>
                  <dd>{texto(r.Ki)}</dd>
                </div>
                <div>
                  <dt>Kd</dt>
                  <dd>{texto(r.Kd)}</dd>
                </div>
              </dl>
              <MemoriaCompleta visivel={completa}>
                <Formula
                  latex={
                    r.entrada.topologia === "PD"
                      ? `K_p=K_cz=${n(r.Kc)}\\cdot${n(r.z)}=${n(r.Kp)},\\quad K_d=K_c`
                      : r.entrada.topologia === "PI"
                        ? `K_p=K_c,\\quad K_i=K_cz=${n(r.Kc)}\\cdot${n(r.z)}=${n(r.Ki)}`
                        : `K_d=K_c,\\quad K_p=2K_cz=${n(r.Kp)},\\quad K_i=K_cz^2=${n(r.Ki)}`
                  }
                />
              </MemoriaCompleta>
              {r.avisos.map((a) => (
                <p key={a} className="ajuda">
                  {a}
                </p>
              ))}
            </div>
          </ResolutionStep>
        </>
      )}
      <ResolutionStep index={r.tipo !== "classico" ? 3 : 6} title="Validação da malha fechada">
        <div className="step-body">
          <Formula
            latex={`T(s)=\\frac{G_c(s)G(s)}{1+G_c(s)G(s)H(s)}=${latexTf(r.fechada)}`}
          />
          <p>Todos os polos de malha fechada</p>
          <div className="lista-polos">
            {r.polos.map((p, i) => (
              <Formula
                key={i}
                latex={`p_{${i + 1}}=${complexoParaLatex(p, 6)}`}
              />
            ))}
          </div>
          {r.tipo === 'personalizado' && !r.poloAtendido && <p className="badge-warn">O par desejado não está presente. As métricas correspondem ao controlador informado.</p>}
          <p className="ajuda">
            A presença do par desejado não garante sua dominância nem o
            cumprimento de Mp e tempo de acomodação.
          </p>
          <MemoriaCompleta visivel={completa}>
            <>
              <Formula
                latex={`|\\angle L(s_d)-180^\\circ|_{\\mathrm{mod}\\,360}=${n(r.erroAngulo)}^\\circ,\\quad ||L(s_d)|-1|=${n(r.erroModulo)}`}
              />
              <Formula
                latex={`\\varepsilon_{\\mathrm{polo}}=${n(r.erroPolo)},\\quad\\varepsilon_{\\mathrm{caract.,rel.}}=${n(r.residuo)}`}
              />
            </>
          </MemoriaCompleta>
          <label className="no-print">
            Horizonte de simulação em segundos
            <input className="form-input"
              type="number"
              min="0"
              step="any"
              placeholder="Automático pelos polos"
              value={horizonte}
              onChange={(e) => setHorizonte(e.target.value)}
            />
          </label>
          {simulacao.erro && (
            <p role="alert" className="badge-warn">
              {simulacao.erro}
            </p>
          )}
          {resposta && (
            <>
              <p
                className={resposta.status === "ok" ? "badge-ok" : "badge-warn"}
                role="status"
              >
                {resposta.status === "ok"
                  ? "Malha assintoticamente estável"
                  : resposta.mensagem}
              </p>
              {resposta.status === "ok" && (
                <>
                  <div className="tabela-scroll">
                    <table className="data-table">
                      <caption>Resposta ao degrau unitário</caption>
                      <thead>
                        <tr>
                          <th scope="col">Medida</th>
                          <th scope="col">Simulação</th>
                          <th scope="col">Requisito</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th scope="row">Valor final</th>
                          <td>{texto(resposta.yss)}</td>
                          <td>Calculado com H(s)</td>
                        </tr>
                        <tr>
                          <th scope="row">Saída em 0⁺</th>
                          <td>{texto(resposta.y0)}</td>
                          <td>Termo direto</td>
                        </tr>
                        <tr>
                          <th scope="row">Mp</th>
                          <td>{texto(resposta.mp, "%")}</td>
                          <td>
                            {esp.modo === "mpTs"
                              ? `≤ ${texto(esp.mp, "%")} · ${resposta.mp === null ? "Não definido" : aprovaMp ? "Atendido" : "Não atendido"}`
                              : "Sem limite informado"}
                          </td>
                        </tr>
                        {[2, 5].map((f) => {
                          const medido = f === 2 ? resposta.ts2 : resposta.ts5;
                          return (
                            <tr key={f}>
                              <th scope="row">Acomodação {f}%</th>
                              <td>
                                {medido === null
                                  ? resposta.yss === 0
                                    ? "Faixa relativa não definida"
                                    : "Não acomodou no intervalo"
                                  : texto(medido, " s")}
                              </td>
                              <td>
                                {esp.modo === "mpTs" && esp.faixa === f
                                  ? `< ${texto(esp.ts, " s")} · ${medido === null ? "Não confirmado" : aprovaTs ? "Atendido" : "Não atendido"}`
                                  : "Sem limite informado"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="ajuda">
                    Horizonte de {texto(resposta.horizonte, " s")}. Mp inclui o
                    salto inicial, quando presente. Para valor final nulo, as
                    métricas relativas não são definidas.
                  </p>
                  {esp.modo === "mpTs" && (!aprovaMp || !aprovaTs) && (
                    <p className="badge-warn">
                      O projeto inicial não confirmou todos os limites. Ajuste o
                      fator de frequência ou informe outro polo e projete
                      novamente. Estender o horizonte permite conferir a
                      acomodação.
                    </p>
                  )}
                </>
              )}
              {ativo && <GraficosProjeto r={r} resposta={resposta} />}
            </>
          )}
        </div>
      </ResolutionStep>
      <ResolutionStep index={r.tipo !== "classico" ? 4 : 7} title="Discretização e equação de diferenças">
      <DiscretizacaoControlador
        r={r}
        completa={completa}
        dados={discretizacao}
        aoEditar={aoEditarDiscretizacao}
      />
      </ResolutionStep>
      <div className="no-print print-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={aoImprimir}
          disabled={preparandoImpressao}
        >
          {preparandoImpressao
            ? "Preparando impressão…"
            : "Imprimir resolução / salvar PDF"}
        </button>
        <p className="ajuda">
          Documento no formato das entregas, com enunciado, cálculos, gráfico e
          verificação dos requisitos. Usa o projeto atual, com horizonte de 20 s na impressão, independentemente do passo selecionado.
        </p>
      </div>
    </ResolutionSteps>
  );
}
