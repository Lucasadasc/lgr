import { MemoriaPersonalizada } from "./PassosPersonalizado";
import MemoriaDiscretizacao from "./MemoriaDiscretizacao";
import type { ReactNode } from "react";
import Formula, { complexoParaLatex } from "../Formula";
import {
  numeroImpresso,
  requisitosImpressao,
  quantidadePaginas,
  type ResolucaoImpressao,
} from "../../lib/controladores/impressao";
import {
  numeroLatex as n,
  tfLatex as tf,
  METODOS_DISCRETOS,
  equacaoDiferencas,
} from "../../lib/controladores/formatacao";
import { MemoriaPrimeiraOrdem } from "./PassosPrimeiraOrdem";
import { LISTAS_CONTROLADORES } from "../../lib/controladores/exemplos";

function GraficoImpresso({ resolucao }: { resolucao: ResolucaoImpressao }) {
  const { resposta: s, projeto: p, id } = resolucao;
  if (s.status !== "ok" || s.yss === null || !s.t.length) return null;
  const fim =
    id === "q2" ? 20 : id === "q3" ? 3 : id === "manual" ? s.horizonte : 10;
  const pontos = s.t.flatMap((t, i) =>
    t <= fim && (i % 4 === 0 || t === fim) ? [{ t, y: s.y[i] }] : [],
  );
  const valores = [0, s.yss, ...pontos.map((v) => v.y)];
  const min = Math.min(...valores),
    max = Math.max(...valores);
  const folga = (max - min || 1) * 0.07;
  const baixo = min - folga,
    alto = max + folga;
  const x = (t: number) => 60 + (t / fim) * 558;
  const y = (v: number) => 182 - ((v - baixo) / (alto - baixo)) * 166;
  const e = p.entrada.especificacao;
  const faixa = e.modo === "mpTs" ? (Math.abs(s.yss) * e.faixa) / 100 : null;
  const ts = e.modo === "mpTs" ? (e.faixa === 2 ? s.ts2 : s.ts5) : null;
  const tick = (v: number) =>
    new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(v);
  return (
    <svg
      className="grafico-impresso"
      viewBox="0 0 640 220"
      role="img"
      aria-label="Resposta da malha fechada ao degrau unitário"
    >
      {faixa !== null && (
        <rect
          x="60"
          y={y(s.yss + faixa)}
          width="558"
          height={y(s.yss - faixa) - y(s.yss + faixa)}
          fill="#e2e8f0"
        />
      )}
      {[0, 1, 2, 3, 4].map((i) => {
        const t = (fim * i) / 4,
          v = min + ((max - min) * i) / 4;
        return (
          <g key={i}>
            <path
              d={`M${x(t)} 16V182 M60 ${y(v)}H618`}
              stroke="#e2e8f0"
              strokeWidth=".7"
            />
            <text x={x(t)} y="198" textAnchor="middle">
              {tick(t)}
            </text>
            <text x="52" y={y(v) + 3} textAnchor="end">
              {tick(v)}
            </text>
          </g>
        );
      })}
      <path d="M60 16V182H618" fill="none" stroke="#0f172a" />
      <path d={`M60 ${y(s.yss)}H618`} stroke="#475569" strokeDasharray="5 3" />
      {ts !== null && ts <= fim && (
        <path d={`M${x(ts)} 16V182`} stroke="#175c8c" strokeDasharray="2 3" />
      )}
      <path
        d={pontos
          .map(
            (v, i) =>
              `${i ? "L" : "M"}${x(v.t).toFixed(2)} ${y(v.y).toFixed(2)}`,
          )
          .join(" ")}
        fill="none"
        stroke="#175c8c"
        strokeWidth="1.8"
      />
      <text x="340" y="216" textAnchor="middle">
        Tempo (s)
      </text>
      <text transform="translate(13 98) rotate(-90)" textAnchor="middle">
        Saída y(t)
      </text>
    </svg>
  );
}

function Pagina({
  resolucao,
  pagina,
  total,
  children,
}: {
  resolucao: ResolucaoImpressao;
  pagina: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <article className="pagina-resolucao">
      <header className="cabecalho-resolucao">
        <p>DCA-3701.0 · Projeto de sistemas de controle · 2026.2</p>
        <p>
          <strong>
            {LISTAS_CONTROLADORES.find((l) => l.id === resolucao.lista)
              ?.titulo ?? "Projeto de controlador"}{" "}
            · Lucas Augusto da Silva Cardoso
          </strong>
        </p>
      </header>
      <h2>{resolucao.titulo}</h2>
      <div className="corpo-resolucao">{children}</div>
      <footer className="rodape-resolucao">
        <span>Resolução com o aplicativo LGR e projeto de controladores</span>
        <span>
          {pagina}/{total}
        </span>
      </footer>
    </article>
  );
}

export default function RelatorioImpressao({
  resolucoes,
}: {
  resolucoes: ResolucaoImpressao[];
}) {
  const total = resolucoes.reduce((s, r) => s + quantidadePaginas(r), 0);
  return (
    <section
      className="relatorio-impressao"
      aria-label="Resoluções para impressão"
    >
      {resolucoes.map((resolucao, i) => {
        const { projeto: r, resposta: s } = resolucao;
        const e = r.entrada.especificacao;
        const integral = r.entrada.topologia !== "PD",
          zeros = r.entrada.topologia === "PID" ? 2 : 1;
        const distancia =
          r.tipo === "classico" ? Math.hypot(r.sd.re + r.z, r.sd.im) : 0;
        const primeiraPagina =
          1 +
          resolucoes.slice(0, i).reduce((s, r) => s + quantidadePaginas(r), 0);
        const soma = (tipo: "zero" | "polo") =>
          r.parcelas
            .filter((p) => p.tipo === tipo)
            .reduce((v, p) => v + p.angulo, 0);
        const escala = r.fechada.den[0];
        const normalizada = {
          num: r.fechada.num.map((v) => v / escala),
          den: r.fechada.den.map((v) => v / escala),
        };
        const polos = r.polos
          .map(
            (p) =>
              `${numeroImpresso(p.re)}${Math.abs(p.im) < 1e-8 ? "" : ` ${p.im > 0 ? "+" : "−"} ${numeroImpresso(Math.abs(p.im))}j`}`,
          )
          .join("; ");
        return (
          <div className="questao-impressa" key={resolucao.id}>
            <Pagina resolucao={resolucao} pagina={primeiraPagina} total={total}>
              <section>
                <p>{resolucao.enunciado}</p>
                <Formula
                  latex={`G(s)=${tf(r.entrada.G)},\\qquad H(s)=${tf(r.entrada.H)}`}
                />
              </section>
              <section>
                <h3>1. Definir o polo desejado</h3>
                {e.modo === "mpTs" && (
                  <>
                    <Formula
                      latex={`\\zeta=\\frac{-\\ln(${n(e.mp)}/100)}{\\sqrt{\\pi^2+\\ln^2(${n(e.mp)}/100)}}=${n(r.zeta)}`}
                    />
                    <Formula
                      latex={`\\omega_{n,\\min}=\\frac{${e.faixa === 2 ? 4 : 3}}{${n(r.zeta)}\\cdot${n(e.ts)}}=${n(r.wnMin!)},\\quad \\omega_n=${n(e.margem)}\\cdot\\omega_{n,\\min}=${n(r.wn)}\\,\\mathrm{rad/s}`}
                    />
                    {e.margem > 1 && (
                      <p>
                        Fator de frequência adotado: {numeroImpresso(e.margem)}.{" "}
                        {resolucao.inicial
                          ? `O projeto inicial deu ts(${e.faixa}%) = ${numeroImpresso(e.faixa === 2 ? resolucao.inicial.resposta.ts2 : resolucao.inicial.resposta.ts5, " s")}. O ajuste será conferido na resposta completa.`
                          : "A resposta completa verifica os limites após o ajuste."}
                      </p>
                    )}
                  </>
                )}
                {e.modo === "zetaWn" && (
                  <Formula
                    latex={`\\zeta=${n(e.zeta)},\\qquad\\omega_n=${n(e.wn)}\\,\\mathrm{rad/s}`}
                  />
                )}
                <Formula
                  latex={`s_d=-\\zeta\\omega_n+j\\omega_n\\sqrt{1-\\zeta^2}=${complexoParaLatex(r.sd, 6)}`}
                />
                {e.modo === "polo" && (
                  <p>
                    O polo foi informado diretamente. O conjugado inferior
                    também deve ser raiz.
                  </p>
                )}
              </section>
              {r.tipo === "personalizado" ? <section><h3>2. Controlador personalizado e parâmetros</h3><MemoriaPersonalizada r={r} /></section> : r.tipo === "primeiraOrdem" ? (
                <section>
                  <h3>2. Calcular os parâmetros reais a e b</h3>
                  <MemoriaPrimeiraOrdem r={r} />
                  <Formula
                    latex={`G_c(s)=${tf(r.Gc)},\\qquad s_p=${n(-r.b)}`}
                  />
                </section>
              ) : (
                <>
                  <section>
                    <h3>2. Aplicar o critério do ângulo</h3>
                    <Formula latex={`G(s)H(s)=${tf(r.GH)}`} />
                    <Formula
                      latex={`\\theta_{GH}=${n(r.faseGanho)}^\\circ+${n(soma("zero"))}^\\circ-${n(soma("polo"))}^\\circ\\equiv${n(r.faseGH)}^\\circ`}
                    />
                    <p>
                      Somam-se os ângulos dos zeros e subtraem-se os dos polos,
                      usando atan2 para preservar os quadrantes.
                    </p>
                    {integral && (
                      <Formula
                        latex={`\\angle s_d=${n(r.faseIntegral)}^\\circ\\quad\\text{(polo do controlador na origem)}`}
                      />
                    )}
                    <Formula
                      latex={`${zeros}\\alpha\\equiv180^\\circ-\\theta_{GH}${integral ? "+\\angle s_d" : ""}\\pmod{360^\\circ},\\quad\\alpha=${n(r.alfa)}^\\circ`}
                    />
                  </section>
                  <section>
                    <h3>3. Calcular o zero real e o ganho</h3>
                    <Formula
                      latex={`z=\\frac{\\operatorname{Im}s_d}{\\tan\\alpha}-\\operatorname{Re}s_d=\\frac{${n(r.sd.im)}}{\\tan(${n(r.alfa)}^\\circ)}-(${n(r.sd.re)})=${n(r.z)}`}
                    />
                    <Formula
                      latex={`s_z=${n(-r.z)}${zeros === 2 ? "\\quad\\text{(zero duplo)}" : ""},\\quad|s_d+z|=${n(distancia)},\\quad|GH(s_d)|=${n(r.moduloGH)}`}
                    />
                    <Formula
                      latex={`K_c=\\frac{${integral ? "|s_d|" : "1"}}{|s_d+z|${zeros === 2 ? "^2" : ""}\\,|GH(s_d)|}=\\frac{${integral ? n(Math.hypot(r.sd.re, r.sd.im)) : "1"}}{${n(distancia)}^{${zeros}}\\cdot${n(r.moduloGH)}}=${n(r.Kc)}`}
                    />
                  </section>
                </>
              )}
            </Pagina>
            <Pagina
              resolucao={resolucao}
              pagina={primeiraPagina + 1}
              total={total}
            >
              <section>
                <h3>4. Escrever o controlador final</h3>
                {r.tipo === "classico" ? (
                  <>
                    <Formula
                      latex={`G_c(s)=K_c\\frac{(s+z)${zeros === 2 ? "^2" : ""}}{${integral ? "s" : "1"}}=${tf(r.Gc)}`}
                    />
                    <Formula
                      latex={`K_p=${n(r.Kp)},\\qquad K_i=${n(r.Ki)},\\qquad K_d=${n(r.Kd)}`}
                    />
                  </>
                ) : r.tipo === "personalizado" ? <Formula latex={`G_c(s)=${tf(r.Gc)}`} /> : (
                  <Formula
                    latex={`G_c(s)=${tf(r.Gc)},\\quad a=${n(r.a)},\\quad b=${n(r.b)}`}
                  />
                )}
                {r.tipo !== "classico" &&
                  r.avisos.map((aviso) => <p key={aviso}>{aviso}</p>)}
              </section>
              <section>
                <h3>5. Fechar a malha e verificar os polos</h3>
                <Formula latex={"T(s)=\\frac{Y(s)}{R(s)}=\\frac{G_c(s)G(s)}{1+G_c(s)G(s)H(s)}"} />
                <div className="tf-impressa">
                  <Formula
                    latex={`T(s)=${resolucao.id === "q3" ? "\\frac{5(7s+24)(s+1)(s+4)}{(s+3)(s^2+8s+32)}" : tf(normalizada)}`}
                  />
                </div>
                <p>
                  Polos{" "}
                  {resolucao.id === "q3"
                    ? "antes da simplificação"
                    : "de malha fechada"}
                  : {polos}.
                </p>
                {resolucao.id === "q3" && (
                  <p>
                    O fator comum s + 1 se cancela. Restam −4 ± 4j e −3. O polo
                    −3 é mais lento que o par complexo solicitado.
                  </p>
                )}
                <p>
                  {s.status === "ok"
                    ? "Todos os polos têm parte real negativa. A malha é assintoticamente estável."
                    : (s.mensagem ??
                      "A simulação não confirmou a estabilidade.")}
                </p>
              </section>
              <section>
                <h3>6. Conferir o que a questão pede</h3>
                <table className="requisitos-impressos">
                  <thead>
                    <tr>
                      <th scope="col">Requisito</th>
                      <th scope="col">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requisitosImpressao(resolucao).map((criterio) => (
                      <tr key={criterio.descricao}>
                        <th scope="row">{criterio.descricao}</th>
                        <td>
                          {criterio.resultado} ·{" "}
                          <strong>
                            {criterio.atende
                              ? "Atende"
                              : "Não atende / não confirmado"}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {e.modo === "mpTs" &&
                  requisitosImpressao(resolucao).some((c) => !c.atende) && (
                    <p>
                      O projeto não confirmou todos os limites. Ajuste o fator
                      de frequência ou o polo desejado e projete novamente.
                    </p>
                  )}
              </section>
              <section className="resposta-impressa">
                <GraficoImpresso resolucao={resolucao} />
                {s.status === "ok" && (
                  <p>
                    Degrau unitário, estados iniciais nulos. Valor final{" "}
                    {numeroImpresso(s.yss)}; saída em 0⁺ {numeroImpresso(s.y0)}.{" "}
                    {e.modo === "mpTs"
                      ? `A faixa sombreada é de ±${e.faixa}% do valor final; a linha vertical marca a acomodação.`
                      : "A questão fixa os polos, sem exigir ganho estático unitário."}{" "}
                    {s.y0 !== 0 &&
                      "O salto inicial decorre do termo direto de T(s)."}
                  </p>
                )}
                <p className="amostragem-impressa">
                  Simulação de 0 a 20 s; amostragem de 0,005 s. Valores exibidos
                  com arredondamento.
                </p>
              </section>
            </Pagina>
            {resolucao.discretizacao?.calculo && Array.from({ length: Math.ceil(resolucao.discretizacao.calculo.resultado.memoria.termos.length / 8) }, (_, parte) => <Pagina key={`memoria-${parte}`} resolucao={resolucao} pagina={primeiraPagina + 2 + parte} total={total}>
              <section><MemoriaDiscretizacao d={resolucao.discretizacao!.calculo!.resultado} inicio={parte * 8} fim={Math.min((parte + 1) * 8, resolucao.discretizacao!.calculo!.resultado.memoria.termos.length)} /></section>
            </Pagina>)}
            {resolucao.discretizacao && (
              <Pagina
                resolucao={resolucao}
                pagina={primeiraPagina + quantidadePaginas(resolucao) - 1}
                total={total}
              >
                <DiscretizacaoImpressa
                  discretizacao={resolucao.discretizacao}
                />
              </Pagina>
            )}
          </div>
        );
      })}
    </section>
  );
}

function DiscretizacaoImpressa({
  discretizacao: d,
}: {
  discretizacao: NonNullable<ResolucaoImpressao["discretizacao"]>;
}) {
  const c = d.configuracao,
    p = d.calculo;
  const metodo = METODOS_DISCRETOS[c.metodo];
  return (
    <>
      <section>
        <h3>7. Discretizar a função pedida</h3>
        <p>
          Função selecionada:{" "}
          {c.alvo === "Gc"
            ? "controlador Gc(s)"
            : "malha aberta completa Gc(s)G(s)H(s)"}
          . Método: {metodo?.nome ?? "inválido"}. Período de amostragem:{" "}
          {numeroImpresso(c.periodo)} s.
        </p>
        <Formula
          latex={`s\\leftarrow ${metodo?.substituicao ?? "\\text{método inválido}"},\\qquad T=${n(c.periodo)}\\,\\mathrm{s}`}
        />
        {d.erro && <p>Discretização não confirmada: {d.erro}</p>}
        {p && (
          <>
            <div className="tf-impressa">
              <Formula latex={`F(s)=${tf(p.continua)}`} />
            </div>
            <p>
              Substituímos s em todas as potências do numerador e denominador,
              eliminamos os denominadores comuns e normalizamos pelo primeiro
              coeficiente do denominador.
            </p>
            <div className="tf-impressa">
              <Formula
                latex={`${c.alvo === "Gc" ? "G_c" : "L"}(z)=${tf(p.resultado, "z")}`}
              />
            </div>
            <p>Coeficientes em ordem decrescente de potência de z.</p>
            <p className="mono">
              Numerador:{" "}
              {p.resultado.num.map((v) => numeroImpresso(v)).join("; ")}
            </p>
            <p className="mono">
              Denominador:{" "}
              {p.resultado.den.map((v) => numeroImpresso(v)).join("; ")}
            </p>
          </>
        )}
      </section>
      {p && (
        <>
          <section>
            <h3>8. Equação de diferenças e causalidade</h3>
            <p>
              e[k] é a entrada da função selecionada e u[k] é a saída. Dividindo
              a função em z pela maior potência do denominador e voltando ao
              domínio das amostras:
            </p>
            <div className="equacao-discreta-impressa">
              <Formula latex={equacaoDiferencas(p.resultado, true)} />
            </div>
            <p>
              {p.resultado.causal
                ? "A equação é causal, sem amostras futuras da entrada."
                : `A equação exige ${p.resultado.avanco} amostra(s) futura(s) da entrada e não é causal.`}
            </p>
          </section>
          <section>
            <h3>9. Verificar os polos discretos</h3>
            <p>
              Polos da função selecionada:{" "}
              {p.polos.length
                ? p.polos
                    .map(
                      (polo) =>
                        `${numeroImpresso(polo.re)}${Math.abs(polo.im) < 1e-8 ? "" : ` ${polo.im > 0 ? "+" : "−"} ${numeroImpresso(Math.abs(polo.im))}j`}`,
                    )
                    .join("; ")
                : "não possui polos"}
              .
            </p>
            <p>
              {p.estabilidade === "estavel"
                ? "Todos os polos estão dentro do círculo unitário. A função discretizada é assintoticamente estável."
                : p.estabilidade === "instavel"
                  ? "Há polos fora do círculo unitário. A função discretizada não é assintoticamente estável."
                  : "Há polos sobre o círculo unitário, dentro da tolerância numérica. A função discretizada não é assintoticamente estável."}
            </p>
            <p>
              A estabilidade aqui é da função discretizada selecionada, sem
              fechar uma malha digital. Uma aproximação de uma função contínua
              estável pode ter polos fora do círculo unitário, dependendo do
              método e do período.
            </p>
          </section>
        </>
      )}
    </>
  );
}
