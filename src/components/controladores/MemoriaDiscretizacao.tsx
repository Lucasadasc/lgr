import Formula from '../Formula';
import type { ResultadoDiscreto } from '../../lib/controladores/discretizacao';
import { numeroLatex as n, polinomioLatex as poly, tfLatex } from '../../lib/controladores/formatacao';

export default function MemoriaDiscretizacao({ d, inicio = 0, fim = d.memoria.termos.length }: {
  d: ResultadoDiscreto; inicio?: number; fim?: number;
}) {
  const m = d.memoria;
  return <div className="memoria-discreta">
    {inicio === 0 && <>
      <h3>Substituição polinomial e denominador comum</h3>
      <Formula latex={`s=\\frac{u(z)}{v(z)},\\quad u(z)=${poly(m.u, 'z')},\\quad v(z)=${poly(m.v, 'z')},\\quad m=${m.grauComum}`} />
      <Formula latex={"P(u/v)=\\frac{\\sum_{i=0}^{n}c_i u^{n-i}v^{m-n+i}}{v^m},\\quad m=\\max(\\deg N,\\deg D)"} />
      <p>Aplicamos a substituição a cada coeficiente, preservando sua potência original.</p>
    </>}
    <div className="tabela-scroll"><table className="data-table">
      <caption>Expansão dos termos de N(s) e D(s)</caption>
      <thead><tr><th scope="col">Origem</th><th scope="col">Após a substituição</th><th scope="col">Polinômio expandido</th></tr></thead>
      <tbody>{m.termos.slice(inicio, fim).map((t, i) => <tr key={inicio + i}>
        <th scope="row">{t.origem} · s^{t.potencia}</th>
        <td><Formula inline latex={`${n(t.coeficiente)}u(z)^{${t.potencia}}v(z)^{${t.potenciaComum}}`} /></td>
        <td><Formula inline latex={poly(t.expandido, 'z')} /></td>
      </tr>)}</tbody>
    </table></div>
    {fim >= m.termos.length && <>
      <h3>Soma dos termos e cancelamento do denominador comum</h3>
      <Formula latex={`\\widetilde N(z)=${poly(m.numeradorBruto, 'z')}`} />
      <Formula latex={`\\widetilde D(z)=${poly(m.denominadorBruto, 'z')}`} />
      <Formula latex={"F(z)=\\frac{\\widetilde N(z)/v(z)^m}{\\widetilde D(z)/v(z)^m}=\\frac{\\widetilde N(z)}{\\widetilde D(z)}"} />
      <p>Cancelamos o denominador comum introduzido pela substituição. Removemos apenas zeros exatamente nulos no início dos vetores; fatores de polos e zeros da função original são preservados.</p>
      <h3>Normalização e função final</h3>
      <Formula latex={`a_0=${n(m.lider)},\\quad N_z=\\widetilde N/a_0,\\quad D_z=\\widetilde D/a_0,\\quad F(z)=${tfLatex(d, 'z')}`} />
      <p>Para obter a equação de diferenças, dividimos por z elevado ao grau de D_z. Ao isolar u[k], os coeficientes das saídas anteriores trocam de sinal.</p>
    </>}
  </div>;
}
