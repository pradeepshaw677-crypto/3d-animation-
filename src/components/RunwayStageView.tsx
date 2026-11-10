import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LOOKS_DATA, PIECES_DATA, LookEntry, PieceItem } from '../data/collectionData';
import { ModelCutout, ProductCutout } from './VisualRenderers';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Plus,
  Rotate3d,
  MoveHorizontal,
  Grid,
} from 'lucide-react';

interface RunwayStageViewProps {
  initialLookIndex: number;
  processedModels: Record<number, string>;
  processedPieces: Record<number, string>;
  favorites: number[];
  onToggleFavorite: (pieceId: number) => void;
  onQuickAddToCart: (piece: PieceItem) => void;
  onOpenProductPage: (pieceId: number, lookIndex: number) => void;
  onOpenCatalogPage: () => void;
}

const TOTAL_LOOKS = 20;

// 7-stop depth table for d in [-1, 0, 1, 2, 3, 4, 5]
// Spaced wide apart horizontally so adjacent models NEVER overlap on mobile or desktop
const KX = [1.06, 0.77, 0.50, 0.30, 0.16, 0.06, -0.04];
const KY = [0.95, 0.91, 0.84, 0.77, 0.71, 0.66, 0.62];
const KS = [0.88, 0.76, 0.56, 0.41, 0.29, 0.20, 0.14];
const KB = [12, 0, 2.2, 5.5, 10, 15, 20];
const KO = [0, 1, 0.92, 0.76, 0.52, 0.26, 0];

function wrap(v: number, m: number): number {
  return ((v % m) + m) % m;
}

function sample(arr: number[], d: number): number {
  const x = Math.max(0, Math.min(arr.length - 1.0001, d + 1));
  const i = Math.floor(x);
  const f = x - i;
  return arr[i] + (arr[i + 1] - arr[i]) * f;
}

export const RunwayStageView: React.FC<RunwayStageViewProps> = ({
  initialLookIndex,
  processedModels,
  processedPieces,
  favorites,
  onToggleFavorite,
  onQuickAddToCart,
  onOpenProductPage,
  onOpenCatalogPage,
}) => {
  const [activeLookIdx, setActiveLookIdx] = useState<number>(initialLookIndex);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const modelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const pRef = useRef<number>(initialLookIndex);
  const targetRef = useRef<number>(initialLookIndex);
  const draggingRef = useRef<boolean>(false);
  const movedRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startTRef = useRef<number>(0);

  const stepToLook = useCallback((nextTarget: number) => {
    targetRef.current = nextTarget;
  }, []);

  const jumpToLookIndex = useCallback((lookIdx: number) => {
    const currentMod = wrap(Math.round(targetRef.current), TOTAL_LOOKS);
    let diff = lookIdx - currentMod;
    if (diff > TOTAL_LOOKS / 2) diff -= TOTAL_LOOKS;
    if (diff < -TOTAL_LOOKS / 2) diff += TOTAL_LOOKS;
    targetRef.current = Math.round(targetRef.current) + diff;
  }, []);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let wheelTimer = 0;

    const renderFrame = (now: number) => {
      const dt = Math.min(60, now - lastTime);
      lastTime = now;

      const ease = 1 - Math.pow(0.0005, dt / 1000);
      pRef.current += (targetRef.current - pRef.current) * ease;
      if ( !draggingRef.current && Math.abs(targetRef.current - pRef.current) < 0.0008 ) {
        pRef.current = targetRef.current;
      }

      const p = pRef.current;
      const stageEl = stageRef.current;
      if (stageEl) {
        const W = stageEl.clientWidth || 800;
        const H = stageEl.clientHeight || 520;
        const isCompact = W < 680;
        const baseModelH = Math.min(H * 1.05, isCompact ? W * 1.15 : H * 1.08);
        const baseModelW = baseModelH * 0.42;

        for (let i = 0; i < TOTAL_LOOKS; i++) {
          const el = modelRefs.current[i];
          if (!el) continue;

          let d = wrap(i - p, TOTAL_LOOKS);
          if (d > TOTAL_LOOKS - 1.15) d -= TOTAL_LOOKS;

          // Only display the front model (d=0) and 4 receding models behind it (d=1..4)
          if (d < -0.75 || d > 4.65) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            el.style.transform = 'translate3d(-9999px, 0, 0) scale(0.01)';
            continue;
          }

          const sc = sample(KS, d);
          const xCenter = sample(KX, d) * W;
          const yFoot = sample(KY, d) * H;
          const blurPx = sample(KB, d);
          const op = Math.max(0, Math.min(1, sample(KO, d)));
          const rotY = -d * 5.5; // Subtle 3D runway perspective turn

          const tx = xCenter - (baseModelW * sc) / 2;
          const ty = yFoot - baseModelH * sc;

          el.style.width = `${baseModelW}px`;
          el.style.height = `${baseModelH}px`;
          el.style.opacity = op.toFixed(3);
          el.style.zIndex = String(Math.round(200 - d * 25));
          el.style.pointerEvents = op > 0.25 && d >= -0.25 && d <= 3.6 ? 'auto' : 'none';
          el.style.filter = blurPx > 0.2 ? `blur(${(blurPx / Math.max(0.35, sc)).toFixed(1)}px)` : 'none';
          el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${sc.toFixed(4)}) rotateY(${rotY.toFixed(1)}deg)`;
        }
      }

      const currentIdx = wrap(Math.round(p), TOTAL_LOOKS);
      setActiveLookIdx((prev) => (prev !== currentIdx ? currentIdx : prev));

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        targetRef.current = Math.round(targetRef.current) + 1;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        targetRef.current = Math.round(targetRef.current) - 1;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(wheelTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startTRef.current = targetRef.current;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 7) movedRef.current = true;
    const span = Math.max(220, (stageRef.current?.clientWidth || 720) * 0.28);
    // Dragging left/right walks the 20-model runway horizontally
    targetRef.current = startTRef.current - dx / span;
  };

  const handleStagePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    targetRef.current = Math.round(targetRef.current);
  };

  const handleModelClick = (lookIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (movedRef.current) return;

    let d = wrap(lookIdx - pRef.current, TOTAL_LOOKS);
    if (d > TOTAL_LOOKS - 1.15) d -= TOTAL_LOOKS;

    // If user clicks the front model (d ~ 0), open its dedicated 3D 360° Product Page immediately!
    if (Math.abs(d) < 0.48) {
      const look = LOOKS_DATA[lookIdx];
      onOpenProductPage(look.pieceIds[0], lookIdx);
    } else if (d > 0) {
      // If user clicks a receding model in the line, smoothly walk that model to the front!
      targetRef.current = Math.round(pRef.current + d);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    targetRef.current += delta * 0.0024;
    window.clearTimeout((window as any).__mvWheelSnap);
    (window as any).__mvWheelSnap = window.setTimeout(() => {
      targetRef.current = Math.round(targetRef.current);
    }, 150);
  };

  const currentLook: LookEntry = LOOKS_DATA[activeLookIdx] || LOOKS_DATA[0];
  const activePieces: PieceItem[] = currentLook.pieceIds.map((id) => PIECES_DATA[id]);

  return (
    <div
      onWheel={handleWheel}
      className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 px-3 sm:px-6 pb-4 min-h-0 overflow-y-auto lg:overflow-hidden"
    >
      {/* Left 7 Columns: 3D Receding Runway Stage with 20 Single Models */}
      <section
        ref={stageRef}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
        aria-label="3D Runway Depth Stage — 20 Solo Models"
        className="lg:col-span-7 relative h-[430px] sm:h-[520px] lg:h-full min-h-[410px] rounded-[32px] bg-[radial-gradient(110%_90%_at_75%_24%,#ffffff_0%,#edf2f8_56%,#dde6f1_100%)] border border-slate-200/90 shadow-sm overflow-hidden select-none cursor-grab active:cursor-grabbing touch-pan-y"
        style={{ perspective: '1200px' }}
      >
        {/* Subtle 3D Runway Floor Horizon & Perspective Lines */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[36%] bg-gradient-to-t from-slate-300/35 via-slate-200/15 to-transparent"
        />

        {/* Top Editorial Info Overlay */}
        <div className="relative z-30 p-4 sm:p-6 flex flex-wrap items-start justify-between gap-3 pointer-events-none">
          <div className="bg-white/85 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/80 shadow-sm max-w-md pointer-events-auto">
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span>Spring / Summer 2027</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-900 font-semibold">
                Solo Model {currentLook.lookNumber} of 20
              </span>
            </div>
            <h1 className="mt-1 text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
              {currentLook.title}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">{currentLook.silhouette}</p>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => stepToLook(Math.round(targetRef.current) - 1)}
              aria-label="Previous Look"
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => stepToLook(Math.round(targetRef.current) + 1)}
              aria-label="Next Look"
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 20 Single-Model 3D Receding Line */}
        <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
          {LOOKS_DATA.map((lk, idx) => (
            <div
              key={lk.lookNumber}
              ref={(el) => {
                modelRefs.current[idx] = el;
              }}
              onClick={(e) => handleModelClick(idx, e)}
              title={`Tap Look ${lk.lookNumber} (${lk.title}) for 3D 360° Product View`}
              className="absolute top-0 left-0 origin-top-left cursor-pointer will-change-transform group"
            >
              <ModelCutout
                look={lk}
                processedModels={processedModels}
                className="w-full h-full drop-shadow-[0_18px_24px_rgba(15,23,42,0.14)] group-hover:scale-[1.02] transition-transform duration-200"
              />
              {/* Soft Runway Contact Shadow under each single model */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-[18%] right-[18%] bottom-[1%] h-3.5 rounded-full bg-slate-900/20 blur-md"
              />
            </div>
          ))}
        </div>

        {/* Bottom-Left Look Counter + Primary CTA to Open Dedicated 3D 360° Product Page */}
        <div className="absolute left-4 right-4 bottom-4 z-30 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-slate-200/90 shadow-lg pointer-events-auto flex flex-col gap-2.5 max-w-xs">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-['Michroma',sans-serif] text-xl sm:text-2xl tracking-[0.14em] uppercase text-slate-900 tabular-nums">
                LOOK {String(currentLook.lookNumber).padStart(2, '0')}
              </span>
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <MoveHorizontal className="w-3.5 h-3.5" />
                <span>Drag Left / Right</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenProductPage(currentLook.pieceIds[0], activeLookIdx)}
                className="flex-1 py-2.5 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 whitespace-nowrap shrink-0"
              >
                <Rotate3d className="w-4 h-4 text-amber-400" />
                <span>Inspect Dress in 3D 360°</span>
              </button>
            </div>
          </div>

          {/* 1 to 20 Solo Model Quick Switcher Strip */}
          <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-slate-200/90 shadow-md pointer-events-auto overflow-x-auto max-w-full sm:max-w-[360px]">
            <div className="flex items-center gap-1">
              {LOOKS_DATA.map((lk) => {
                const isActive = lk.index === activeLookIdx;
                return (
                  <button
                    key={lk.lookNumber}
                    type="button"
                    onClick={() => jumpToLookIndex(lk.index)}
                    className={`w-7 h-7 rounded-xl text-[11px] font-bold tabular-nums transition-all shrink-0 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm scale-105'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {lk.lookNumber}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Right 5 Columns: Active Look's Matched Products + Full 40-Product Runway Rail */}
      <aside
        aria-label="Matched Look Products & Collection Rail"
        className="lg:col-span-5 flex flex-col gap-3.5 lg:h-full lg:overflow-y-auto pr-0.5"
      >
        {/* Active Model's 2 Featured Products Header Card */}
        <div className="bg-white rounded-[28px] p-4 sm:p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Look {currentLook.lookNumber} Ensemble</span>
                <span aria-hidden="true">·</span>
                <span>2 Matched Pieces</span>
              </div>
              <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                Products Worn by Model #{currentLook.lookNumber}
              </h2>
            </div>

            <button
              type="button"
              onClick={onOpenCatalogPage}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>All 20 Models</span>
            </button>
          </div>

          {/* 2 Matched Product Cards for the Active Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activePieces.map((piece) => {
              const isFav = favorites.includes(piece.id);
              return (
                <article
                  key={piece.id}
                  onClick={() => onOpenProductPage(piece.id, activeLookIdx)}
                  className="group relative rounded-2xl bg-[#f4f7fb] hover:bg-[#ebf0f7] p-3.5 border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative h-44 w-full rounded-xl bg-white p-3 flex items-center justify-center overflow-hidden">
                    <ProductCutout
                      piece={piece}
                      processedPieces={processedPieces}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(piece.id);
                      }}
                      aria-label="Save to wishlist"
                      className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-white/95 border border-slate-200 flex items-center justify-center text-slate-700 hover:scale-105 transition-transform shadow-xs"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-700'
                        }`}
                      />
                    </button>

                    <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[10px] font-semibold flex items-center gap-1">
                      <Rotate3d className="w-3 h-3 text-amber-400" />
                      <span>3D 360°</span>
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>Piece 0{piece.pieceNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>{piece.category}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                      {piece.name}
                    </h3>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1.5 tabular-nums">
                        <span className="text-sm font-bold text-slate-900">{piece.price}</span>
                        <span className="text-xs text-slate-400 line-through">{piece.mrp}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAddToCart(piece);
                        }}
                        aria-label={`Quick add ${piece.name} to bag`}
                        className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-transform active:scale-90 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* All 20 Looks & Products Quick Browse Strip */}
        <div className="bg-white rounded-[28px] p-4 sm:p-5 border border-slate-200/90 shadow-sm flex-1 flex flex-col min-h-[240px]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Complete 20-Model Runway Feed (40 Pieces)
              </h3>
              <p className="text-xs text-slate-500">
                Tap any dress or accessory to open its dedicated 3D 360° Studio Page
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto pr-1">
            {PIECES_DATA.map((piece) => {
              const isCurrentLook = piece.lookNumber === currentLook.lookNumber;
              return (
                <div
                  key={piece.id}
                  onClick={() => onOpenProductPage(piece.id, piece.lookNumber - 1)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl border cursor-pointer transition-all ${
                    isCurrentLook
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-[#f8fafd] hover:bg-[#eef3f9] text-slate-900 border-slate-200/80'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                    <ProductCutout piece={piece} processedPieces={processedPieces} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`flex items-center gap-1.5 text-[10.5px] ${
                        isCurrentLook ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <span>Look {piece.lookNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>360° View</span>
                    </div>
                    <p className="text-xs font-semibold truncate">{piece.name}</p>
                    <p
                      className={`text-xs font-bold tabular-nums mt-0.5 ${
                        isCurrentLook ? 'text-amber-300' : 'text-emerald-700'
                      }`}
                    >
                      {piece.price}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
};
