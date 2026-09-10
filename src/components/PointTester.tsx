import React, { useState } from 'react';
import { ComplexNum, LgrSolution } from '../types/lgr';
import { Complex } from '../math/complex';
import { MathView } from './MathView';
import { Target, CheckCircle2, XCircle, Calculator } from 'lucide-react';

interface PointTesterProps {
  solution: LgrSolution;
  activeTestPoint: ComplexNum | null;
  onSetTestPoint: (pt: ComplexNum | null) => void;
}

export const PointTester: React.FC<PointTesterProps> = ({
  solution,
  activeTestPoint,
  onSetTestPoint,
}) => {
  const [inputRe, setInputRe] = useState<string>('-1.0066');
  const [inputIm, setInputIm] = useState<string>('3.9950');

  const reVal = parseFloat(inputRe);
  const imVal = parseFloat(inputIm);

  const isValidInput = !isNaN(reVal) && !isNaN(imVal);

  const testPoint = isValidInput ? new Complex(reVal, imVal) : null;

  let angleSumPoles = 0;
  let angleSumZeros = 0;
  let productDistPoles = 1;
  let productDistZeros = 1;

  const poleVectors: { from: string; angle: number; dist: number }[] = [];
  const zeroVectors: { from: string; angle: number; dist: number }[] = [];

  if (testPoint) {
    // Vectors from poles to test point: (s_1 - p_i)
    // Note: In standard form 1 + K * N/D = 0, angle is sum(zeros) - sum(poles) = 180 + 360k
    // or sum(poles) - sum(zeros) = 180 + 360k
    solution.poles.forEach((p) => {
      const poleC = new Complex(p.re, p.im);
      const diff = testPoint.sub(poleC);
      const ang = diff.argDeg();
      const dist = diff.abs();
      for (let m = 0; m < p.multiplicity; m++) {
        angleSumPoles += ang;
        productDistPoles *= dist;
        poleVectors.push({
          from: poleC.format(),
          angle: parseFloat(ang.toFixed(2)),
          dist: parseFloat(dist.toFixed(4)),
        });
      }
    });

    solution.zeros.forEach((z) => {
      const zeroC = new Complex(z.re, z.im);
      const diff = testPoint.sub(zeroC);
      const ang = diff.argDeg();
      const dist = diff.abs();
      for (let m = 0; m < z.multiplicity; m++) {
        angleSumZeros += ang;
        productDistZeros *= dist;
        zeroVectors.push({
          from: zeroC.format(),
          angle: parseFloat(ang.toFixed(2)),
          dist: parseFloat(dist.toFixed(4)),
        });
      }
    });
  }

  // Phase condition: angle(GH) = sum(zeros) - sum(poles)
  const netPhase = angleSumZeros - angleSumPoles;
  const normalizedPhase = ((netPhase % 360) + 360) % 360; // in [0, 360]
  const phaseError = Math.abs(normalizedPhase - 180);
  const isOnLgr = phaseError < 1.5 || Math.abs(normalizedPhase - 540) < 1.5;

  // Gain calculation via magnitude criterion: K = prod(|s - p_i|) / prod(|s - z_j|)
  const gainK = productDistZeros > 1e-10 ? productDistPoles / productDistZeros : Infinity;

  const handleTest = () => {
    if (isValidInput) {
      onSetTestPoint({ re: reVal, im: imVal });
    }
  };

  const handleClear = () => {
    onSetTestPoint(null);
  };

  return (
    <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={18} color="var(--color-purple)" />
          <strong style={{ fontSize: '0.95rem' }}>Localizador e Testador de Raízes no LGR (Seção 2.4)</strong>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Critério de Ângulo (∠G(s)H(s) = ±180°) e Módulo (|G(s)H(s)| = 1)
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="form-label">Parte Real (σ₁)</label>
          <input
            type="number"
            step="0.0001"
            className="form-input"
            value={inputRe}
            onChange={(e) => setInputRe(e.target.value)}
            placeholder="-1.0066"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Parte Imaginária (ω₁)</label>
          <input
            type="number"
            step="0.0001"
            className="form-input"
            value={inputIm}
            onChange={(e) => setInputIm(e.target.value)}
            placeholder="3.9950"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={handleTest} style={{ flex: 1 }}>
            <Calculator size={15} />
            Testar Ponto s₁
          </button>
          {activeTestPoint && (
            <button className="btn btn-secondary" onClick={handleClear}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {testPoint && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            background: 'var(--bg-input)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Angle condition result */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>
              {isOnLgr ? (
                <>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span style={{ color: '#10b981' }}>O ponto s₁ PERTENCE ao LGR!</span>
                </>
              ) : (
                <>
                  <XCircle size={16} color="#ef4444" />
                  <span style={{ color: '#ef4444' }}>O ponto s₁ NÃO pertence ao LGR</span>
                </>
              )}
            </div>

            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <div>• Soma dos ângulos dos pólos (∑ θᵢ): <strong>{angleSumPoles.toFixed(2)}°</strong></div>
              <div>• Soma dos ângulos dos zeros (∑ ϕⱼ): <strong>{angleSumZeros.toFixed(2)}°</strong></div>
              <div>• Ângulo resultante: <strong>{normalizedPhase.toFixed(2)}°</strong> (Esperado: 180° ± 360°k)</div>
            </div>
          </div>

          {/* Gain magnitude result */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-accent)' }}>
              Determinação do Ganho K pelo Critério do Módulo:
            </span>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <div>• Produtório das distâncias aos pólos: <strong>{productDistPoles.toFixed(4)}</strong></div>
              <div>• Produtório das distâncias aos zeros: <strong>{productDistZeros.toFixed(4)}</strong></div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>
                <MathView math={`K_1 = \\frac{\\prod |s_1 - p_i|}{\\prod |s_1 - z_j|} = ${gainK.toFixed(4)}`} />
              </div>
            </div>
          </div>

          <div
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-accent)' }}>
              Como o resultado foi obtido
            </span>
            <MathView
              block
              math={`s_1 = ${reVal.toFixed(4)} ${imVal >= 0 ? '+' : '-'} j${Math.abs(imVal).toFixed(4)}`}
            />

            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Para cada pólo e zero, calcula-se o vetor até o ponto testado: \\(s_1 - a_i\\). A distância é o módulo
              desse vetor e o ângulo é o seu argumento.
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Origem</th>
                    <th>Vetor</th>
                    <th>Distância</th>
                    <th>Ângulo</th>
                  </tr>
                </thead>
                <tbody>
                  {poleVectors.map((vector, index) => (
                    <tr key={`pole-${index}`}>
                      <td style={{ color: '#ef4444' }}>Pólo {vector.from}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>s₁ − ({vector.from})</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{vector.dist.toFixed(4)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{vector.angle.toFixed(2)}°</td>
                    </tr>
                  ))}
                  {zeroVectors.map((vector, index) => (
                    <tr key={`zero-${index}`}>
                      <td style={{ color: '#06b6d4' }}>Zero {vector.from}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>s₁ − ({vector.from})</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{vector.dist.toFixed(4)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{vector.angle.toFixed(2)}°</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              <div style={{ padding: '0.7rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ fontSize: '0.8rem' }}>Critério do ângulo</strong>
                <MathView
                  block
                  math={`\\angle G(s_1)H(s_1) = \\sum \\phi_j - \\sum \\theta_i = ${angleSumZeros.toFixed(2)}^\\circ - ${angleSumPoles.toFixed(2)}^\\circ = ${netPhase.toFixed(2)}^\\circ`}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Normalizado para {normalizedPhase.toFixed(2)}°; o ponto pertence quando esse valor é 180° (módulo 360°).
                </span>
              </div>
              <div style={{ padding: '0.7rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ fontSize: '0.8rem' }}>Critério do módulo</strong>
                <MathView
                  block
                  math={`K_1 = \\frac{${productDistPoles.toFixed(4)}}{${productDistZeros.toFixed(4)}} = ${gainK.toFixed(4)}`}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  O ganho é positivo e ajusta o módulo de G(s)H(s) para 1.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
