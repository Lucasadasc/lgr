import React, { useState } from 'react';
import { InputMode, PresetItem, TransferFunctionInput } from '../types/lgr';
import { MathView } from './MathView';
import { Polynomial } from '../math/polynomial';
import { parsePolynomialInput, parseRootsToPolynomial } from '../math/parser';
import { BookOpen, RefreshCw } from 'lucide-react';

interface InputSectionProps {
  inputData: TransferFunctionInput;
  onChangeInput: (data: TransferFunctionInput) => void;
  onApplyPreset: (preset: PresetItem) => void;
  onSolve: () => void;
  openPresetModal: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  inputData,
  onChangeInput,
  onSolve,
  openPresetModal,
}) => {
  const [mode, setMode] = useState<InputMode>('poly');

  // Compute live preview polynomials
  let gNumPoly = new Polynomial([1]);
  let gDenPoly = new Polynomial([1, 0]);
  let hNumPoly = new Polynomial([1]);
  let hDenPoly = new Polynomial([1]);

  try {
    if (mode === 'poly') {
      gNumPoly = parsePolynomialInput(inputData.gNum);
      gDenPoly = parsePolynomialInput(inputData.gDen);
      hNumPoly = parsePolynomialInput(inputData.hNum);
      hDenPoly = parsePolynomialInput(inputData.hDen);
    } else if (mode === 'factored') {
      const gGain = parseFloat(inputData.gGain || '1') || 1;
      const hGain = parseFloat(inputData.hGain || '1') || 1;
      gNumPoly = parseRootsToPolynomial(inputData.gZeros || '', gGain);
      gDenPoly = parseRootsToPolynomial(inputData.gPoles || '', 1);
      hNumPoly = parseRootsToPolynomial(inputData.hZeros || '', hGain);
      hDenPoly = parseRootsToPolynomial(inputData.hPoles || '', 1);
    } else {
      gNumPoly = parsePolynomialInput(inputData.exprG || '1');
      gDenPoly = parsePolynomialInput('1');
      hNumPoly = parsePolynomialInput(inputData.exprH || '1');
      hDenPoly = parsePolynomialInput('1');
    }
  } catch {
    // Graceful fallback
  }

  const openLoopNum = gNumPoly.mul(hNumPoly);
  const openLoopDen = gDenPoly.mul(hDenPoly);

  const previewG = `G(s) = \\frac{${gNumPoly.formatLatex('s')}}{${gDenPoly.formatLatex('s')}}`;
  const previewH = `H(s) = \\frac{${hNumPoly.formatLatex('s')}}{${hDenPoly.formatLatex('s')}}`;
  const previewGH = `G(s)H(s) = \\frac{K \\cdot (${openLoopNum.formatLatex('s')})}{${openLoopDen.formatLatex('s')}}`;

  return (
    <div className="glass-card input-section" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Bar: Modes & Quick Actions */}
      <div className="input-top-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="input-mode-tabs" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="tabs-container">
            <button
              className={`tab-btn ${mode === 'poly' ? 'active' : ''}`}
              onClick={() => setMode('poly')}
            >
              Coeficientes Polinomiais
            </button>
            <button
              className={`tab-btn ${mode === 'factored' ? 'active' : ''}`}
              onClick={() => setMode('factored')}
            >
              Raízes (Zeros & Pólos)
            </button>
            <button
              className={`tab-btn ${mode === 'expr' ? 'active' : ''}`}
              onClick={() => setMode('expr')}
            >
              Expressão Simbólica
            </button>
          </div>
        </div>

        <div className="input-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={openPresetModal}>
            <BookOpen size={15} color="var(--color-cyan)" />
            Exemplos da Apostila UFRN
          </button>
          <button className="btn btn-primary" onClick={onSolve}>
            <RefreshCw size={15} />
            Calcular LGR
          </button>
        </div>
      </div>

      {/* Input Fields based on Mode */}
      {mode === 'poly' && (
        <div className="input-grid">
          {/* Planta G(s) */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ color: 'var(--text-accent)', fontSize: '0.9rem' }}>Planta G(s)</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ex: "1, 2" ou "s + 2"</span>
            </div>
            <div className="form-group">
              <label className="form-label">Numerador N_G(s)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: 1, 2"
                value={inputData.gNum}
                onChange={(e) => onChangeInput({ ...inputData, gNum: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Denominador D_G(s)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: 1, 4, 0 (para s^2 + 4s)"
                value={inputData.gDen}
                onChange={(e) => onChangeInput({ ...inputData, gDen: e.target.value })}
              />
            </div>
          </div>

          {/* Realimentação H(s) */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ color: 'var(--color-emerald)', fontSize: '0.9rem' }}>Sensor / Realimentação H(s)</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>H(s) = 1 para malha unitária</span>
            </div>
            <div className="form-group">
              <label className="form-label">Numerador N_H(s)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: 1"
                value={inputData.hNum}
                onChange={(e) => onChangeInput({ ...inputData, hNum: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Denominador D_H(s)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: 1"
                value={inputData.hDen}
                onChange={(e) => onChangeInput({ ...inputData, hDen: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {mode === 'factored' && (
        <div className="input-grid">
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <strong style={{ color: 'var(--text-accent)', fontSize: '0.9rem' }}>Pólos e Zeros de G(s)</strong>
            <div className="form-group">
              <label className="form-label">Zeros de G(s) (separados por vírgula)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: -2"
                value={inputData.gZeros || ''}
                onChange={(e) => onChangeInput({ ...inputData, gZeros: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pólos de G(s) (reais ou complexos)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: 0, -4 ou -4+4j, -4-4j"
                value={inputData.gPoles || ''}
                onChange={(e) => onChangeInput({ ...inputData, gPoles: e.target.value })}
              />
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <strong style={{ color: 'var(--color-emerald)', fontSize: '0.9rem' }}>Pólos e Zeros de H(s)</strong>
            <div className="form-group">
              <label className="form-label">Zeros de H(s)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Deixe vazio para H(s)=1"
                value={inputData.hZeros || ''}
                onChange={(e) => onChangeInput({ ...inputData, hZeros: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pólos de H(s)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Deixe vazio para H(s)=1"
                value={inputData.hPoles || ''}
                onChange={(e) => onChangeInput({ ...inputData, hPoles: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {mode === 'expr' && (
        <div className="input-grid">
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <strong style={{ color: 'var(--text-accent)', fontSize: '0.9rem' }}>Expressão de G(s)</strong>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: (s+2)/(s*(s+4))"
              value={inputData.exprG || ''}
              onChange={(e) => onChangeInput({ ...inputData, exprG: e.target.value })}
            />
          </div>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <strong style={{ color: 'var(--color-emerald)', fontSize: '0.9rem' }}>Expressão de H(s)</strong>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: 1"
              value={inputData.exprH || ''}
              onChange={(e) => onChangeInput({ ...inputData, exprH: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Live Transfer Function Previews */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.85rem 1.25rem',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.95rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MathView math={previewG} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MathView math={previewH} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-accent)' }}>
          <MathView math={previewGH} />
        </div>
      </div>
    </div>
  );
};
