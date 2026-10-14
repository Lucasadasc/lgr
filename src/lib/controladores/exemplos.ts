import type { EntradaProjeto, Topologia, TopologiaClassica } from "./index";
import type { ConfiguracaoDiscreta } from "./discretizacao";
export type ListaControladores = "lista1" | "lista2";
export interface ExercicioControlador<T extends Topologia = Topologia> {
  id: string;
  titulo: string;
  enunciado: string;
  entrada: EntradaProjeto<T>;
  discretizacao?: ConfiguracaoDiscreta;
}
export const EXERCICIOS_CONTROLADORES: ExercicioControlador<TopologiaClassica>[] =
  [
    {
      id: "q1",
      titulo: "Questão 1 · PD",
      enunciado:
        "Projetar PD para Mp ≤ 10% e tempo de acomodação de 5% inferior a 4 s.",
      entrada: {
        G: { num: [4, 16], den: [1, 4, 4, 0] },
        H: { num: [1], den: [1] },
        topologia: "PD",
        especificacao: { modo: "mpTs", mp: 10, ts: 4, faixa: 5, margem: 1 },
      },
    },
    {
      id: "q2",
      titulo: "Questão 2 · PD",
      enunciado:
        "Projetar PD para ζ = 0,7 e ωn = 0,5 rad/s. A planta original é instável.",
      entrada: {
        G: { num: [1], den: [10000, 0, -11772] },
        H: { num: [1], den: [1] },
        topologia: "PD",
        especificacao: { modo: "zetaWn", zeta: 0.7, wn: 0.5 },
      },
    },
    {
      id: "q3",
      titulo: "Questão 3 · PI",
      enunciado: "Projetar PI para obter polos de malha fechada em −4 ± 4j.",
      entrada: {
        G: { num: [5, 25, 20], den: [1, 4, 4] },
        H: { num: [0.2], den: [1, 1] },
        topologia: "PI",
        especificacao: { modo: "polo", re: -4, im: 4 },
      },
    },
    {
      id: "q4",
      titulo: "Questão 4 · PID",
      enunciado:
        "Projetar PID com zeros reais iguais para Mp ≤ 20% e tempo de acomodação de 2% inferior a 5 s.",
      entrada: {
        G: { num: [5], den: [1, 12, 22, 20] },
        H: { num: [0.4], den: [1] },
        topologia: "PID",
        especificacao: { modo: "mpTs", mp: 20, ts: 5, faixa: 2, margem: 1 },
      },
    },
  ];

export const EXERCICIOS_LISTA2: ExercicioControlador[] = [
  {
    id: "lista2-q1",
    titulo: "Questão 1 · PID e Tustin",
    enunciado:
      "Projetar PID com zeros iguais para Mp ≤ 10% e acomodação de 5% inferior a 3 s. Discretizar o controlador por Tustin, com T = 2 s.",
    entrada: {
      G: { num: [5, 15], den: [1, 4, 0] },
      H: { num: [1], den: [1, 1] },
      topologia: "PID",
      especificacao: { modo: "mpTs", mp: 10, ts: 3, faixa: 5, margem: 1 },
    },
    discretizacao: { alvo: "Gc", metodo: "tustin", periodo: 2 },
  },
  {
    id: "lista2-q2",
    titulo: "Questão 2 · a/(s+b) e Euler",
    enunciado:
      "Projetar Gc(s) = a/(s+b) para polos de malha fechada em −2,5 ± 2j. Discretizar G(s)H(s)Gc(s) por Euler, com T = 1 s. Aqui é adotado Euler forward, s = (z−1)/T; é possível escolher backward.",
    entrada: {
      G: { num: [2, 2], den: [1, 2, 2] },
      H: { num: [1, 3], den: [1, 5] },
      topologia: "primeiraOrdem",
      especificacao: { modo: "polo", re: -2.5, im: 2 },
    },
    discretizacao: { alvo: "malha", metodo: "forward", periodo: 1 },
  },
];
export const LISTAS_CONTROLADORES: {
  id: ListaControladores;
  titulo: string;
  exercicios: ExercicioControlador[];
}[] = [
  {
    id: "lista1",
    titulo: "1º Exercício da 2ª Unidade",
    exercicios: EXERCICIOS_CONTROLADORES,
  },
  {
    id: "lista2",
    titulo: "2º Exercício da 2ª Unidade",
    exercicios: EXERCICIOS_LISTA2,
  },
];
export const TODOS_EXERCICIOS_CONTROLADORES = LISTAS_CONTROLADORES.flatMap(
  (l) => l.exercicios,
);
