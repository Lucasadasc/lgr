import React from 'react';
import { LgrSolution, LgrStepData } from '../types/lgr';
import { MathView } from './MathView';
import { LgrPlot } from './LgrPlot';
import { CheckCircle, Info, Sparkles } from 'lucide-react';

interface StepCardProps {
  step: LgrStepData;
  solution: LgrSolution;
}

export const StepCard: React.FC<StepCardProps> = ({ step, solution }) => {
  const isChartStep = [3, 4, 7, 9, 10].includes(step.stepNumber);

  return (
    <div className="glass-card step-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="step-card-header">
        <div className="step-title-group">
          <h2>
            <span
              style={{
                background: 'linear-gradient(135deg, var(--color-cyan), var(--color-blue))',
                color: '#fff',
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontWeight: 800,
              }}
            >
              Passo {step.stepNumber}
            </span>
            <span>{step.title}</span>
          </h2>
          <p className="step-subtitle">{step.subtitle}</p>
        </div>

        {isChartStep && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <Sparkles size={13} />
            Gráfico Interativo Ativo
          </span>
        )}
      </div>

      {/* Main Content Layout */}
      <div className={`step-content-grid ${isChartStep ? 'with-chart' : ''}`}>
        {/* Left / Textual & Formulas Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Summary Box */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'var(--bg-accent-subtle)',
              borderLeft: '4px solid var(--color-cyan)',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
            }}
          >
            <CheckCircle size={18} color="var(--color-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Resultado:</strong> {step.summary}
            </div>
          </div>

          {/* Formulas */}
          {step.latexFormulas.length > 0 && (
            <div className="formula-box">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Formulações e Equações
              </span>
              {step.latexFormulas.map((f, idx) => (
                <div key={idx} className="formula-item">
                  <MathView math={f} block />
                </div>
              ))}
            </div>
          )}

          {/* Explanation */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <Info size={16} color="var(--text-accent)" style={{ flexShrink: 0, marginTop: '3px' }} />
            <p>{step.explanation}</p>
          </div>

          {/* Step-specific details & tables */}
          {renderStepDetails(step, solution)}
        </div>

        {/* Right Column: Chart (for Steps 3, 4, 7, 9, 10) */}
        {isChartStep && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <LgrPlot solution={solution} stepNumber={step.stepNumber} height={400} />
          </div>
        )}
      </div>
    </div>
  );
};

function renderStepDetails(step: LgrStepData, solution: LgrSolution) {
  switch (step.stepNumber) {
    case 2:
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="glass-card" style={{ padding: '0.85rem' }}>
            <strong style={{ color: '#ef4444', fontSize: '0.825rem' }}>Pólos de Malha Aberta (×):</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              {step.details.polesList?.map((p: string, i: number) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="glass-card" style={{ padding: '0.85rem' }}>
            <strong style={{ color: '#06b6d4', fontSize: '0.825rem' }}>Zeros de Malha Aberta (○):</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              {step.details.zerosList?.map((z: string, i: number) => (
                <li key={i}>{z}</li>
              ))}
            </ul>
          </div>
        </div>
      );

    case 4:
      return (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Intervalo no Eixo Real</th>
                <th>Justificativa / Contagem de Raízes à Direita</th>
              </tr>
            </thead>
            <tbody>
              {solution.realSegments.map((seg, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#10b981' }}>
                    [{isFinite(seg.start) ? seg.start : '-∞'}, {seg.end}]
                  </td>
                  <td>{seg.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 7:
      return (
        solution.asymptotes.numAsymptotes > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assíntota</th>
                  <th>Ângulo (Graus)</th>
                  <th>Ângulo (Radianos)</th>
                </tr>
              </thead>
              <tbody>
                {solution.asymptotes.anglesDeg.map((deg, i) => (
                  <tr key={i}>
                    <td>q = {i}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#eab308', fontWeight: 600 }}>{deg}°</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{solution.asymptotes.anglesRad[i].toFixed(4)} rad</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      );

    case 8:
      return (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Raiz da Derivada (s)</th>
                <th>Ganho K Calculado</th>
                <th>Classificação</th>
                <th>Veredito</th>
              </tr>
            </thead>
            <tbody>
              {solution.breakawayCandidates.map((c, i) => (
                <tr key={i} style={{ opacity: c.isValid ? 1 : 0.65 }}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {c.s.re} {c.s.im !== 0 ? `${c.s.im > 0 ? '+' : ''}${c.s.im}j` : ''}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{c.k}</td>
                  <td>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: c.isValid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: c.isValid ? '#10b981' : '#ef4444',
                      }}
                    >
                      {c.type === 'breakaway' ? 'Saída' : c.type === 'breakin' ? 'Entrada' : 'Descartado'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{c.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 9:
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {solution.routhTable.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Estrutura da Tabela de Routh-Hurwitz:
              </span>
              <table className="data-table">
                <tbody>
                  {solution.routhTable.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, width: '60px', color: 'var(--text-accent)' }}>
                        <MathView math={row.power} />
                      </td>
                      {row.coeffs.map((c, j) => (
                        <td key={j} style={{ fontFamily: 'var(--font-mono)' }}>
                          {typeof c === 'string' && c.includes('\\') ? <MathView math={c} /> : c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              padding: '0.85rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <strong style={{ fontSize: '0.85rem', color: 'var(--text-accent)' }}>
              Desenvolvimento do critério de Routh-Hurwitz
            </strong>
            <MathView block math={`${formatCharacteristicPolynomial(solution.openLoopDen, solution.openLoopNum)} = 0`} />
            {solution.openLoopDen.length === 4 && (
              <MathView
                block
                math={getCubicRouthExpression(solution.openLoopDen, solution.openLoopNum)}
              />
            )}

            {solution.imaginaryCrossings.length > 0 ? (
              <>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  O cruzamento ocorre quando o primeiro elemento da linha de \(s^1\) se anula. Nesse ponto, a linha \(s^2\) forma o polinômio auxiliar.
                </span>
                {solution.imaginaryCrossings.map((crossing, index) => (
                  <MathView
                    key={index}
                    block
                    math={`K = ${crossing.kLim.toFixed(4)} \\quad\\Longrightarrow\\quad s_{1,2} = \\pm j${crossing.omega.toFixed(4)}`}
                  />
                ))}
                <MathView
                  block
                  math={`\\text{Faixa estável: } 0 < K < ${solution.imaginaryCrossings[0].kLim.toFixed(4)}`}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  O menor ganho crítico é a primeira fronteira de estabilidade; o segundo cruzamento é reportado porque também pertence ao LGR, mas o sistema já deixou a faixa estável.
                </span>
              </>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Como não há cruzamentos positivos, não existe ganho crítico detectado para limitar a estabilidade.
              </span>
            )}
          </div>
        </div>
      );

    case 10:
      return (
        solution.departureAngles.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Detalhamento dos Vetores Angulares:
            </span>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pólo Complexo</th>
                  <th>Ângulo de Partida (θ)</th>
                  <th>Fórmula Vetorial</th>
                </tr>
              </thead>
              <tbody>
                {solution.departureAngles.map((dep, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#ef4444', fontWeight: 600 }}>
                      {dep.point.re} + {dep.point.im}j
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 700 }}>
                      {dep.angleDeg}°
                    </td>
                    <td>
                      <MathView math={dep.formula} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      );

    default:
      return null;
  }
}

function formatCharacteristicPolynomial(den: number[], num: number[]): string {
  const degree = Math.max(den.length, num.length) - 1;
  const denPadded = Array(degree + 1 - den.length).fill(0).concat(den);
  const numPadded = Array(degree + 1 - num.length).fill(0).concat(num);
  const terms: string[] = [];

  for (let index = 0; index <= degree; index++) {
    const power = degree - index;
    const constant = denPadded[index];
    const gain = numPadded[index];
    if (Math.abs(constant) < 1e-9 && Math.abs(gain) < 1e-9) continue;

    let coefficient = '';
    if (Math.abs(constant) > 1e-9 && Math.abs(gain) > 1e-9) {
      const gainText = Math.abs(gain) === 1 ? 'K' : `${Math.abs(gain)}K`;
      coefficient = `${constant} ${gain > 0 ? '+' : '-'} ${gainText}`;
    } else if (Math.abs(gain) > 1e-9) {
      coefficient = Math.abs(gain) === 1 ? 'K' : `${Math.abs(gain)}K`;
    } else {
      coefficient = `${constant}`;
    }

    const term = power === 0 ? coefficient : power === 1 ? `${coefficient}s` : `${coefficient}s^{${power}}`;
    terms.push(terms.length === 0 || coefficient.startsWith('-') ? term : `+ ${term}`);
  }

  return terms.join(' ');
}

function getCubicRouthExpression(den: number[], num: number[]): string {
  const denPadded = [0, ...den];
  const numPadded = [0, ...num];
  const a3 = denPadded[1] || 0;
  const a2 = denPadded[2] || 0;
  const a1 = denPadded[3] || 0;
  const a0 = denPadded[4] || 0;
  const b2 = numPadded[1] || 0;
  const b1 = numPadded[2] || 0;
  const b0 = numPadded[3] || 0;
  const rowS2 = `${a2} ${b2 >= 0 ? '+' : '-'} ${Math.abs(b2) === 1 ? 'K' : `${Math.abs(b2)}K`}`;
  const rowS1Numerator = `(${rowS2})(${a1} ${b1 >= 0 ? '+' : '-'} ${Math.abs(b1) === 1 ? 'K' : `${Math.abs(b1)}K`}) - (${a3})(${a0} ${b0 >= 0 ? '+' : '-'} ${Math.abs(b0) === 1 ? 'K' : `${Math.abs(b0)}K`})`;

  return `\\begin{array}{c|cc} s^3 & ${a3} & ${a1} ${b1 >= 0 ? '+' : '-'} ${Math.abs(b1) === 1 ? 'K' : `${Math.abs(b1)}K`} \\\\ s^2 & ${rowS2} & ${a0} ${b0 >= 0 ? '+' : '-'} ${Math.abs(b0) === 1 ? 'K' : `${Math.abs(b0)}K`} \\\\ s^1 & \\frac{${rowS1Numerator}}{${rowS2}} & 0 \\\\ s^0 & ${a0} ${b0 >= 0 ? '+' : '-'} ${Math.abs(b0) === 1 ? 'K' : `${Math.abs(b0)}K`} & \\end{array}`;
}
