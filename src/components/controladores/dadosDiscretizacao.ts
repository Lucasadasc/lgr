import type {
  ConfiguracaoDiscreta,
  MetodoDiscreto,
} from "../../lib/controladores/discretizacao";

export interface DadosDiscretizacao {
  incluir: boolean;
  alvo: ConfiguracaoDiscreta["alvo"];
  metodo: MetodoDiscreto;
  periodo: string;
}
export const DISCRETIZACAO_INICIAL: DadosDiscretizacao = {
  incluir: false,
  alvo: "Gc",
  metodo: "tustin",
  periodo: "1",
};
export const configuracaoDiscreta = (
  d: DadosDiscretizacao,
): ConfiguracaoDiscreta => ({
  alvo: d.alvo,
  metodo: d.metodo,
  periodo: Number(d.periodo),
});
