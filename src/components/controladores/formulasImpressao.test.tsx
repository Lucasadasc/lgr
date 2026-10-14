import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RelatorioImpressao from './RelatorioImpressao';
import { resolverListaParaEntrega } from '../../lib/controladores/impressao';
import { MemoriaPrimeiraOrdem } from './PassosPrimeiraOrdem';
import { projetarControlador } from '../../lib/controladores';
import { EXERCICIOS_LISTA2 } from '../../lib/controladores/exemplos';

describe('fórmulas dos relatórios', () => {
  it.each(['lista1', 'lista2'] as const)('renderiza comandos LaTeX válidos, sem quebras espúrias, em %s', lista => {
    const html = renderToStaticMarkup(<RelatorioImpressao resolucoes={resolverListaParaEntrega(lista)} />);
    // Os rótulos preservam a entrada real entregue ao KaTeX. Uma barra
    // duplicada antes de frac/sum/Delta vira uma quebra, não um comando.
    expect(html).not.toMatch(/aria-label="[^\"]*\\\\(?:frac|sum|widetilde|Delta|quad|Rightarrow)/);
    expect(html).not.toContain('katex-error');
    expect(html).toContain('<mfrac>');
  });
  it('a equação característica de a/(s+b) contém a fração matemática', () => {
    const r = projetarControlador(EXERCICIOS_LISTA2[1].entrada);
    if (r.tipo !== 'primeiraOrdem') throw Error('Tipo incorreto');
    const html = renderToStaticMarkup(<MemoriaPrimeiraOrdem r={r} />);
    const inicio = html.indexOf('aria-label="1+');
    const equacao = html.slice(inicio, html.indexOf('</div>', inicio));
    expect(equacao).toContain('<mfrac>');
  });
});
