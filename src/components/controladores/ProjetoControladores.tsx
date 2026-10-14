import { analisarModeloPersonalizado, type ConfiguracaoPersonalizada } from "../../lib/controladores/personalizado";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MathView } from "../MathView";
import { tfLatex } from "../../lib/controladores/formatacao";
import { produtoTf, validarTf } from "../../lib/controladores";
import { flushSync } from "react-dom";
import { parsePolynomialInput } from "../../math/parser";
import type { TransferFunctionInput } from "../../types/lgr";
import { analisarCoeficientes } from "../../lib/lgr";
import {
  projetarControlador,
  type Especificacao,
  type ResultadoProjeto,
  type Topologia,
} from "../../lib/controladores";
import {
  LISTAS_CONTROLADORES,
  TODOS_EXERCICIOS_CONTROLADORES,
  type ListaControladores,
} from "../../lib/controladores/exemplos";
import {
  DISCRETIZACAO_INICIAL,
  configuracaoDiscreta,
  type DadosDiscretizacao,
} from "./dadosDiscretizacao";
import ResultadoControlador from "./ResultadoControlador";
import RelatorioImpressao from "./RelatorioImpressao";
import {
  criarResolucaoImpressao,
  resolverListaParaEntrega,
  type ResolucaoImpressao,
} from "../../lib/controladores/impressao";

const vazio = {
  numG: "",
  denG: "",
  numH: "1",
  denH: "1",
  topologia: "PD" as Topologia,
  operacao: "informar" as ConfiguracaoPersonalizada["modo"],
  numC: "1",
  denC: "1; 1",
  modo: "mpTs" as Especificacao["modo"],
  mp: "10",
  ts: "4",
  faixa: "5",
  margem: "1",
  zeta: "0.7",
  wn: "0.5",
  re: "-4",
  im: "4",
};
type Dados = typeof vazio;
type CampoNumero = "mp" | "ts" | "margem" | "zeta" | "wn" | "re" | "im";
function coeficientes(texto: string, nome: string) {
  const c = analisarCoeficientes(texto);
  if (!c || c.some((v) => !Number.isFinite(v)))
    throw new Error(
      `${nome}: informe coeficientes finitos separados por espaço. Use ponto para decimais.`,
    );
  return c;
}
export default function ProjetoControladores({ ativo, planta, aoAplicar }: {
  ativo: boolean;
  planta: TransferFunctionInput;
  aoAplicar: (resultado: ResultadoProjeto) => void;
}) {
  const [dados, setDados] = useState<Dados>({ ...vazio, numG: '4 16', denG: '1 4 4 0' });
  const previews = useMemo(() => {
    const read = (num: string, den: string) => {
      try {
        if (!num.trim() || !den.trim()) return { tf: null, error: 'Preencha numerador e denominador para visualizar.' };
        return { tf: validarTf({ num: coeficientes(num, 'Numerador'), den: coeficientes(den, 'Denominador') }), error: null };
      } catch (error) {
        return { tf: null, error: error instanceof Error ? error.message : 'Confira os coeficientes.' };
      }
    };
    const G = read(dados.numG, dados.denG);
    const H = read(dados.numH, dados.denH);
    return { G, H, GH: G.tf && H.tf ? produtoTf(G.tf, H.tf) : null };
  }, [dados.numG, dados.denG, dados.numH, dados.denH]);
  const [lista, setLista] = useState<ListaControladores>("lista1");
  const exemplos = LISTAS_CONTROLADORES.find((l) => l.id === lista)!.exercicios;
  const [discretizacao, setDiscretizacao] = useState<DadosDiscretizacao>(
    DISCRETIZACAO_INICIAL,
  );
  const [exercicio, setExercicio] = useState("");
  const [completa, setCompleta] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProjeto | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [preparandoImpressao, setPreparandoImpressao] = useState(false);
  const [erroImpressao, setErroImpressao] = useState<string | null>(null);
  const [impressao, setImpressao] = useState<ResolucaoImpressao[] | null>(null);
  const atual = useMemo(() => {
    if (!resultado) return [];
    try {
      return [
        criarResolucaoImpressao(
          resultado,
          exercicio,
          discretizacao.incluir
            ? configuracaoDiscreta(discretizacao)
            : undefined,
        ),
      ];
    } catch {
      return [];
    }
  }, [resultado, exercicio, discretizacao]);
  useEffect(() => {
    const restaurar = () => setImpressao(null);
    window.addEventListener("afterprint", restaurar);
    return () => window.removeEventListener("afterprint", restaurar);
  }, []);
  async function imprimir(completa: boolean) {
    setPreparandoImpressao(true);
    setErroImpressao(null);
    try {
      const resolucoes = completa ? resolverListaParaEntrega(lista) : atual;
      if (!resolucoes.length)
        throw new Error("Projete o controlador antes de imprimir a resolução.");
      // Monta o documento antes de abrir o diálogo. KaTeX e fontes devem
      // terminar de carregar mesmo quando a lista ainda não estava na tela.
      await import("katex");
      flushSync(() => setImpressao(resolucoes));
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      if (document.fonts) {
        await Promise.all(
          ["KaTeX_Main", "KaTeX_Math", "KaTeX_Size1", "KaTeX_Size2"].map(
            (familia) => document.fonts.load(`12px ${familia}`),
          ),
        );
        await document.fonts.ready;
      }
      window.print();
    } catch (e) {
      setImpressao(null);
      setErroImpressao(
        e instanceof Error
          ? e.message
          : "Não foi possível preparar a impressão.",
      );
    } finally {
      setPreparandoImpressao(false);
    }
  }
  function editar<K extends keyof Dados>(campo: K, valor: Dados[K]) {
    setDados((a) => ({ ...a, [campo]: valor }));
    setResultado(null);
    setErro(null);
    setExercicio("");
  }
  function selecionar(id: string) {
    setExercicio(id);
    setResultado(null);
    setErro(null);
    const ex = TODOS_EXERCICIOS_CONTROLADORES.find((e) => e.id === id);
    setDiscretizacao(
      ex?.discretizacao
        ? {
            ...ex.discretizacao,
            periodo: String(ex.discretizacao.periodo),
            incluir: true,
          }
        : DISCRETIZACAO_INICIAL,
    );
    if (!ex) {
      setDados(vazio);
      return;
    }
    const e = ex.entrada,
      s = e.especificacao;
    setDados({
      ...vazio,
      numG: e.G.num.join(" "),
      denG: e.G.den.join(" "),
      numH: e.H.num.join(" "),
      denH: e.H.den.join(" "),
      topologia: e.topologia,
      modo: s.modo,
      ...(s.modo === "mpTs"
        ? {
            mp: String(s.mp),
            ts: String(s.ts),
            faixa: String(s.faixa),
            margem: String(s.margem),
          }
        : s.modo === "zetaWn"
          ? { zeta: String(s.zeta), wn: String(s.wn) }
          : { re: String(s.re), im: String(s.im) }),
    });
  }
  function projetar(e: FormEvent) {
    e.preventDefault();
    try {
      const especificacao: Especificacao =
        dados.modo === "mpTs"
          ? {
              modo: "mpTs",
              mp: Number(dados.mp),
              ts: Number(dados.ts),
              faixa: Number(dados.faixa) as 2 | 5,
              margem: Number(dados.margem),
            }
          : dados.modo === "zetaWn"
            ? { modo: "zetaWn", zeta: Number(dados.zeta), wn: Number(dados.wn) }
            : { modo: "polo", re: Number(dados.re), im: Number(dados.im) };
      setResultado(
        projetarControlador({
          G: {
            num: coeficientes(dados.numG, "Numerador G"),
            den: coeficientes(dados.denG, "Denominador G"),
          },
          H: {
            num: coeficientes(dados.numH, "Numerador H"),
            den: coeficientes(dados.denH, "Denominador H"),
          },
          topologia: dados.topologia,
          personalizado: dados.topologia === "personalizado" ? { modo: dados.operacao, numerador: dados.numC, denominador: dados.denC } : undefined,
          especificacao,
        }),
      );
      setErro(null);
    } catch (e) {
      setResultado(null);
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível projetar o controlador.",
      );
    }
  }
  const numero = (
    campo: CampoNumero,
    label: string,
    min?: string,
    max?: string,
  ) => (
    <label>
      {label}
      <input className="form-input"
        type="number"
        step="any"
        min={min}
        max={max}
        required
        value={dados[campo]}
        onChange={(e) => editar(campo, e.target.value)}
      />
    </label>
  );
  return (
    <div
      hidden={!ativo}
      id="painel-controladores"
      aria-labelledby="nav-controladores"
    >
      <div className="conteudo-controladores">
        <h2>Projeto de controladores pelo LGR</h2>
        <p className="ajuda">
          Defina G(s), H(s) e o desempenho desejado. Projete PD, PI, PID, a/(s+b) ou um controlador personalizado, confira a resposta completa e discretize o resultado.
        </p>
        <button type="button" className="btn btn-secondary no-print" onClick={() => {
          try {
            setDados((a) => ({ ...a,
              numG: parsePolynomialInput(planta.gNum).coeffs.join(' '),
              denG: parsePolynomialInput(planta.gDen).coeffs.join(' '),
              numH: parsePolynomialInput(planta.hNum).coeffs.join(' '),
              denH: parsePolynomialInput(planta.hDen).coeffs.join(' '),
            }));
            setExercicio(''); setResultado(null); setErro(null);
          } catch { setErro('Não foi possível importar a planta. Confira os coeficientes na primeira unidade.'); }
        }}>Usar planta da 1ª unidade</button>
        <form className="glass-card input-section no-print formulario-projeto" onSubmit={projetar}>
          <label>
            Lista
            <select className="form-input"
              value={lista}
              onChange={(e) => {
                setLista(e.target.value as ListaControladores);
                selecionar("");
              }}
            >
              {LISTAS_CONTROLADORES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.titulo}
                </option>
              ))}
            </select>
          </label>
          <label>
            Exercício
            <select className="form-input"
              value={exercicio}
              onChange={(e) => selecionar(e.target.value)}
            >
              <option value="">Entrada manual</option>
              {exemplos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.titulo}
                </option>
              ))}
            </select>
          </label>
          {exercicio && (
            <p className="ajuda">
              {exemplos.find((e) => e.id === exercicio)?.enunciado} Os campos
              podem ser alterados.
            </p>
          )}
          <fieldset>
            <legend>Planta e realimentação</legend>
            <p className="ajuda">
              Coeficientes em ordem decrescente de potência. Exemplo: 1 4 4 0
              representa s³ + 4s² + 4s. Use ponto para decimais.
            </p>
            <div className="grid2">
              {(["numG", "denG", "numH", "denH"] as const).map((campo, i) => (
                <label key={campo}>
                  {
                    [
                      "Numerador G(s)",
                      "Denominador G(s)",
                      "Numerador H(s)",
                      "Denominador H(s)",
                    ][i]
                  }
                  <input className="form-input"
                    type="text"
                    required
                    value={dados[campo]}
                    onChange={(e) => editar(campo, e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
              ))}
            </div>
            <div className="transfer-preview" aria-label="Prévia das funções de transferência">
              {(['G', 'H'] as const).map(name => (
                <div key={name}>
                  {previews[name].tf
                    ? <MathView math={`${name}(s) = ${tfLatex(previews[name].tf!)}`} />
                    : <p className="ajuda">{name}(s): {previews[name].error}</p>}
                </div>
              ))}
              {previews.GH && <div className="transfer-preview-product"><MathView math={`G(s)H(s) = ${tfLatex(previews.GH)}`} /></div>}
            </div>
          </fieldset>
          <label>
            Controlador
            <select className="form-input"
              value={dados.topologia}
              onChange={(e) => editar("topologia", e.target.value as Topologia)}
            >
              <option value="PD">PD · Kc(s + z)</option>
              <option value="PI">PI · Kc(s + z)/s</option>
              <option value="PID">PID · Kc(s + z)²/s, zeros iguais</option>
              <option value="personalizado">Personalizado · coeficientes livres</option>
              <option value="primeiraOrdem">Primeira ordem · a/(s + b)</option>
            </select>
          </label>
          {dados.topologia === 'personalizado' && <fieldset>
            <legend>Controlador personalizado Gc(s)</legend>
            <label>Operação<select className="form-input" value={dados.operacao} onChange={e => editar('operacao', e.target.value as ConfiguracaoPersonalizada['modo'])}>
              <option value="informar">Informar Gc(s)</option>
              <option value="sintetizar">Calcular parâmetros a partir do polo</option>
            </select></label>
            <p className="ajuda">Separe os coeficientes por ponto e vírgula, em ordem decrescente. A síntese aceita um ou dois parâmetros reais em expressões afins: a; 2*b+1. Produtos entre parâmetros não são suportados.</p>
            <div className="grid2">
              <label>Numerador Gc(s)<input className="form-input" required value={dados.numC} onChange={e => editar('numC', e.target.value)} /></label>
              <label>Denominador Gc(s)<input className="form-input" required value={dados.denC} onChange={e => editar('denC', e.target.value)} /></label>
            </div>
            <div className="transfer-preview" aria-label="Prévia do controlador personalizado">
              {(() => { try { return <MathView math={`G_c(s)=${analisarModeloPersonalizado({ modo: dados.operacao, numerador: dados.numC, denominador: dados.denC }).latex}`} />; } catch (e) { return <p className="ajuda">{e instanceof Error ? e.message : 'Confira os coeficientes.'}</p>; } })()}
            </div>
          </fieldset>}
          <fieldset>
            <legend>Especificações de desempenho</legend>
            <label>
              Forma de especificação
              <select className="form-input"
                value={dados.modo}
                onChange={(e) =>
                  editar("modo", e.target.value as Especificacao["modo"])
                }
              >
                <option value="mpTs">Mp e tempo de acomodação</option>
                <option value="zetaWn">ζ e ωn</option>
                <option value="polo">Polo desejado</option>
              </select>
            </label>
            <div className="grid2">
              {dados.modo === "mpTs" && (
                <>
                  {numero("mp", "Mp máximo em %", "0", "100")}
                  {numero("ts", "Tempo de acomodação inferior a, em s", "0")}
                  <label>
                    Faixa de acomodação
                    <select className="form-input"
                      value={dados.faixa}
                      onChange={(e) => editar("faixa", e.target.value)}
                    >
                      <option value="5">5%</option>
                      <option value="2">2%</option>
                    </select>
                  </label>
                  {numero("margem", "Fator de frequência ωn / ωn mínimo", "1")}
                </>
              )}
              {dados.modo === "zetaWn" && (
                <>
                  {numero("zeta", "Fator de amortecimento ζ", "0", "1")}
                  {numero("wn", "Frequência natural ωn em rad/s", "0")}
                </>
              )}
              {dados.modo === "polo" && (
                <>
                  {numero("re", "Parte real do polo desejado", undefined, "0")}
                  {numero("im", "Parte imaginária do polo desejado")}
                </>
              )}
            </div>
            {dados.modo === "mpTs" && (
              <p className="ajuda">
                O fator 1 usa o mínimo da aproximação de segunda ordem.
                Aumente-o manualmente e confira novamente o desempenho.
              </p>
            )}
          </fieldset>
          <button className="btn btn-primary" type="submit">
            Projetar controlador
          </button>
          {erro && (
            <p className="badge-warn" role="alert">
              {erro}
            </p>
          )}
        </form>
        <div className="visualizacao-projeto no-print">
          <label>
            Detalhamento da resolução
            <select className="form-input"
              value={completa ? "completa" : "essenciais"}
              onChange={(e) => setCompleta(e.target.value === "completa")}
            >
              <option value="essenciais">Passos essenciais</option>
              <option value="completa">Memória completa</option>
            </select>
          </label>
        </div>
        <div className="no-print impressao-lista">
          <button className="btn btn-secondary"
            type="button"
            disabled={preparandoImpressao}
            onClick={() => void imprimir(true)}
          >
            {preparandoImpressao
              ? "Preparando impressão…"
              : "Imprimir lista completa / salvar PDF"}
          </button>
          <p className="ajuda">
            {lista === "lista1"
              ? "As quatro questões da primeira lista. A questão 1 inclui o ajuste do fator de frequência para 1,10."
              : "As duas questões da segunda lista, com Tustin e Euler forward, memória algébrica e requisitos verificados no documento."}
          </p>
        </div>
        {erroImpressao && (
          <p className="badge-warn no-print" role="alert">
            {erroImpressao}
          </p>
        )}
        {resultado && <button type="button" className="btn btn-secondary no-print" onClick={() => aoAplicar(resultado)}>Analisar planta compensada nos 10 passos da 1ª unidade</button>}
        {resultado ? (
          <ResultadoControlador
            key={JSON.stringify(resultado.entrada)}
            r={resultado}
            completa={completa}
            ativo={ativo}
            aoImprimir={() => void imprimir(false)}
            preparandoImpressao={preparandoImpressao}
            discretizacao={discretizacao}
            aoEditarDiscretizacao={setDiscretizacao}
          />
        ) : (
          <p className="ajuda">
            Selecione um exercício ou preencha os dados e clique em Projetar
            controlador.
          </p>
        )}
      </div>
      <RelatorioImpressao resolucoes={impressao ?? atual} />
    </div>
  );
}
