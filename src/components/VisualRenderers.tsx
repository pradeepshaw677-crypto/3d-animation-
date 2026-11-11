import React, { useState, useEffect, useRef } from 'react';
import {
  HIGGS_MODELS_SHEET,
  HIGGS_PIECES_SHEET,
  LookEntry,
  PieceItem,
} from '../data/collectionData';
import { RotateCw, ZoomIn, Eye, Layers, MoveHorizontal } from 'lucide-react';

interface ModelCutoutProps {
  look: LookEntry;
  customUrl?: string;
  processedModels?: Record<number, string>;
  className?: string;
}

export const ModelCutout: React.FC<ModelCutoutProps> = ({
  look,
  customUrl,
  className = 'w-full h-full',
}) => {
  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt={`Look ${look.lookNumber} — ${look.title}`}
        decoding="async"
        draggable={false}
        className={`${className} w-full h-full object-contain object-bottom select-none pointer-events-none block`}
      />
    );
  }

  if (look.sourceType === 'higgs_models') {
    const [x0, x1, y0, y1] = look.modelBox;
    const w = x1 - x0;
    const h = y1 - y0;
    return (
      <svg
        viewBox={`${x0} ${y0} ${w} ${h}`}
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
        className={`${className} w-full h-full block select-none pointer-events-none`}
      >
        <svg x={x0} y={y0} width={w} height={h} viewBox={`${x0} ${y0} ${w} ${h}`}>
          <image href={HIGGS_MODELS_SHEET} width={960} height={540} />
        </svg>
      </svg>
    );
  }

  return (
    <img
      src={look.soloImageUrl}
      alt={`Look ${look.lookNumber} — ${look.title}`}
      decoding="async"
      draggable={false}
      className={`${className} w-full h-full object-contain object-bottom select-none pointer-events-none block`}
    />
  );
};

interface ProductCutoutProps {
  piece: PieceItem;
  customUrl?: string;
  processedPieces?: Record<number, string>;
  colorFilter?: string;
  className?: string;
}

export const ProductCutout: React.FC<ProductCutoutProps> = ({
  piece,
  customUrl,
  colorFilter = 'none',
  className = 'w-full h-full',
}) => {
  const filterStyle = colorFilter && colorFilter !== 'none' ? { filter: colorFilter } : undefined;

  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt={piece.name}
        decoding="async"
        draggable={false}
        style={filterStyle}
        className={`${className} w-full h-full max-w-full max-h-full object-contain select-none pointer-events-none block transition-all duration-200`}
      />
    );
  }

  if (piece.sourceType === 'higgs_pieces') {
    const [x0, x1, y0, y1] = piece.cropBox;
    const w = x1 - x0;
    const h = y1 - y0;
    return (
      <svg
        viewBox={`${x0} ${y0} ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style={filterStyle}
        className={`${className} w-full h-full max-w-full max-h-full block select-none pointer-events-none transition-all duration-200`}
      >
        <svg x={x0} y={y0} width={w} height={h} viewBox={`${x0} ${y0} ${w} ${h}`}>
          <image href={HIGGS_PIECES_SHEET} width={960} height={720} />
        </svg>
      </svg>
    );
  }

  // Render the isolated dress-only view directly from the cached solo PNG using SVG viewBox + curved mannequin neckline mask
  const [nx0, nx1, ny0, ny1] = piece.cropBox;
  const vx = Math.round(nx0 * 720);
  const vy = Math.round(ny0 * 810);
  const vw = Math.max(10, Math.round((nx1 - nx0) * 720));
  const vh = Math.max(10, Math.round((ny1 - ny0) * 810));
  const maskId = `neck-mask-${piece.id}`;

  return (
    <svg
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      preserveAspectRatio="xMidYMid meet"
      aria-label={piece.name}
      style={filterStyle}
      className={`${className} w-full h-full max-w-full max-h-full block select-none pointer-events-none transition-all duration-200`}
    >
      {piece.maskNeckline && (
        <defs>
          <mask id={maskId}>
            <rect x={vx} y={vy} width={vw} height={vh} fill="white" />
            <ellipse
              cx={360}
              cy={vy}
              rx={Math.round(vw * 0.16)}
              ry={Math.round(vh * 0.065)}
              fill="black"
            />
          </mask>
        </defs>
      )}
      <image
        href={piece.soloImageUrl}
        width={720}
        height={810}
        mask={piece.maskNeckline ? `url(#${maskId})` : undefined}
      />
    </svg>
  );
};

interface Studio360ViewerProps {
  piece: PieceItem;
  look: LookEntry;
  processedPieces: Record<number, string>;
  processedModels: Record<number, string>;
  colorFilter?: string;
}

export const Studio360Viewer: React.FC<Studio360ViewerProps> = ({
  piece,
  look,
  colorFilter = 'none',
}) => {
  const [angle, setAngle] = useState<number>(18);
  const [tiltX, setTiltX] = useState<number>(4);
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [subjectMode, setSubjectMode] = useState<'product360' | 'soloModel'>('product360');

  const draggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const startAngleRef = useRef<number>(0);
  const startTiltRef = useRef<number>(0);

  useEffect(() => {
    setSubjectMode('product360');
    setZoomLevel(1);
    setAngle(16);
    setAutoSpin(true);
  }, [piece.id]);

  useEffect(() => {
    if (!autoSpin) return;
    let rafId = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      if (!draggingRef.current) {
        setAngle((prev) => (prev + dt * 0.038) % 360);
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [autoSpin]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    draggingRef.current = true;
    setAutoSpin(false);
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startAngleRef.current = angle;
    startTiltRef.current = tiltX;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    const nextAngle = (((startAngleRef.current + dx * 0.85) % 360) + 360) % 360;
    const nextTilt = Math.max(-14, Math.min(18, startTiltRef.current - dy * 0.12));
    setAngle(nextAngle);
    setTiltX(nextTilt);
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  const normalizedAngle = Math.round(((angle % 360) + 360) % 360);

  return (
    <div className="flex flex-col gap-3">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-[380px] sm:h-[460px] w-full rounded-[28px] bg-[radial-gradient(circle_at_50%_28%,#ffffff_0%,#eef3f9_58%,#dfe8f3_100%)] border border-slate-200/90 shadow-inner overflow-hidden cursor-grab active:cursor-grabbing select-none flex flex-col justify-between p-4 sm:p-6"
      >
        <div className="relative z-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs text-[11px] font-semibold text-slate-800">
            <MoveHorizontal className="w-3.5 h-3.5 text-amber-600" />
            <span className="tabular-nums">3D 360° • {normalizedAngle}°</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAutoSpin((s) => !s)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                autoSpin
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white/90 text-slate-700 border border-slate-200 hover:bg-white'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoSpin ? 'animate-spin' : ''}`} />
              <span>{autoSpin ? '360° Spinning' : 'Auto-Spin 360°'}</span>
            </button>

            <button
              type="button"
              onClick={() => setZoomLevel((z) => (z === 1 ? 1.35 : 1))}
              className={`p-2 rounded-full border transition-all ${
                zoomLevel > 1
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white'
              }`}
              title="Toggle Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className="relative z-10 flex-1 flex items-center justify-center my-2"
          style={{ perspective: '1400px' }}
        >
          <div
            className="relative w-[260px] h-[280px] sm:w-[320px] sm:h-[340px] flex items-center justify-center"
            style={{
              transformStyle: 'preserve-3d',
              transform: `scale(${zoomLevel}) rotateX(${tiltX}deg) rotateY(${angle}deg)`,
              transition: draggingRef.current ? 'none' : 'transform 60ms linear',
            }}
          >
            {subjectMode === 'product360' ? (
              <ProductCutout
                piece={piece}
                colorFilter={colorFilter}
                className="w-full h-full"
              />
            ) : (
              <ModelCutout look={look} className="w-full h-full" />
            )}
          </div>
        </div>

        <div className="relative z-20 flex items-center justify-between gap-2 bg-white/85 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSubjectMode('product360')}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                subjectMode === 'product360'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Product 360°</span>
            </button>
            <button
              type="button"
              onClick={() => setSubjectMode('soloModel')}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                subjectMode === 'soloModel'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Full Model</span>
            </button>
          </div>

          <input
            type="range"
            min={0}
            max={360}
            value={normalizedAngle}
            onChange={(e) => {
              setAutoSpin(false);
              setAngle(Number(e.target.value));
            }}
            className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
          />
        </div>
      </div>
    </div>
  );
};
