import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ComplexNum, LgrSolution, LgrTrajectoryPoint } from '../types/lgr';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair } from 'lucide-react';

interface LgrPlotProps {
  solution: LgrSolution;
  stepNumber: number; // 3, 4, 7, 9, 10
  testPoint?: ComplexNum | null;
  interactive?: boolean;
  height?: number;
}

export const LgrPlot: React.FC<LgrPlotProps> = ({
  solution,
  stepNumber,
  testPoint = null,
  interactive = true,
  height = 420,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport transforms (center in mathematical coordinates, scale in pixels per unit)
  const [view, setView] = useState({
    centerX: -2,
    centerY: 0,
    scale: 45, // pixels per unit
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    re: number;
    im: number;
    k?: number;
    zeta?: number;
    wn?: number;
    os?: number;
    ts?: number;
  } | null>(null);

  // Auto-fit initial bounds
  const resetView = useCallback(() => {
    const allX: number[] = [];
    const allY: number[] = [];

    solution.poles.forEach((p) => {
      allX.push(p.re);
      allY.push(Math.abs(p.im));
    });
    solution.zeros.forEach((z) => {
      allX.push(z.re);
      allY.push(Math.abs(z.im));
    });

    if (solution.asymptotes.numAsymptotes > 0) {
      allX.push(solution.asymptotes.sigmaA);
    }

    if (solution.imaginaryCrossings.length > 0) {
      solution.imaginaryCrossings.forEach((c) => allY.push(c.omega));
    }

    // Include real-axis breakaway/break-in points so the locus is not clipped
    // before a branch reaches its next real-axis intersection.
    solution.validBreakaways.forEach((b) => {
      allX.push(b.s.re);
      allY.push(Math.abs(b.s.im));
    });

    // Include the useful visible portion of the trajectories without letting
    // the branch that tends to infinity determine the entire viewport.
    const locusExtent = Math.max(...allX.map((x) => Math.abs(x)), 1) * 3;
    solution.trajectories.forEach((branch) => {
      branch.forEach((point) => {
        if (Math.abs(point.re) <= locusExtent) {
          allX.push(point.re);
          allY.push(Math.abs(point.im));
        }
      });
    });

    const minX = allX.length > 0 ? Math.min(...allX) - 2 : -6;
    const maxX = allX.length > 0 ? Math.max(...allX) + 2 : 2;
    const maxY = allY.length > 0 ? Math.max(...allY) + 2 : 5;

    const spanX = Math.max(maxX - minX, 4);
    const spanY = Math.max(maxY * 2, 4);

    const canvasWidth = containerRef.current?.clientWidth || 600;
    const canvasHeight = height;

    const scaleX = (canvasWidth * 0.75) / spanX;
    const scaleY = (canvasHeight * 0.75) / spanY;
    const autoScale = Math.min(Math.max(Math.min(scaleX, scaleY), 8), 100);

    setView({
      centerX: (minX + maxX) / 2,
      centerY: 0,
      scale: autoScale,
    });
    setHoverInfo(null);
  }, [solution, height]);

  // Initial fit
  useEffect(() => {
    resetView();
  }, [resetView]);

  // Coordinate transformations
  const mathToScreen = useCallback(
    (re: number, im: number, width: number, h: number) => {
      const cx = width / 2;
      const cy = h / 2;
      return {
        x: cx + (re - view.centerX) * view.scale,
        y: cy - (im - view.centerY) * view.scale,
      };
    },
    [view]
  );

  const screenToMath = useCallback(
    (x: number, y: number, width: number, h: number) => {
      const cx = width / 2;
      const cy = h / 2;
      return {
        re: view.centerX + (x - cx) / view.scale,
        im: view.centerY - (y - cy) / view.scale,
      };
    },
    [view]
  );

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    const h = (canvas.height = height);

    // Clear background
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    ctx.fillStyle = isDark ? '#060911' : '#f8fafc';
    ctx.fillRect(0, 0, width, h);

    // 1. Draw Grid Lines
    const stepSize = view.scale > 60 ? 1 : view.scale > 25 ? 2 : 5;
    const bounds = {
      minRe: screenToMath(0, h, width, h).re,
      maxRe: screenToMath(width, 0, width, h).re,
      minIm: screenToMath(0, h, width, h).im,
      maxIm: screenToMath(width, 0, width, h).im,
    };

    ctx.lineWidth = 1;
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.06)';
    ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(15, 23, 42, 0.4)';
    ctx.font = '10px Fira Code, monospace';

    const startX = Math.floor(bounds.minRe / stepSize) * stepSize;
    const endX = Math.ceil(bounds.maxRe / stepSize) * stepSize;
    for (let x = startX; x <= endX; x += stepSize) {
      const pt = mathToScreen(x, 0, width, h);
      ctx.beginPath();
      ctx.moveTo(pt.x, 0);
      ctx.lineTo(pt.x, h);
      ctx.stroke();

      if (Math.abs(x) > 1e-4) {
        ctx.fillText(`${x}`, pt.x + 3, h / 2 + 12);
      }
    }

    const startY = Math.floor(bounds.minIm / stepSize) * stepSize;
    const endY = Math.ceil(bounds.maxIm / stepSize) * stepSize;
    for (let y = startY; y <= endY; y += stepSize) {
      const pt = mathToScreen(0, y, width, h);
      ctx.beginPath();
      ctx.moveTo(0, pt.y);
      ctx.lineTo(width, pt.y);
      ctx.stroke();

      if (Math.abs(y) > 1e-4) {
        ctx.fillText(`${y > 0 ? '+' : ''}${y}j`, width / 2 + 5, pt.y - 3);
      }
    }

    // 2. Main Axes (Real σ & Imaginary jω)
    const origin = mathToScreen(0, 0, width, h);

    // Real Axis
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(15, 23, 42, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(width, origin.y);
    ctx.stroke();

    // Imaginary Axis
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, h);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('Re (σ)', width - 48, origin.y - 8);
    ctx.fillText('Im (jω)', origin.x + 8, 16);

    // 3. Highlight Real Segments (Steps >= 4)
    if (stepNumber >= 4) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#10b981';
      ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
      ctx.shadowBlur = 8;

      for (const seg of solution.realSegments) {
        const startX = isFinite(seg.start) ? seg.start : bounds.minRe - 5;
        const endX = seg.end;

        const p1 = mathToScreen(startX, 0, width, h);
        const p2 = mathToScreen(endX, 0, width, h);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    // 4. Asymptotes (Steps >= 7)
    if (stepNumber >= 7 && solution.asymptotes.numAsymptotes > 0) {
      const sigmaA = solution.asymptotes.sigmaA;
      const sigmaScreen = mathToScreen(sigmaA, 0, width, h);

      // Draw sigmaA point
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(sigmaScreen.x, sigmaScreen.y, 4.5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`σ_A = ${sigmaA}`, sigmaScreen.x - 15, sigmaScreen.y - 8);

      // Draw asymptote rays
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.75)';
      ctx.lineWidth = 1.5;

      const rayLength = Math.max(width, h) * 1.5;
      for (const rad of solution.asymptotes.anglesRad) {
        ctx.beginPath();
        ctx.moveTo(sigmaScreen.x, sigmaScreen.y);
        ctx.lineTo(
          sigmaScreen.x + rayLength * Math.cos(rad),
          sigmaScreen.y - rayLength * Math.sin(rad)
        );
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // 5. Breakaway Points (Steps >= 8 or 9 or 10)
    if (stepNumber >= 8) {
      for (const b of solution.validBreakaways) {
        const pt = mathToScreen(b.s.re, b.s.im, width, h);
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#fbcfe8';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(`s = ${b.s.re}`, pt.x - 12, pt.y + 14);
      }
    }

    // 6. Imaginary Crossings (Steps >= 9)
    if (stepNumber >= 9 && solution.imaginaryCrossings.length > 0) {
      for (const cross of solution.imaginaryCrossings) {
        const pPos = mathToScreen(0, cross.omega, width, h);
        const pNeg = mathToScreen(0, -cross.omega, width, h);

        [pPos, pNeg].forEach((pt, idx) => {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          // Draw diamond
          ctx.moveTo(pt.x, pt.y - 6);
          ctx.lineTo(pt.x + 6, pt.y);
          ctx.lineTo(pt.x, pt.y + 6);
          ctx.lineTo(pt.x - 6, pt.y);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#fed7aa';
          ctx.font = '10px Fira Code, monospace';
          ctx.fillText(
            `${idx === 0 ? '+' : '-'}${cross.omega}j (K=${cross.kLim})`,
            pt.x + 10,
            pt.y + 3
          );
        });
      }
    }

    // 7. Full Root Locus Trajectories (Step 10)
    if (stepNumber >= 10 && solution.trajectories.length > 0) {
      ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
      ctx.shadowBlur = 4;

      const colors = ['#10b981', '#38bdf8', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4'];

      solution.trajectories.forEach((branch, bIdx) => {
        if (branch.length < 2) return;
        ctx.strokeStyle = colors[bIdx % colors.length];
        ctx.beginPath();
        const first = mathToScreen(branch[0].re, branch[0].im, width, h);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < branch.length; i++) {
          const pt = mathToScreen(branch[i].re, branch[i].im, width, h);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Departure angle tangents for complex poles
      solution.departureAngles.forEach((dep) => {
        const poleScreen = mathToScreen(dep.point.re, dep.point.im, width, h);
        const arrowLen = 35;
        const rad = dep.angleRad;
        const endX = poleScreen.x + arrowLen * Math.cos(rad);
        const endY = poleScreen.y - arrowLen * Math.sin(rad);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(poleScreen.x, poleScreen.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.fillStyle = '#fca5a5';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(`θ = ${dep.angleDeg}°`, endX + 4, endY - 4);
      });
    }

    // 8. Test Point Vectors & Marker (if active)
    if (testPoint) {
      const tpScreen = mathToScreen(testPoint.re, testPoint.im, width, h);

      // Draw dashed vectors to all poles
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.2;
      solution.poles.forEach((p) => {
        const pScreen = mathToScreen(p.re, p.im, width, h);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.beginPath();
        ctx.moveTo(pScreen.x, pScreen.y);
        ctx.lineTo(tpScreen.x, tpScreen.y);
        ctx.stroke();
      });

      // Draw dashed vectors to all zeros
      solution.zeros.forEach((z) => {
        const zScreen = mathToScreen(z.re, z.im, width, h);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.beginPath();
        ctx.moveTo(zScreen.x, zScreen.y);
        ctx.lineTo(tpScreen.x, tpScreen.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Test point target marker
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(tpScreen.x, tpScreen.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#f3e8ff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(
        `s₁ (${testPoint.re}, ${testPoint.im > 0 ? '+' : ''}${testPoint.im}j)`,
        tpScreen.x + 8,
        tpScreen.y - 8
      );
    }

    // 9. Open-Loop Zeros (○ - Blue/Cyan) (Steps >= 3)
    if (stepNumber >= 3) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#06b6d4';
      ctx.fillStyle = isDark ? '#060911' : '#ffffff';

      solution.zeros.forEach((z) => {
        const pt = mathToScreen(z.re, z.im, width, h);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        if (z.multiplicity > 1) {
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 9px Inter, sans-serif';
          ctx.fillText(`(${z.multiplicity})`, pt.x + 8, pt.y - 6);
        }
      });
    }

    // 10. Open-Loop Poles (× - Red) (Steps >= 3)
    if (stepNumber >= 3) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ef4444';

      solution.poles.forEach((p) => {
        const pt = mathToScreen(p.re, p.im, width, h);
        const s = 6;
        ctx.beginPath();
        ctx.moveTo(pt.x - s, pt.y - s);
        ctx.lineTo(pt.x + s, pt.y + s);
        ctx.moveTo(pt.x + s, pt.y - s);
        ctx.lineTo(pt.x - s, pt.y + s);
        ctx.stroke();

        if (p.multiplicity > 1) {
          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 9px Inter, sans-serif';
          ctx.fillText(`(${p.multiplicity})`, pt.x + 8, pt.y - 6);
        }
      });
    }
  }, [solution, stepNumber, testPoint, view, mathToScreen, screenToMath, height]);

  // Mouse / Touch Interactivity
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setView((prev) => ({
        ...prev,
        centerX: prev.centerX - dx / prev.scale,
        centerY: prev.centerY + dy / prev.scale,
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Hover detection on LGR curve or poles/zeros
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const mPt = screenToMath(mouseX, mouseY, canvas.width, canvas.height);

    // Check nearest trajectory point
    let nearest: LgrTrajectoryPoint | null = null;
    let minDist = Infinity;

    solution.trajectories.forEach((branch) => {
      branch.forEach((pt) => {
        const dist = Math.hypot(pt.re - mPt.re, pt.im - mPt.im);
        if (dist < minDist && dist * view.scale < 16) {
          minDist = dist;
          nearest = pt;
        }
      });
    });

    if (nearest) {
      const n = nearest as LgrTrajectoryPoint;
      const re = n.re;
      const im = n.im;
      const wn = Math.hypot(re, im);
      const zeta = wn > 1e-4 ? -re / wn : 0;
      const os = zeta > 0 && zeta < 1 ? Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)) * 100 : 0;
      const ts = zeta > 0 && wn > 0 ? 4 / (zeta * wn) : 0;

      setHoverInfo({
        x: mouseX,
        y: mouseY,
        re: parseFloat(re.toFixed(3)),
        im: parseFloat(im.toFixed(3)),
        k: parseFloat(n.k.toFixed(3)),
        zeta: parseFloat(zeta.toFixed(3)),
        wn: parseFloat(wn.toFixed(3)),
        os: parseFloat(os.toFixed(1)),
        ts: parseFloat(ts.toFixed(2)),
      });
    } else {
      setHoverInfo(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setView((prev) => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * zoomFactor, 8), 350),
    }));
  };

  const zoomIn = () => setView((p) => ({ ...p, scale: Math.min(p.scale * 1.25, 350) }));
  const zoomOut = () => setView((p) => ({ ...p, scale: Math.max(p.scale * 0.8, 8) }));

  return (
    <div className="plot-container" ref={containerRef}>
      <div className="plot-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <Crosshair size={15} color="var(--color-cyan)" />
          <span>Plano Complexo s (σ + jω) — Passo {stepNumber}</span>
        </div>
        <div className="plot-toolbar">
          <button className="plot-btn" onClick={zoomIn} title="Aumentar Zoom">
            <ZoomIn size={14} />
          </button>
          <button className="plot-btn" onClick={zoomOut} title="Diminuir Zoom">
            <ZoomOut size={14} />
          </button>
          <button className="plot-btn" onClick={resetView} title="Redefinir Visualização">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="plot-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="plot-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        />

        {hoverInfo && (
          <div
            className="canvas-tooltip"
            style={{ left: `${hoverInfo.x}px`, top: `${hoverInfo.y}px` }}
          >
            <div><strong>s:</strong> {hoverInfo.re} {hoverInfo.im >= 0 ? '+' : ''}{hoverInfo.im}j</div>
            {hoverInfo.k !== undefined && <div><strong>Ganho K:</strong> {hoverInfo.k}</div>}
            {hoverInfo.zeta !== undefined && hoverInfo.zeta > 0 && (
              <>
                <div><strong>Amortecimento (ζ):</strong> {hoverInfo.zeta}</div>
                <div><strong>Freq. Natural (ωₙ):</strong> {hoverInfo.wn} rad/s</div>
                <div><strong>Sobressinal (OS%):</strong> {hoverInfo.os}%</div>
                <div><strong>Tempo Acomod. (Tₛ 2%):</strong> ~{hoverInfo.ts} s</div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="plot-legend">
        <div className="legend-item">
          <span className="legend-icon" style={{ color: '#ef4444' }}>×</span>
          <span>Pólos (K=0)</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon" style={{ color: '#06b6d4' }}>○</span>
          <span>Zeros (K→∞)</span>
        </div>
        {stepNumber >= 4 && (
          <div className="legend-item">
            <span style={{ display: 'inline-block', width: 12, height: 3, background: '#10b981', marginRight: 4 }} />
            <span>Trecho Real</span>
          </div>
        )}
        {stepNumber >= 7 && solution.asymptotes.numAsymptotes > 0 && (
          <div className="legend-item">
            <span style={{ display: 'inline-block', width: 12, height: 2, borderTop: '2px dashed #eab308', marginRight: 4 }} />
            <span>Assíntotas</span>
          </div>
        )}
        {stepNumber >= 8 && solution.validBreakaways.length > 0 && (
          <div className="legend-item">
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ec4899', marginRight: 4 }} />
            <span>Saída/Entrada</span>
          </div>
        )}
        {stepNumber >= 9 && solution.imaginaryCrossings.length > 0 && (
          <div className="legend-item">
            <span style={{ display: 'inline-block', width: 8, height: 8, background: '#f97316', transform: 'rotate(45deg)', marginRight: 4 }} />
            <span>Cruzamento jω</span>
          </div>
        )}
        {stepNumber >= 10 && (
          <div className="legend-item">
            <span style={{ display: 'inline-block', width: 12, height: 3, background: '#10b981', marginRight: 4 }} />
            <span>Curva do LGR</span>
          </div>
        )}
      </div>
    </div>
  );
};
