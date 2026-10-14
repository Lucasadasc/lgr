import { describe, expect, it } from "vitest";
import { projetarControlador, type EntradaProjeto } from "./index";
import { EXERCICIOS_LISTA2 } from "./exemplos";
import { discretizar, discretizarProjeto } from "./discretizacao";
import { simularDegrau } from "./simulacao";
import {
  criarResolucaoImpressao,
  quantidadePaginas,
  requisitosImpressao,
  resolverListaParaEntrega,
} from "./impressao";

const primeiraOrdem = (
  ganho = 1,
  re = -2,
  im = 3,
): EntradaProjeto<"primeiraOrdem"> => ({
  G: { num: [ganho], den: [1, 1] },
  H: { num: [1], den: [1] },
  topologia: "primeiraOrdem",
  especificacao: { modo: "polo", re, im },
});

describe("controlador a/(s+b) e variações", () => {
  it("encontra a e b da lista 2 e verifica todos os polos", () => {
    const r = projetarControlador(EXERCICIOS_LISTA2[1].entrada);
    expect(r.tipo).toBe("primeiraOrdem");
    if (r.tipo !== "primeiraOrdem") throw new Error("Tipo incorreto");
    // Solução racional independente, obtida da equação característica.
    expect(r.a).toBeCloseTo(7995 / 2104, 11);
    expect(r.b).toBeCloseTo(738 / 263, 11);
    expect(r.erroPolo).toBeLessThan(1e-10);
    expect(r.residuo).toBeLessThan(1e-13);
    expect(r.erroAngulo).toBeLessThan(1e-10);
    expect(r.erroModulo).toBeLessThan(1e-12);
    expect(r.polos).toHaveLength(4);
    expect(r.polos.some((p) => Math.abs(p.re + 1.5015803301634) < 1e-10)).toBe(
      true,
    );
    expect(r.Gc).toEqual({ num: [r.a], den: [1, r.b] });
  });
  it.each([1, 2, -1])(
    "resolve planta com ganho %s pela solução quadrática independente",
    (ganho) => {
      const r = projetarControlador(primeiraOrdem(ganho));
      expect(r.a).toBeCloseTo(10 / ganho, 12);
      expect(r.b).toBeCloseTo(3, 12);
      expect(r.fechada.den).toEqual([1, 4, 13]);
      expect(r.erroPolo).toBeLessThan(1e-10);
      if (ganho < 0) expect(r.avisos.join(" ")).toContain("ganho a negativo");
    },
  );
  it("normaliza o conjugado inferior e não exige controlador isolado estável", () => {
    const r = projetarControlador(primeiraOrdem(1, -0.25, -1));
    expect(r.sd.im).toBe(1);
    expect(r.a).toBeCloseTo(1.5625);
    expect(r.b).toBeCloseTo(-0.5);
    expect(r.avisos.join(" ")).toContain("controlador isolado");
    expect(simularDegrau(r.fechada).status).toBe("ok");
  });
  it("também aceita especificação por ζ e ωn", () => {
    const r = projetarControlador({
      ...primeiraOrdem(),
      especificacao: { modo: "zetaWn", zeta: 0.5, wn: 2 },
    });
    expect(r.a).toBeCloseTo(3);
    expect(r.b).toBeCloseTo(1);
    expect(r.fechada.den).toEqual([1, 2, expect.closeTo(4, 12)]);
  });
  it("rejeita parte imaginária singular e coincidência com zero da planta", () => {
    expect(() =>
      projetarControlador({ ...primeiraOrdem(), G: { num: [1], den: [1] } }),
    ).toThrow(/parte imaginária/);
    expect(() =>
      projetarControlador({
        ...primeiraOrdem(),
        G: { num: [1, 2, 2], den: [1, 3] },
        especificacao: { modo: "polo", re: -1, im: 1 },
      }),
    ).toThrow(/coincide/);
  });
  it("mantém a especificação projetada quando a entrada original é editada", () => {
    const entrada = primeiraOrdem();
    const r = projetarControlador(entrada);
    if (entrada.especificacao.modo !== "polo")
      throw new Error("Modo incorreto");
    entrada.especificacao.re = -3;
    entrada.especificacao.im = 4;
    entrada.G.num[0] = 9;
    expect(r.entrada.G.num).toEqual([1]);
    expect(r.entrada.especificacao).toEqual({ modo: "polo", re: -2, im: 3 });
  });
});

describe("discretizações e impressão da lista 2", () => {
  it("confere o PID inicial e não aprova os limites pela aproximação", () => {
    const lista = resolverListaParaEntrega("lista2"),
      q = lista[0];
    expect(lista.map((r) => r.id)).toEqual(["lista2-q1", "lista2-q2"]);
    expect(q.resposta.y0).toBeCloseTo(2.695208880863256, 10);
    expect(q.resposta.mp).toBeCloseTo(169.5208880863256, 8);
    expect(q.resposta.ts5).toBeCloseTo(3.245, 6);
    expect(requisitosImpressao(q).map((c) => c.atende)).toEqual([
      false,
      false,
      true,
    ]);
    expect(q.discretizacao!.calculo!.resultado.num).toEqual(
      expect.arrayContaining([
        expect.closeTo(2.93191024699787, 10),
        expect.closeTo(0.8352268820672064, 10),
        expect.closeTo(0.05948373975994148, 10),
      ]),
    );
    expect(q.discretizacao!.calculo!.resultado.den).toEqual([1, 0, -1]);
    expect(q.discretizacao!.calculo!.estabilidade).toBe("marginal");
  });
  it("discretiza toda a malha por Euler forward e identifica polos instáveis", () => {
    const q = resolverListaParaEntrega("lista2")[1],
      d = q.discretizacao!.calculo!;
    expect(requisitosImpressao(q).every((c) => c.atende)).toBe(true);
    expect(d.configuracao).toEqual({
      metodo: "forward",
      alvo: "malha",
      periodo: 1,
    });
    expect(d.resultado.num[0]).toBeCloseTo(7.59980988593156, 10);
    expect(d.resultado.num[1]).toBeCloseTo(15.19961977186312, 10);
    expect(d.resultado.den).toEqual(
      expect.arrayContaining([
        expect.closeTo(5.806083650190114, 10),
        expect.closeTo(8.224334600760457, 10),
        expect.closeTo(7.224334600760457, 10),
      ]),
    );
    expect(d.estabilidade).toBe("instavel");
    expect(d.polos.some((p) => Math.abs(p.re + 4) < 1e-10)).toBe(true);
  });
  it("imprime a configuração atual, incluindo alterações de método, alvo e período", () => {
    const r = projetarControlador(EXERCICIOS_LISTA2[1].entrada);
    const c = {
      metodo: "backward" as const,
      alvo: "Gc" as const,
      periodo: 0.5,
    };
    const q = criarResolucaoImpressao(r, "lista2-q2", c);
    expect(q.lista).toBe("lista2");
    expect(q.discretizacao!.calculo!.resultado).toEqual(
      discretizar(r.Gc, 0.5, "backward"),
    );
    expect(q.enunciado).toContain("Euler backward, com T = 0,5 s");
    expect(quantidadePaginas(q)).toBe(4);
    c.periodo = 9;
    expect(q.discretizacao!.configuracao.periodo).toBe(0.5);
  });
  it("identifica variações de planta como projeto manual", () => {
    const q = criarResolucaoImpressao(
      projetarControlador(primeiraOrdem()),
      "lista2-q2",
    );
    expect(q.id).toBe("manual");
    expect(q.lista).toBeUndefined();
    expect(q.titulo).toContain("a/(s+b)");
  });
  it("registra erros de discretização sem usar um resultado anterior", () => {
    const q = criarResolucaoImpressao(
      projetarControlador(primeiraOrdem()),
      undefined,
      { metodo: "tustin", alvo: "Gc", periodo: 0 },
    );
    expect(q.discretizacao!.erro).toContain("positivo");
    expect(q.discretizacao!.calculo).toBeUndefined();
    expect(() =>
      discretizarProjeto(q.projeto, {
        metodo: "forward",
        alvo: "malha",
        periodo: NaN,
      }),
    ).toThrow();
  });
});
