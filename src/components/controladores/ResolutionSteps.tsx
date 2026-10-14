import { createContext, useContext, useState, type ReactNode } from 'react';
import { StepNavigator } from '../StepNavigator';

const StepContext = createContext({ current: 0, all: false });

export function ResolutionSteps({ titles, children }: { titles: string[]; children: ReactNode }) {
  const [current, setCurrent] = useState(0);
  const [all, setAll] = useState(false);
  const steps = titles.map((title, index) => ({
    title,
    stepNumber: index + 1,
    hasChart: title === 'Validação da malha fechada',
  }));
  return (
    <StepContext.Provider value={{ current, all }}>
      <div className="no-print">
        <StepNavigator steps={steps} currentStepIndex={current} onSelectStep={setCurrent}
          viewAllMode={all} onToggleViewAll={() => setAll(value => !value)} />
      </div>
      {children}
    </StepContext.Provider>
  );
}

export function ResolutionStep({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  const { current, all } = useContext(StepContext);
  if (!all && current !== index) return null;
  return (
    <section className="glass-card step-card resolution-step" aria-label={`Passo ${index + 1}: ${title}`}>
      <div className="step-card-header"><div className="step-title-group">
        <h2><span className="step-label">Passo {index + 1}</span><span>{title}</span></h2>
      </div></div>
      {children}
    </section>
  );
}
