import React from 'react';
import { Sun, Moon, BookOpen, Activity, FileText } from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenPresets: () => void;
  onOpenDoc: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenPresets,
  onOpenDoc,
}) => {
  return (
    <header className="header-wrapper">
      <div className="header-content">
        {/* Brand */}
        <div className="header-brand">
          <div className="brand-icon">
            <Activity size={24} />
          </div>
          <div className="brand-titles">
            <h1>LGR Master • Sistemas de Controle</h1>
            <div className="brand-subtitle subtitle-center">
              <span>Lucas Augusto da Silva Cardoso</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onOpenPresets} style={{ fontSize: '0.825rem' }}>
            <BookOpen size={15} color="var(--color-cyan)" />
            <span>Exemplos & Exercícios</span>
          </button>

          <button className="btn btn-secondary" onClick={onOpenDoc} style={{ fontSize: '0.825rem' }}>
            <FileText size={15} color="var(--color-blue)" />
            <span>Guia Teórico</span>
          </button>

          <button
            className="btn btn-secondary btn-icon"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#3b82f6" />}
          </button>
        </div>
      </div>
    </header>
  );
};
