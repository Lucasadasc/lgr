import React, { useState } from 'react';
import { PresetItem } from '../types/lgr';
import { PRESETS } from '../data/presets';
import { X, BookCheck, Search } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetItem) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const [filter, setFilter] = useState<'all' | 'exemplo' | 'exercicio' | 'tipica'>('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = PRESETS.filter((p) => {
    const matchCat = filter === 'all' || p.category === filter;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BookCheck size={22} color="var(--color-cyan)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Biblioteca de Exercícios & Exemplos (DCA/UFRN)</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Filters and search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="tabs-container">
            <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              Todos ({PRESETS.length})
            </button>
            <button className={`tab-btn ${filter === 'exemplo' ? 'active' : ''}`} onClick={() => setFilter('exemplo')}>
              Exemplos Resolvidos
            </button>
            <button className={`tab-btn ${filter === 'exercicio' ? 'active' : ''}`} onClick={() => setFilter('exercicio')}>
              Exercícios 2.5
            </button>
            <button className={`tab-btn ${filter === 'tipica' ? 'active' : ''}`} onClick={() => setFilter('tipica')}>
              Tabela 2.3 (Casos Típicos)
            </button>
          </div>

          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
              placeholder="Buscar por termo ou equação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        {/* Presets Grid */}
        <div className="preset-grid">
          {filtered.map((preset) => (
            <div
              key={preset.id}
              className="preset-card"
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: preset.category === 'exemplo' ? '#38bdf8' : preset.category === 'exercicio' ? '#10b981' : '#f59e0b',
                  }}
                >
                  {preset.category === 'exemplo' ? 'Exemplo da Apostila' : preset.category === 'exercicio' ? 'Exercício Prático' : 'Forma Canônica'}
                </span>
                {preset.testPoint && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-purple)', fontWeight: 600 }}>
                    Com Ponto de Teste
                  </span>
                )}
              </div>
              <span className="preset-title">{preset.name}</span>
              <p className="preset-desc">{preset.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
