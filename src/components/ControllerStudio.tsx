import React, { useState } from 'react';
import { TransferFunctionInput } from '../types/lgr';
import { MathView } from './MathView';
import { Cpu, Check } from 'lucide-react';

interface ControllerStudioProps {
  currentInput: TransferFunctionInput;
  onApplyController: (newGNum: string, newGDen: string) => void;
}

type ControllerType = 'P' | 'PI' | 'PD' | 'PID' | 'Lead' | 'Lag';

export const ControllerStudio: React.FC<ControllerStudioProps> = ({
  currentInput,
  onApplyController,
}) => {
  const [type, setType] = useState<ControllerType>('PI');
  const [kp, setKp] = useState<number>(2);
  const [ki, setKi] = useState<number>(1);
  const [kd, setKd] = useState<number>(0.5);
  const [zLead, setZLead] = useState<number>(1);
  const [pLead, setPLead] = useState<number>(10);
  const [zLag, setZLag] = useState<number>(0.1);
  const [pLag, setPLag] = useState<number>(0.01);

  // Controller transfer function N_c(s) / D_c(s)
  let cNum = '1';
  let cDen = '1';
  let cLatex = 'C(s) = 1';
  let description = '';

  switch (type) {
    case 'P':
      cNum = `${kp}`;
      cDen = '1';
      cLatex = `C(s) = ${kp}`;
      description = 'Apenas amplifica o ganho do sistema. Melhora o erro em regime mas pode reduzir a margem de estabilidade.';
      break;
    case 'PI':
      cNum = `${kp}, ${ki}`;
      cDen = '1, 0';
      cLatex = `C(s) = \\frac{${kp}s + ${ki}}{s}`;
      description = `Adiciona 1 pólo na origem (s = 0) para zerar o erro em regime permanente e 1 zero em s = -${(ki / kp).toFixed(2)}.`;
      break;
    case 'PD':
      cNum = `${kd}, ${kp}`;
      cDen = '1';
      cLatex = `C(s) = ${kd}s + ${kp} = ${kd}(s + ${(kp / kd).toFixed(2)})`;
      description = `Adiciona 1 zero em s = -${(kp / kd).toFixed(2)}. Aumenta o amortecimento, reduz sobressinal e tempo de acomodação.`;
      break;
    case 'PID':
      cNum = `${kd}, ${kp}, ${ki}`;
      cDen = '1, 0';
      cLatex = `C(s) = \\frac{${kd}s^2 + ${kp}s + ${ki}}{s}`;
      description = 'Adiciona 1 pólo na origem e 2 zeros, combinando eliminação do erro em regime com melhoria da resposta transitória.';
      break;
    case 'Lead':
      cNum = `1, ${zLead}`;
      cDen = `1, ${pLead}`;
      cLatex = `C_c(s) = \\frac{s + ${zLead}}{s + ${pLead}} \\quad (p > z)`;
      description = 'Compensador por Avanço de Fase (Lead): Aumenta a margem de fase e acelera a resposta transitória.';
      break;
    case 'Lag':
      cNum = `1, ${zLag}`;
      cDen = `1, ${pLag}`;
      cLatex = `C_c(s) = \\frac{s + ${zLag}}{s + ${pLag}} \\quad (z > p)`;
      description = 'Compensador por Atraso de Fase (Lag): Aumenta o ganho em baixas frequências para reduzir erro em regime permanente.';
      break;
  }

  const handleApply = () => {
    // Multiply G(s) by C(s)
    // For simplicity, multiply polynomial strings
    onApplyController(
      `${currentInput.gNum} * (${cNum})`,
      `${currentInput.gDen} * (${cDen})`
    );
  };

  return (
    <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={18} color="var(--color-emerald)" />
          <strong style={{ fontSize: '0.95rem' }}>Estúdio de Controladores e Compensadores (Capítulo 3)</strong>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Inserção em cascata C(s)·G(s) para remodelação dinâmica do LGR
        </span>
      </div>

      {/* Controller Type Selector */}
      <div className="tabs-container">
        {(['P', 'PI', 'PD', 'PID', 'Lead', 'Lag'] as ControllerType[]).map((t) => (
          <button
            key={t}
            className={`tab-btn ${type === t ? 'active' : ''}`}
            onClick={() => setType(t)}
          >
            Controlador {t}
          </button>
        ))}
      </div>

      {/* Parameters grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {(type === 'P' || type === 'PI' || type === 'PD' || type === 'PID') && (
          <div className="form-group">
            <label className="form-label">Ganho K_p</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              value={kp}
              onChange={(e) => setKp(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        {(type === 'PI' || type === 'PID') && (
          <div className="form-group">
            <label className="form-label">Ganho K_i</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              value={ki}
              onChange={(e) => setKi(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        {(type === 'PD' || type === 'PID') && (
          <div className="form-group">
            <label className="form-label">Ganho K_d</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              value={kd}
              onChange={(e) => setKd(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        {type === 'Lead' && (
          <>
            <div className="form-group">
              <label className="form-label">Zero z (Avanço)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={zLead}
                onChange={(e) => setZLead(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pólo p (p &gt; z)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={pLead}
                onChange={(e) => setPLead(parseFloat(e.target.value) || 0)}
              />
            </div>
          </>
        )}

        {type === 'Lag' && (
          <>
            <div className="form-group">
              <label className="form-label">Zero z (Atraso)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={zLag}
                onChange={(e) => setZLag(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pólo p (z &gt; p)</label>
              <input
                type="number"
                step="0.005"
                className="form-input"
                value={pLag}
                onChange={(e) => setPLag(parseFloat(e.target.value) || 0)}
              />
            </div>
          </>
        )}
      </div>

      {/* Preview & Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--bg-input)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ fontSize: '1.05rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
            <MathView math={cLatex} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{description}</p>
        </div>

        <button className="btn btn-primary" onClick={handleApply}>
          <Check size={16} />
          Acoplar Controlador à Planta G(s)
        </button>
      </div>
    </div>
  );
};
