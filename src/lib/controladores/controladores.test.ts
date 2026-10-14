import { describe, expect, it } from "vitest";
import {
  projetarControlador,
  converterEspecificacao,
  fecharMalha,
} from "./index";
import { EXERCICIOS_CONTROLADORES } from "./exemplos";
import { discretizar } from "./discretizacao";
import { simularDegrau } from "./simulacao";
import { INDICES_SCIPY, RESPOSTAS_SCIPY } from "./referencias-scipy";

describe("Projeto das quatro questões do PDF de 2026.2", () => {
  const referencias = [
    [8.6598, 0.030458],
    [2.0389, 7000],
    [24 / 7, 7],
    [2.049, 3.136],
  ];
  EXERCICIOS_CONTROLADORES.forEach((ex, i) =>
    it(ex.titulo, () => {
      const r = projetarControlador(ex.entrada);
      expect(r.z).toBeCloseTo(referencias[i][0], 3);
      expect(r.Kc).toBeCloseTo(referencias[i][1], i === 0 ? 5 : 3);
      expect(r.erroPolo).toBeLessThan(1e-7);
      expect(r.residuo).toBeLessThan(1e-12);
      expect(r.erroAngulo).toBeLessThan(1e-8);
      expect(r.erroModulo).toBeLessThan(1e-10);
      if (i === 2) {
        expect(r.Kp).toBeCloseTo(7);
        expect(r.Ki).toBeCloseTo(24);
      }
      if (i === 3) {
        expect(r.Kp).toBeCloseTo(2 * r.Kc * r.z);
        expect(r.Ki).toBeCloseTo(r.Kc * r.z * r.z);
      }
    }),
  );
  it("não declara que a aproximação da questão 1 atende ts < 4", () => {
    const resposta = simularDegrau(
      projetarControlador(EXERCICIOS_CONTROLADORES[0].entrada).fechada,
    );
    expect(resposta.status).toBe("ok");
    expect(resposta.ts5).toBeGreaterThan(4);
    expect(resposta.mp).toBeLessThan(10);
  });
  it("preserva a realimentação não unitária na questão 3", () => {
    const resposta = simularDegrau(
      projetarControlador(EXERCICIOS_CONTROLADORES[2].entrada).fechada,
    );
    expect(resposta.yss).toBeCloseTo(5, 9);
    expect(resposta.y0).toBeCloseTo(35, 9);
    expect(resposta.mp).toBeCloseTo(600, 6);
  });
  it("normaliza o polo conjugado inferior", () => {
    expect(converterEspecificacao({ modo: "polo", re: -4, im: -4 }).sd).toEqual(
      { re: -4, im: 4 },
    );
  });
  it("rejeita entradas e especificações inválidas", () => {
    expect(() =>
      converterEspecificacao({
        modo: "mpTs",
        mp: 0,
        ts: 4,
        faixa: 5,
        margem: 1,
      }),
    ).toThrow();
    expect(() =>
      converterEspecificacao({ modo: "zetaWn", zeta: 1, wn: 2 }),
    ).toThrow();
    expect(() =>
      converterEspecificacao({ modo: "polo", re: 0, im: 2 }),
    ).toThrow();
    expect(() =>
      projetarControlador({
        ...EXERCICIOS_CONTROLADORES[0].entrada,
        G: { num: [1], den: [0] },
      }),
    ).toThrow();
    expect(() =>
      projetarControlador({
        ...EXERCICIOS_CONTROLADORES[0].entrada,
        G: { num: [Infinity], den: [1] },
      }),
    ).toThrow();
  });
  it("rejeita topologia angular impossível e avaliação singular", () => {
    const entrada = {
      ...EXERCICIOS_CONTROLADORES[0].entrada,
      G: { num: [1], den: [1] },
      especificacao: { modo: "polo" as const, re: -1, im: 1 },
    };
    expect(() => projetarControlador(entrada)).toThrow(/topologia/);
    expect(() =>
      projetarControlador({ ...entrada, G: { num: [1], den: [1, 2, 2] } }),
    ).toThrow(/coincide/);
  });
});

describe("Resposta temporal independente da fatoração", () => {
  it("não altera os polos quando numerador e denominador têm escala pequena", () => {
    const r = simularDegrau({ num: [1e-20], den: [1e-20, 1e-20] }, 10);
    expect(r.polos).toEqual([{ re: -1, im: 0 }]);
    expect(r.y[4000]).toBeCloseTo(1 - Math.exp(-10), 6);
  });
  EXERCICIOS_CONTROLADORES.forEach((ex, i) =>
    it(`compara ${ex.id} com SciPy`, () => {
      const r = simularDegrau(projetarControlador(ex.entrada).fechada, 20);
      expect(r.status).toBe("ok");
      INDICES_SCIPY.forEach((indice, j) =>
        expect(r.y[indice]).toBeCloseTo(RESPOSTAS_SCIPY[i][j], 6),
      );
    }),
  );
  it.each([
    { num: [1], den: [1, 1], y: (t: number) => 1 - Math.exp(-t) },
    { num: [1], den: [1, 2, 1], y: (t: number) => 1 - (1 + t) * Math.exp(-t) },
    {
      num: [1],
      den: [1, 3, 3, 1],
      y: (t: number) => 1 - (1 + t + (t * t) / 2) * Math.exp(-t),
    },
    { num: [2, 1], den: [1, 1], y: (t: number) => 1 + Math.exp(-t) },
    { num: [-1], den: [1, 1], y: (t: number) => -(1 - Math.exp(-t)) },
  ])("confere solução analítica $den", ({ num, den, y }) => {
    const r = simularDegrau({ num, den }, 10);
    expect(r.status).toBe("ok");
    for (const i of [0, 200, 800, 2000, 4000])
      expect(r.y[i]).toBeCloseTo(y(r.t[i]), 6);
  });
  it("inclui salto inicial no sobressinal e suporta ganho estático", () => {
    expect(simularDegrau({ num: [2, 1], den: [1, 1] }).mp).toBeCloseTo(100);
    const r = simularDegrau({ num: [2], den: [1] });
    expect(r.yss).toBe(2);
    expect(r.ts2).toBe(0);
  });
  it("não inventa acomodação com horizonte curto ou valor final zero", () => {
    expect(simularDegrau({ num: [1], den: [1, 1] }, 0.1).ts2).toBeNull();
    const r = simularDegrau({ num: [1, 0], den: [1, 1] });
    expect(r.yss).toBe(0);
    expect(r.mp).toBeNull();
    expect(r.ts5).toBeNull();
  });
  it("não publica métricas de malhas instáveis, marginais ou impróprias", () => {
    for (const [tf, status] of [
      [{ num: [1], den: [1, -1] }, "instavel"],
      [{ num: [1], den: [1, 0] }, "marginal"],
      [{ num: [1, 0, 0], den: [1, 1] }, "impropria"],
    ] as const) {
      const r = simularDegrau({ num: [...tf.num], den: [...tf.den] });
      expect(r.status).toBe(status);
      expect(r.mp).toBeNull();
      expect(r.ts2).toBeNull();
    }
    expect(() => simularDegrau({ num: [1], den: [1, 1] }, NaN)).toThrow();
  });
  it("fecha a malha sem colocar H no numerador da saída", () => {
    expect(
      fecharMalha({ num: [1], den: [1, 1] }, { num: [2], den: [1, 3] }),
    ).toEqual({ num: [1, 3], den: [1, 4, 5] });
  });
});

describe("Substituições discretas e causalidade", () => {
  it("preserva a causalidade formal mesmo com coeficiente de avanço pequeno", () => {
    const pequeno = discretizar({ num: [1e-15, 1], den: [1] }, 1, "forward");
    expect(pequeno.num[0]).toBe(1e-15);
    expect(pequeno.causal).toBe(false);
  });
  it.each([
    ["forward", [1]],
    ["backward", [1, 0]],
    ["tustin", [0.5, 0.5]],
  ] as const)("discretiza 1/s por %s com T=1", (metodo, num) => {
    const r = discretizar({ num: [1], den: [1, 0] }, 1, metodo);
    expect(r.num).toEqual([...num]);
    expect(r.den).toEqual([1, -1]);
    expect(r.causal).toBe(true);
  });
  it("discretiza PID impróprio por Tustin", () => {
    const r = discretizar(
      { num: [0.539, 2 * 0.539 * 1.3322, 0.539 * 1.3322 ** 2], den: [1, 0] },
      2,
      "tustin",
    );
    expect(r.den).toEqual([1, 0, -1]);
    expect(r.num[0]).toBeCloseTo(2.9319, 3);
    expect(r.num[1]).toBeCloseTo(0.8352, 3);
    expect(r.num[2]).toBeCloseTo(0.0595, 3);
  });
  it("identifica avanço de amostras em PD por forward", () => {
    const r = discretizar({ num: [2, 3], den: [1] }, 0.5, "forward");
    expect(r.num).toEqual([4, -1]);
    expect(r.den).toEqual([1]);
    expect(r.avanco).toBe(1);
    expect(r.causal).toBe(false);
  });
  it("preserva uma entrada muito pequena sem zerar coeficientes válidos", () => {
    expect(
      discretizar({ num: [1e-15], den: [1, 1] }, 1, "forward").num,
    ).toEqual([1e-15]);
  });
  it("rejeita períodos inválidos", () => {
    for (const T of [0, -1, NaN, Infinity])
      expect(() => discretizar({ num: [1], den: [1] }, T, "tustin")).toThrow();
  });
});
