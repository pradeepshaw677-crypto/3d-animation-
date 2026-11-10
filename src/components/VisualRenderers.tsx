import React, { useState, useEffect, useRef } from 'react';
import {
  HIGGS_MODELS_SHEET,
  HIGGS_PIECES_SHEET,
  LookEntry,
  PieceItem,
} from '../data/collectionData';
import { RotateCw, ZoomIn, Sparkles, Eye, Layers, MoveHorizontal } from 'lucide-react';

interface ModelCutoutProps {
  look: LookEntry;
  processedModels: Record<number, string>;
  className?: string;
}

export const ModelCutout: React.FC<ModelCutoutProps> = ({
  look,
  processedModels,
  className = 'w-full h-full',
}) => {
  const readyPng = processedModels[look.lookNumber];

  if (readyPng) {
    return (
      <img
        src={readyPng}
        alt={`Look ${look.lookNumber} — ${look.title}`}
        referrerPolicy="no-referrer"
        draggable={false}
        className={`${className} h-full w-auto mx-auto object-contain select-none pointer-events-none block`}
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
        aria-hidden="true"
        className={`${className} h-full w-auto mx-auto block select-none pointer-events-none`}
      >
        <svg x={x0} y={y0} width={w} height={h} viewBox={`${x0} ${y0} ${w} ${h}`}>
          <image href={HIGGS_MODELS_SHEET} width={960} height={540} />
        </svg>
      </svg>
    );
  }

  // Tight vertical crop (y: 90..755 on 600x800) so fallback matches normalized Look 6 height immediately
  return (
    <svg
      viewBox="30 90 540 665"
      aria-hidden="true"
      className={`${className} h-full w-auto mx-auto block select-none pointer-events-none mix-blend-multiply`}
    >
      <svg x={30} y={90} width={540} height={665} viewBox="30 90 540 665">
        <image href={look.soloImageUrl} width={600} height={800} preserveAspectRatio="none" />
      </svg>
    </svg>
  );
};

interface ProductCutoutProps {
  piece: PieceItem;
  processedPieces: Record<number, string>;
  colorFilter?: string;
  className?: string;
}

export const ProductCutout: React.FC<ProductCutoutProps> = ({
  piece,
  processedPieces,
  colorFilter = 'none',
  className = 'w-full h-full',
}) => {
  const readyPng = processedPieces[piece.id];
  const filterStyle = colorFilter && colorFilter !== 'none' ? { filter: colorFilter } : undefined;

  if (readyPng) {
    return (
      <img
        src={readyPng}
        alt={piece.name}
        referrerPolicy="no-referrer"
        draggable={false}
        style={filterStyle}
        className={`${className} object-contain select-none pointer-events-none block transition-all duration-200`}
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
        aria-hidden="true"
        style={filterStyle}
        className={`${className} block select-none pointer-events-none transition-all duration-200`}
      >
        <svg x={x0} y={y0} width={w} height={h} viewBox={`${x0} ${y0} ${w} ${h}`}>
          <image href={HIGGS_PIECES_SHEET} width={960} height={720} />
        </svg>
      </svg>
    );
  }

  // Instant SVG crop fallback for solo garment before canvas extraction completes
  const [nx0, nx1, ny0, ny1] = piece.cropBox;
  const vx = nx0 * 600;
  const vy = ny0 * 800;
  const vw = (nx1 - nx0) * 600;
  const vh = (ny1 - ny0) * 800;

  return (
    <svg
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      aria-hidden="true"
      style={filterStyle}
      className={`${className} block select-none pointer-events-none mix-blend-multiply transition-all duration-200`}
    >
      <svg x={vx} y={vy} width={vw} height={vh} viewBox={`${vx} ${vy} ${vw} ${vh}`}>
        <image href={piece.soloImageUrl} width={600} height={800} preserveAspectRatio="none" />
      </svg>
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
  processedPieces,
  processedModels,
  colorFilter = 'none',
}) => {
  const [angle, setAngle] = useState<number>(18);
  const [tiltX, setTiltX] = useState<number>(4);
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  // Strictly separate 'product360' (only the isolated dress/product) and 'soloModel' (only the model)
  // so they NEVER overlay or overlap each other!
  const [subjectMode, setSubjectMode] = useState<'product360' | 'soloModel'>('product360');

  const draggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const startAngleRef = useRef<number>(0);
  const startTiltRef = useRef<number>(0);

  // Reset to isolated dress 360 view whenever product changes
  useEffect(() => {
    setSubjectMode('product360');
    setZoomLevel(1);
    setAngle(16);
    setAutoSpin(true);
  }, [piece.id]);

  // Smooth 60fps auto-rotation when autoSpin is enabled
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
  const rad = (normalizedAngle * Math.PI) / 180;
  const lightShiftX = Math.sin(rad) * 45;
  const isBackFacing = normalizedAngle > 90 && normalizedAngle < 270;

  // Volumetric depth slices for 3D sculptural thickness at all 360 degrees
  const depthSlices = [-14, -10, -6, -3, 3, 6, 10, 14];

  return (
    <div className="flex flex-col gap-3">
      {/* Main 3D 360° Interactive Studio Stage */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-[380px] sm:h-[470px] lg:h-[520px] w-full rounded-[28px] bg-[radial-gradient(circle_at_50%_28%,#ffffff_0%,#eef3f9_58%,#dfe8f3_100%)] border border-slate-200/90 shadow-inner overflow-hidden cursor-grab active:cursor-grabbing select-none flex flex-col justify-between p-4 sm:p-6"
      >
        {/* Top Studio HUD Row */}
        <div className="relative z-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm text-[11px] font-semibold text-slate-800">
            <MoveHorizontal className="w-3.5 h-3.5 text-amber-600" />
            <span className="tabular-nums">3D 360° Studio • {normalizedAngle}°</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">
              {isBackFacing ? 'Back Tailoring View' : 'Front Couture View'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAutoSpin((s) => !s)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                autoSpin
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white/90 text-slate-700 border border-slate-200 hover:bg-white'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoSpin ? 'animate-spin' : ''}`} />
              <span>{autoSpin ? '360° Spinning' : 'Auto-Spin 360°'}</span>
            </button>

            <button
              type="button"
              onClick={() => setZoomLevel((z) => (z === 1 ? 1.45 : 1))}
              className={`p-2 rounded-full border transition-all ${
                zoomLevel > 1
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white'
              }`}
              title="Toggle 2x Fabric Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Studio Spotlight Beam */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-transform duration-75"
          style={{
            background: `radial-gradient(circle at ${50 + lightShiftX * 0.45}% 38%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 62%)`,
          }}
        />

        {/* Center 3D Perspective Viewport (Strictly isolated single subject — NO overlapping!) */}
        <div
          className="relative z-10 flex-1 flex items-center justify-center my-2"
          style={{ perspective: '1400px' }}
        >
          <div
            className="relative w-[240px] h-[260px] sm:w-[300px] sm:h-[330px] flex items-center justify-center"
            style={{
              transformStyle: 'preserve-3d',
              transform: `scale(${zoomLevel}) rotateX(${tiltX}deg) rotateY(${angle}deg)`,
              transition: draggingRef.current ? 'none' : 'transform 60ms linear',
            }}
          >
            {/* Volumetric 3D Extrusion Slices for realistic 360° garment thickness */}
            {depthSlices.map((zOffset, idx) => (
              <div
                key={zOffset}
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `translateZ(${zOffset}px)`,
                  opacity: 0.22,
                  filter:
                    idx < depthSlices.length / 2
                      ? 'brightness(0.72) contrast(1.15)'
                      : 'brightness(0.88)',
                }}
              >
                {subjectMode === 'product360' ? (
                  <ProductCutout
                    piece={piece}
                    processedPieces={processedPieces}
                    colorFilter={colorFilter}
                    className="w-full h-full"
                  />
                ) : (
                  <ModelCutout
                    look={look}
                    processedModels={processedModels}
                    className="w-full h-full"
                  />
                )}
              </div>
            ))}

            {/* Front 0° High-Resolution Face */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: 'translateZ(16px)',
                backfaceVisibility: 'hidden',
              }}
            >
              {subjectMode === 'product360' ? (
                <ProductCutout
                  piece={piece}
                  processedPieces={processedPieces}
                  colorFilter={colorFilter}
                  className="w-full h-full drop-shadow-[0_22px_28px_rgba(15,23,42,0.18)]"
                />
              ) : (
                <ModelCutout
                  look={look}
                  processedModels={processedModels}
                  className="w-full h-full drop-shadow-[0_22px_28px_rgba(15,23,42,0.18)]"
                />
              )}
            </div>

            {/* Back 180° Couture Tailoring Face */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: 'rotateY(180deg) translateZ(16px)',
                backfaceVisibility: 'hidden',
                filter: 'brightness(0.93) contrast(1.06)',
              }}
            >
              {subjectMode === 'product360' ? (
                <ProductCutout
                  piece={piece}
                  processedPieces={processedPieces}
                  colorFilter={colorFilter}
                  className="w-full h-full drop-shadow-[0_22px_28px_rgba(15,23,42,0.22)]"
                />
              ) : (
                <ModelCutout
                  look={look}
                  processedModels={processedModels}
                  className="w-full h-full drop-shadow-[0_22px_28px_rgba(15,23,42,0.22)]"
                />
              )}
            </div>
          </div>

          {/* 3D Rotating Turntable Compass Pedestal underneath the garment */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1 w-[230px] h-[230px] sm:w-[290px] sm:h-[290px] rounded-full border-2 border-slate-400/35 flex items-center justify-center"
            style={{
              transform: `rotateX(77deg) rotateZ(${-angle}deg)`,
              background:
                'radial-gradient(circle, rgba(15,23,42,0.14) 0%, rgba(15,23,42,0.04) 55%, rgba(255,255,255,0) 72%)',
              boxShadow: '0 18px 40px rgba(15,23,42,0.15)',
            }}
          >
            <div className="w-[82%] h-[82%] rounded-full border border-dashed border-slate-500/40" />
            <span className="absolute -top-2.5 px-2 py-0.5 rounded bg-slate-900 text-white text-[9px] font-mono">
              0° FRONT
            </span>
            <span className="absolute -bottom-2.5 px-2 py-0.5 rounded bg-slate-700 text-white text-[9px] font-mono rotate-180">
              180° BACK
            </span>
            <span className="absolute -right-3 px-1.5 py-0.5 rounded bg-slate-500 text-white text-[8px] font-mono rotate-90">
              90°
            </span>
            <span className="absolute -left-3 px-1.5 py-0.5 rounded bg-slate-500 text-white text-[8px] font-mono -rotate-90">
              270°
            </span>
          </div>
        </div>

        {/* Bottom Interactive Controls inside Stage: Mode Switcher + 360° Degree Scrub Bar */}
        <div className="relative z-20 flex flex-col gap-2.5 bg-white/85 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Subject Switcher: Isolated Dress 3D 360 vs Full Solo Look */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSubjectMode('product360')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                  subjectMode === 'product360'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Isolated Product 360°</span>
              </button>
              <button
                type="button"
                onClick={() => setSubjectMode('soloModel')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                  subjectMode === 'soloModel'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Solo Model Look #{look.lookNumber}</span>
              </button>
            </div>

            {/* Quick Angle Presets */}
            <div className="flex items-center gap-1">
              {[
                { label: '0° Front', deg: 0 },
                { label: '45° 3D', deg: 45 },
                { label: '90° Side', deg: 90 },
                { label: '180° Back', deg: 180 },
                { label: '315° 3D', deg: 315 },
              ].map((preset) => (
                <button
                  key={preset.deg}
                  type="button"
                  onClick={() => {
                    setAutoSpin(false);
                    setAngle(preset.deg);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                    Math.abs(normalizedAngle - preset.deg) < 15
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 360° Smooth Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap shrink-0">
              Drag or Slide 360°
            </span>
            <input
              type="range"
              min={0}
              max={360}
              value={normalizedAngle}
              onChange={(e) => {
                setAutoSpin(false);
                setAngle(Number(e.target.value));
              }}
              aria-label="Rotate product 360 degrees"
              className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            <span className="text-[11px] font-mono font-semibold text-slate-900 w-10 text-right tabular-nums">
              {normalizedAngle}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
