import { projetarControlador, type ResultadoProjeto } from "./index";
import {
  LISTAS_CONTROLADORES,
  TODOS_EXERCICIOS_CONTROLADORES,
  type ListaControladores,
} from "./exemplos";
import {
  discretizarProjeto,
  type ConfiguracaoDiscreta,
  type DiscretizacaoProjeto,
} from "./discretizacao";
import { METODOS_DISCRETOS } from "./formatacao";
import { simularDegrau, type RespostaDegrau } from "./simulacao";

export interface ResolucaoImpressao {
  id: string;
  titulo: string;
  enunciado: string;
  projeto: ResultadoProjeto;
  resposta: RespostaDegrau;
  inicial?: { projeto: ResultadoProjeto; resposta: RespostaDegrau };
  lista?: ListaControladores;
  discretizacao?: {
    configuracao: ConfiguracaoDiscreta;
    calculo?: DiscretizacaoProjeto;
    erro?: string;
  };
}
export interface RequisitoImpressao {
  descricao: string;
  resultado: string;
  atende: boolean;
}
export const numeroImpresso = (x: number | null, unidade = "") =>
  x === null || !Number.isFinite(x)
    ? "Não confirmado"
    : `${new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits: 6,
      }).format(x)}${unidade}`;

export function criarResolucaoImpressao(
  projeto: ResultadoProjeto,
  exercicioId?: string,
  configuracao?: ConfiguracaoDiscreta,
): ResolucaoImpressao {
  const entrada = projeto.entrada;
  const esp = entrada.especificacao;
  const exemplo = TODOS_EXERCICIOS_CONTROLADORES.find((e) => {
    const esperado = structuredClone(e.entrada);
    const atual = structuredClone(entrada);
    if (atual.especificacao.modo === "mpTs") atual.especificacao.margem = 1;
    return (
      e.id === exercicioId && JSON.stringify(esperado) === JSON.stringify(atual)
    );
  });
  const pedido =
    esp.modo === "mpTs"
      ? `Mp ≤ ${numeroImpresso(esp.mp)}% e tempo de acomodação, na faixa de ${esp.faixa}%, inferior a ${numeroImpresso(esp.ts)} s`
      : esp.modo === "zetaWn"
        ? `fator de amortecimento ζ = ${numeroImpresso(esp.zeta)} e frequência natural ωn = ${numeroImpresso(esp.wn)} rad/s`
        : `o par de polos de malha fechada em ${numeroImpresso(esp.re)} ± ${numeroImpresso(Math.abs(esp.im))}j`;
  const nomeControlador =
    entrada.topologia === "primeiraOrdem"
      ? "Gc(s) = a/(s+b)"
      : entrada.topologia;
  let discreta: ResolucaoImpressao["discretizacao"];
  if (configuracao) {
    const copia = { ...configuracao };
    try {
      discreta = {
        configuracao: copia,
        calculo: discretizarProjeto(projeto, copia),
      };
    } catch (e) {
      discreta = {
        configuracao: copia,
        erro: e instanceof Error ? e.message : "Não foi possível discretizar.",
      };
    }
  }
  const pedidoDiscreto = configuracao
    ? ` Discretizar ${configuracao.alvo === "Gc" ? "o controlador" : "a malha aberta Gc(s)G(s)H(s)"} por ${METODOS_DISCRETOS[configuracao.metodo]?.nome ?? "método inválido"}, com T = ${numeroImpresso(configuracao.periodo)} s.`
    : "";
  return {
    id: exemplo?.id ?? "manual",
    titulo: exemplo?.titulo ?? `Projeto manual · ${nomeControlador}`,
    enunciado: `Projetar ${nomeControlador}${entrada.topologia === "PID" ? " com zeros reais e iguais" : ""} para ${pedido}.${pedidoDiscreto}`,
    projeto,
    lista: exemplo
      ? LISTAS_CONTROLADORES.find((l) =>
          l.exercicios.some((e) => e.id === exemplo.id),
        )?.id
      : undefined,
    discretizacao: discreta,
    resposta: simularDegrau(projeto.fechada, 20),
  };
}

// Compartilhado pela impressão no navegador e pelo gerador das entregas.
export function resolverListaParaEntrega(
  lista: ListaControladores = "lista1",
): ResolucaoImpressao[] {
  const encontrada = LISTAS_CONTROLADORES.find((l) => l.id === lista);
  if (!encontrada) throw new Error("Escolha a primeira ou a segunda lista.");
  return encontrada.exercicios.map((exercicio, i) => {
    const entrada = structuredClone(exercicio.entrada);
    let inicial: ResolucaoImpressao["inicial"];
    if (
      lista === "lista1" &&
      i === 0 &&
      entrada.especificacao.modo === "mpTs"
    ) {
      const projeto = projetarControlador(structuredClone(entrada));
      inicial = { projeto, resposta: simularDegrau(projeto.fechada, 20) };
      entrada.especificacao.margem = 1.1;
    }
    return {
      ...criarResolucaoImpressao(
        projetarControlador(entrada),
        exercicio.id,
        exercicio.discretizacao,
      ),
      inicial,
    };
  });
}

export function requisitosImpressao({
  projeto: p,
  resposta: s,
}: ResolucaoImpressao): RequisitoImpressao[] {
  const e = p.entrada.especificacao;
  const perto = (a: number, b: number) =>
    Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
  const polo = p.polos.length ? p.polos.reduce((a, b) =>
    Math.hypot(a.re - p.sd.re, a.im - p.sd.im) <=
    Math.hypot(b.re - p.sd.re, b.im - p.sd.im)
      ? a
      : b,
  ) : { re: NaN, im: NaN };
  const wn = Math.hypot(polo.re, polo.im);
  const criterios: RequisitoImpressao[] =
    e.modo === "mpTs"
      ? [
          {
            descricao: `Sobressinal ≤ ${numeroImpresso(e.mp)}%`,
            resultado: numeroImpresso(s.mp, "%"),
            atende: s.status === "ok" && s.mp !== null && s.mp <= e.mp,
          },
          {
            descricao: `Acomodação de ${e.faixa}% < ${numeroImpresso(e.ts)} s`,
            resultado: numeroImpresso(e.faixa === 2 ? s.ts2 : s.ts5, " s"),
            atende:
              s.status === "ok" &&
              (e.faixa === 2 ? s.ts2 : s.ts5) !== null &&
              (e.faixa === 2 ? s.ts2! : s.ts5!) < e.ts,
          },
        ]
      : e.modo === "zetaWn"
        ? [
            {
              descricao: `Fator de amortecimento ζ = ${numeroImpresso(e.zeta)}`,
              resultado: numeroImpresso(-polo.re / wn),
              atende: perto(-polo.re / wn, e.zeta),
            },
            {
              descricao: `Frequência natural ωn = ${numeroImpresso(e.wn)} rad/s`,
              resultado: numeroImpresso(wn, " rad/s"),
              atende: perto(wn, e.wn),
            },
          ]
        : [
            {
              descricao: `Par de polos ${numeroImpresso(e.re)} ± ${numeroImpresso(Math.abs(e.im))}j`,
              resultado: `${numeroImpresso(polo.re)} ± ${numeroImpresso(Math.abs(polo.im))}j`,
              atende: [-1, 1].every((sinal) =>
                p.polos.some(
                  (polo) =>
                    perto(polo.re, e.re) &&
                    perto(polo.im, sinal * Math.abs(e.im)),
                ),
              ),
            },
          ];
  if (p.tipo === "classico" && p.entrada.topologia === "PID")
    criterios.push({
      descricao: "Zeros reais e iguais",
      resultado: `${numeroImpresso(-p.z)} · multiplicidade 2`,
      atende: true,
    });
  return criterios;
}

export const quantidadePaginas = (r: ResolucaoImpressao) =>
  2 + (r.discretizacao ? 1 : 0) + (r.discretizacao?.calculo ? Math.ceil(r.discretizacao.calculo.resultado.memoria.termos.length / 8) : 0);
