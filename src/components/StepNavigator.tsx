import React from 'react';
import { LgrStepData } from '../types/lgr';
import { ChevronLeft, ChevronRight, Layers, ListFilter, ChartLine } from 'lucide-react';

interface StepNavigatorProps {
  steps: Pick<LgrStepData, 'stepNumber' | 'title' | 'hasChart'>[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  viewAllMode: boolean;
  onToggleViewAll: () => void;
}

export const StepNavigator: React.FC<StepNavigatorProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
  viewAllMode,
  onToggleViewAll,
}) => {
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="stepper-wrapper">
      {/* Progress Line */}
      <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${viewAllMode ? 100 : progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--color-cyan), var(--color-blue), var(--color-emerald))',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div className="stepper-header">
        {/* Navigation buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            disabled={viewAllMode || currentStepIndex === 0}
            onClick={() => onSelectStep(Math.max(0, currentStepIndex - 1))}
            style={{ opacity: currentStepIndex === 0 || viewAllMode ? 0.5 : 1 }}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <button
            className="btn btn-primary"
            disabled={viewAllMode || currentStepIndex === steps.length - 1}
            onClick={() => onSelectStep(Math.min(steps.length - 1, currentStepIndex + 1))}
            style={{ opacity: currentStepIndex === steps.length - 1 || viewAllMode ? 0.5 : 1 }}
          >
            Próximo
            <ChevronRight size={16} />
          </button>
        </div>

        {/* View mode toggle */}
        <button className="btn btn-ghost" onClick={onToggleViewAll} style={{ fontSize: '0.825rem' }}>
          {viewAllMode ? (
            <>
              <Layers size={15} color="var(--color-cyan)" />
              Ver Passo a Passo
            </>
          ) : (
            <>
              <ListFilter size={15} color="var(--color-cyan)" />
              Exibir Todos os {steps.length} Passos
            </>
          )}
        </button>
      </div>

      {/* Steps Track (Chips) */}
      {!viewAllMode && (
        <div className="stepper-track">
          {steps.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const hasChart = step.hasChart;

            return (
              <button
                key={step.stepNumber}
                className={`step-chip ${isActive ? 'active' : ''} ${hasChart ? 'has-chart' : ''}`}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => onSelectStep(idx)}
                title={`Passo ${step.stepNumber}: ${step.title}`}
              >
                <span className="step-num-badge">{step.stepNumber}</span>
                <span>Passo {step.stepNumber}</span>
                {hasChart && <ChartLine size={14} aria-label="Gráfico neste passo" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
