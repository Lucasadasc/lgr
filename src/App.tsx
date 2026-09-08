import React, { useState, useEffect, useMemo } from 'react';
import { TransferFunctionInput, PresetItem, ComplexNum } from './types/lgr';
import { parsePolynomialInput } from './math/parser';
import { solveLgr } from './math/lgrEngine';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { StepNavigator } from './components/StepNavigator';
import { StepCard } from './components/StepCard';
import { PointTester } from './components/PointTester';
import { ControllerStudio } from './components/ControllerStudio';
import { PresetsModal } from './components/PresetsModal';
import { DocModal } from './components/DocModal';
import { LgrPlot } from './components/LgrPlot';
import { Layers, Sliders, Target } from 'lucide-react';

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Input state (default: Exemplo 1 da apostila)
  const [inputData, setInputData] = useState<TransferFunctionInput>({
    gNum: '1, 2',
    gDen: '1, 4, 0',
    hNum: '1',
    hDen: '1',
  });

  // Navigation & View states
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [viewAllMode, setViewAllMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'steps' | 'tester' | 'controllers'>('steps');

  // Interactive tools state
  const [activeTestPoint, setActiveTestPoint] = useState<ComplexNum | null>(null);

  // Modals
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [isDocOpen, setIsDocOpen] = useState<boolean>(false);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Compute LGR Solution
  const solution = useMemo(() => {
    try {
      const gNumPoly = parsePolynomialInput(inputData.gNum);
      const gDenPoly = parsePolynomialInput(inputData.gDen);
      const hNumPoly = parsePolynomialInput(inputData.hNum);
      const hDenPoly = parsePolynomialInput(inputData.hDen);

      const openLoopNum = gNumPoly.mul(hNumPoly);
      const openLoopDen = gDenPoly.mul(hDenPoly);

      return solveLgr(openLoopNum, openLoopDen);
    } catch (err) {
      console.error('Error computing LGR:', err);
      // Fallback to simple first order
      const gNumPoly = parsePolynomialInput('1, 2');
      const gDenPoly = parsePolynomialInput('1, 4, 0');
      return solveLgr(gNumPoly, gDenPoly);
    }
  }, [inputData]);

  // Handlers
  const handleApplyPreset = (preset: PresetItem) => {
    setInputData({
      gNum: preset.gNum,
      gDen: preset.gDen,
      hNum: preset.hNum,
      hDen: preset.hDen,
    });
    if (preset.testPoint) {
      setActiveTestPoint(preset.testPoint);
    } else {
      setActiveTestPoint(null);
    }
    setCurrentStepIndex(0);
  };

  const handleApplyController = (newGNum: string, newGDen: string) => {
    setInputData((prev) => ({
      ...prev,
      gNum: newGNum,
      gDen: newGDen,
    }));
    setActiveTab('steps');
    setCurrentStepIndex(9); // Jump to final locus step to see the impact
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenDoc={() => setIsDocOpen(true)}
      />

      {/* Main Container */}
      <main className="main-content">
        {/* Input Configuration & Plant Definition */}
        <InputSection
          inputData={inputData}
          onChangeInput={setInputData}
          onApplyPreset={handleApplyPreset}
          onSolve={() => {}}
          openPresetModal={() => setIsPresetsOpen(true)}
        />

        {/* Feature Tabs (Passo a Passo / Testador de Ponto / Controladores) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="tabs-container feature-tabs">
            <button
              className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`}
              onClick={() => setActiveTab('steps')}
            >
              <Layers size={15} color="var(--color-cyan)" />
              Passo a Passo (10 Passos)
            </button>
            <button
              className={`tab-btn ${activeTab === 'tester' ? 'active' : ''}`}
              onClick={() => setActiveTab('tester')}
            >
              <Target size={15} color="var(--color-purple)" />
              Testador de Ponto (Seção 2.4)
            </button>
            <button
              className={`tab-btn ${activeTab === 'controllers' ? 'active' : ''}`}
              onClick={() => setActiveTab('controllers')}
            >
              <Sliders size={15} color="var(--color-emerald)" />
              Estúdio de Controladores (Capítulo 3)
            </button>
          </div>

          <div className="solution-stats" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            <span>Pólos: <strong>{solution.nP}</strong></span>
            <span>•</span>
            <span>Zeros: <strong>{solution.nZ}</strong></span>
            <span>•</span>
            <span>Ramos: <strong>{solution.nP}</strong></span>
          </div>
        </div>

        {/* TAB 1: 10 Steps */}
        {activeTab === 'steps' && (
          <div className="step-card-container">
            {/* Step Navigation Bar */}
            <StepNavigator
              steps={solution.steps}
              currentStepIndex={currentStepIndex}
              onSelectStep={setCurrentStepIndex}
              viewAllMode={viewAllMode}
              onToggleViewAll={() => setViewAllMode((prev) => !prev)}
            />

            {/* Steps Rendering */}
            {viewAllMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {solution.steps.map((step) => (
                  <StepCard key={step.stepNumber} step={step} solution={solution} />
                ))}
              </div>
            ) : (
              <StepCard
                step={solution.steps[currentStepIndex]}
                solution={solution}
              />
            )}
          </div>
        )}

        {/* TAB 2: Point Tester (Section 2.4) */}
        {activeTab === 'tester' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <PointTester
              solution={solution}
              activeTestPoint={activeTestPoint}
              onSetTestPoint={setActiveTestPoint}
            />
            {/* Interactive chart showing vectors to test point */}
            <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Visualização Geométrica dos Vetores Angulares (θᵢ e ϕⱼ)
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Vetores tracejados conectam os pólos/zeros até o ponto s₁
                </span>
              </div>
              <LgrPlot
                solution={solution}
                stepNumber={10}
                testPoint={activeTestPoint}
                height={450}
              />
            </div>
          </div>
        )}

        {/* TAB 3: Controller Studio (Chapter 3) */}
        {activeTab === 'controllers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ControllerStudio
              currentInput={inputData}
              onApplyController={handleApplyController}
            />
            {/* Real-time root locus display with the applied controller */}
            <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Lugar Geométrico das Raízes do Sistema Compensado
              </strong>
              <LgrPlot solution={solution} stepNumber={10} height={420} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div>
          <strong>Sistemas de Controle </strong> | Lucas Augusto da Silva Cardoso
        </div>
        <div style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}>
          Simulador e Solucionador Passo a Passo do Lugar Geométrico das Raízes (LGR) • 100% Client-side
        </div>
      </footer>

      {/* Modals */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleApplyPreset}
      />

      <DocModal
        isOpen={isDocOpen}
        onClose={() => setIsDocOpen(false)}
      />
    </div>
  );
};

export default App;
