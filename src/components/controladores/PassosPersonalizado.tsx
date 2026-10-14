import Formula from '../Formula';
import { ResolutionStep } from './ResolutionSteps';
import type { ResultadoPersonalizado } from '../../lib/controladores/personalizado';
import { nomeParametroLatex } from '../../lib/controladores/personalizado';
import { complexoParaLatex } from '../Formula';
import { numeroLatex as n, tfLatex } from '../../lib/controladores/formatacao';

export function MemoriaPersonalizada({ r }: { r: ResultadoPersonalizado }) {
  return <>
    <Formula latex={`G_c(s)=${r.modeloLatex}`} />
    <Formula latex={"\\Delta(s_d)=D_c(s_d)D_{GH}(s_d)+N_c(s_d)N_{GH}(s_d)=0"} />
    {r.entrada.personalizado?.modo === 'sintetizar' ? <>
      <p>Os coeficientes são afins nos parâmetros reais. As partes real e imaginária da equação característica fornecem o sistema linear.</p>
      <Formula latex={`\\begin{cases}${r.contribuicoes.map(c => `(${n(c.valor.re)})${nomeParametroLatex(c.nome)}`).join('+')}=${n(-r.constanteEquacao.re)}\\\\${r.contribuicoes.map(c => `(${n(c.valor.im)})${nomeParametroLatex(c.nome)}`).join('+')}=${n(-r.constanteEquacao.im)}\\end{cases}`} />
      {Object.entries(r.parametros).map(([nome, valor]) => <Formula key={nome} latex={`${nomeParametroLatex(nome)}=${n(valor)}`} />)}
    </> : <p>O controlador foi informado diretamente. Verificamos o polo desejado sem alterar seus coeficientes.</p>}
    <Formula latex={`G_c(s)=${tfLatex(r.Gc)},\\quad\\varepsilon_{\\mathrm{caract.,rel.}}=${n(r.residuo)}`} />
    <p className={r.poloAtendido ? 'badge-ok' : 'badge-warn'}>{r.poloAtendido ? 'O par desejado está presente na malha fechada.' : 'O controlador informado não posiciona o par desejado.'}</p>
  </>;
}
export default function PassosPersonalizado({ r }: { r: ResultadoPersonalizado }) {
  return <>
    <ResolutionStep index={0} title="Planta e modelo personalizado">
      <Formula latex={`G(s)=${tfLatex(r.entrada.G)},\\quad H(s)=${tfLatex(r.entrada.H)}`} />
      <Formula latex={`G_c(s)=${r.modeloLatex},\\quad s_d=${complexoParaLatex(r.sd, 6)}`} />
    </ResolutionStep>
    <ResolutionStep index={1} title="Parâmetros e equação característica"><MemoriaPersonalizada r={r} /></ResolutionStep>
    <ResolutionStep index={2} title="Controlador final">
      <Formula latex={`G_c(s)=${tfLatex(r.Gc)}`} />
      <p>O controlador completo é aplicado à planta; não adicionamos um ganho de projeto extra.</p>
      {r.avisos.map(a => <p className="badge-warn" key={a}>{a}</p>)}
    </ResolutionStep>
  </>;
}
