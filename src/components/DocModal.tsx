import React from 'react';
import { MathView } from './MathView';
import { X, GraduationCap } from 'lucide-react';

interface DocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocModal: React.FC<DocModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <GraduationCap size={24} color="var(--color-cyan)" />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Guia Didático do LGR (DCA/UFRN)</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Prof. Fábio Meneghetti Ugulino de Araújo • Sistemas de Controle
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {/* Section 1 */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              1. Definição do Lugar Geométrico das Raízes (LGR)
            </strong>
            <p>
              O diagrama do <strong>Lugar Geométrico das Raízes (LGR)</strong> consiste no conjunto de curvas no plano complexo <em>s</em> que representam as posições admissíveis para os pólos de malha fechada quando o ganho varia de zero a infinito (0 ≤ K &lt; ∞).
            </p>
            <div className="formula-box">
              <MathView math="1 + G(s)H(s) = 0 \implies G(s)H(s) = -1" block />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><strong>1. Condição de Módulo:</strong> <MathView math="|G(s)H(s)| = 1" /></div>
                <div><strong>2. Condição de Ângulo:</strong> <MathView math="\angle G(s)H(s) = \pm 180^\circ(2k+1)" /></div>
              </div>
            </div>
          </div>

          {/* Section 2: 10 Steps Summary */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              2. Os 10 Passos Canônicos de Construção
            </strong>
            <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li><strong>Passo 1:</strong> Escrever a equação característica na forma <MathView math="1 + K P(s) = 0" />.</li>
              <li><strong>Passo 2:</strong> Fatorar <MathView math="P(s)" /> em termos de seus pólos (<MathView math="n_P" />) e zeros (<MathView math="n_Z" />).</li>
              <li><strong>Passo 3:</strong> Assinalar pólos (×) e zeros (○) de malha aberta no plano <em>s</em>.</li>
              <li><strong>Passo 4:</strong> Identificar segmentos do eixo real situados à esquerda de número ímpar de pólos/zeros reais.</li>
              <li><strong>Passo 5:</strong> Determinar o número de ramos separados (<MathView math="LS = n_P" /> para <MathView math="n_P \ge n_Z" />).</li>
              <li><strong>Passo 6:</strong> Simetria reflexiva em relação ao eixo real horizontal.</li>
              <li><strong>Passo 7:</strong> Assíntotas para zeros no infinito (<MathView math="\sigma_A = \frac{\sum p_i - \sum z_j}{n_P - n_Z}" /> e <MathView math="\phi_A = \frac{2q+1}{n_P - n_Z}180^\circ" />).</li>
              <li><strong>Passo 8:</strong> Pontos de saída/entrada no eixo real onde <MathView math="\frac{dK}{ds} = 0" />.</li>
              <li><strong>Passo 9:</strong> Cruzamento com o eixo imaginário <em>jω</em> e determinação do ganho crítico <MathView math="K_{lim}" /> via Routh-Hurwitz.</li>
              <li><strong>Passo 10:</strong> Ângulos de partida/chegada para pólos e zeros complexos e traçado numérico contínuo.</li>
            </ol>
          </div>

          {/* Section 3: Controllers Summary */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              3. Ações de Controle Básicas (P, PI, PD, PID, Lead, Lag)
            </strong>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <li><strong>P:</strong> Amplificador ajustável (<MathView math="K_p" />). Reduz erro em regime, mas pode desestabilizar.</li>
              <li><strong>PI:</strong> <MathView math="C(s) = \frac{K_p s + K_i}{s}" />. Zera o erro em regime permanente (adiciona pólo em 0 e 1 zero).</li>
              <li><strong>PD:</strong> <MathView math="C(s) = K_d s + K_p" />. Melhora resposta transitória e amortecimento (adiciona 1 zero).</li>
              <li><strong>PID:</strong> Combina eliminação de erro com estabilização rápida.</li>
              <li><strong>Lead (Avanço):</strong> Melhora transitório e margem de fase (<MathView math="p > z" />).</li>
              <li><strong>Lag (Atraso):</strong> Melhora regime permanente sem diminuir estabilidade transitória (<MathView math="z > p" />).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
