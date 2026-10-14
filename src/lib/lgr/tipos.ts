// Tipos compartilhados do LGR (Lugar Geométrico das Raízes)

export interface Complex {
  re: number;
  im: number;
}

export interface BreakPoint {
  s: Complex;
  K: number;
}

export interface Cruzamento {
  K: number;
  w: number;
}
