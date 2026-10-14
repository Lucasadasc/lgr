export type Tema = 'light' | 'dark';

// Os gráficos consultam os mesmos tokens CSS usados nas duas unidades.
export function coresDoTema() {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    surface: token('--bg-plot'),
    ink: token('--text-primary'),
    muted: token('--text-secondary'),
    grid: token('--border-subtle'),
    border: token('--border-strong'),
    pole: token('--color-pole'),
    zero: token('--color-zero'),
    locus: token('--color-locus'),
    font: token('--font-sans'),
  };
}
