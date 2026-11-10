/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LOOKS_DATA, PIECES_DATA, PieceItem } from './data/collectionData';
import { processAllCollectionAssets, ProcessedAssets } from './utils/spriteProcessor';
import { ModelCutout, ProductCutout } from './components/VisualRenderers';
import { ArrowLeft, Check, Rotate3d, ShoppingBag, Zap } from 'lucide-react';

const TOTAL_LOOKS = 20;
const TOTAL_PIECES = 40; // 2 products per model

// 7-stop depth table for d in [-1, 0, 1, 2, 3, 4, 5]
const KX = [1.08, 0.74, 0.47, 0.28, 0.15, 0.06, -0.04];
const KY = [0.99, 0.97, 0.89, 0.81, 0.75, 0.70, 0.66];
const KS = [1.02, 0.90, 0.64, 0.46, 0.33, 0.22, 0.14];
const KB = [12, 0, 2, 5, 9, 14, 19];
const KO = [0, 1, 0.92, 0.75, 0.50, 0.24, 0];

function wrap(v: number, m: number): number {
  return ((v % m) + m) % m;
}

function sample(arr: number[], d: number): number {
  const x = Math.max(0, Math.min(arr.length - 1.0001, d + 1));
  const i = Math.floor(x);
  const f = x - i;
  return arr[i] + (arr[i + 1] - arr[i]) * f;
}

export default function App() {
  const [assets, setAssets] = useState<ProcessedAssets>({
    models: {},
    pieces: {},
    ready: false,
  });

  // Active look number (1..20)
  const [lookNumber, setLookNumber] = useState<number>(1);

  // When a model or product is clicked, open the dedicated Product Card view (hiding the runway screen)
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(0);
  const [spinAngle, setSpinAngle] = useState<number>(0);
  const [cartCount, setCartCount] = useState<number>(0);
  const [orderNotice, setOrderNotice] = useState<string | null>(null);

  // Refs for smooth 60fps synchronized left-right model + product rail animation
  const stageRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const modelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const pRef = useRef<number>(0);
  const targetRef = useRef<number>(0);
  const draggingRef = useRef<boolean>(false);
  const movedRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startTRef = useRef<number>(0);

  // 360 spin drag ref inside Product Card view
  const spinDragRef = useRef<boolean>(false);
  const spinStartXRef = useRef<number>(0);
  const spinStartAngleRef = useRef<number>(0);

  useEffect(() => {
    processAllCollectionAssets((partial) => {
      setAssets({
        models: { ...partial.models },
        pieces: { ...partial.pieces },
        ready: partial.ready,
      });
    });
  }, []);

  useEffect(() => {
    if (!orderNotice) return;
    const t = setTimeout(() => setOrderNotice(null), 2200);
    return () => clearTimeout(t);
  }, [orderNotice]);

  const openProductCard = useCallback((pieceId: number) => {
    const clamped = wrap(pieceId, TOTAL_PIECES);
    setSelectedPieceId(clamped);
    setSelectedSize('M');
    setSelectedColorIdx(0);
    setSpinAngle(0);
  }, []);

  // Synchronized 60fps loop driving both the 20 models and the 40 horizontal product cards
  useEffect(() => {
    if (selectedPieceId !== null) return;

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(60, now - lastTime);
      lastTime = now;

      const ease = 1 - Math.pow(0.0005, dt / 1000);
      pRef.current += (targetRef.current - pRef.current) * ease;
      if (!draggingRef.current && Math.abs(targetRef.current - pRef.current) < 0.0006) {
        pRef.current = targetRef.current;
      }

      const p = pRef.current;

      // 1. Update 20 Models on the Top Stage
      const stageEl = stageRef.current;
      if (stageEl) {
        const W = stageEl.clientWidth || 390;
        const H = stageEl.clientHeight || 420;
        const isMobile = W < 680;
        const baseModelH = Math.min(H * 1.08, isMobile ? W * 1.24 : H * 1.10);
        // Match the 760x840 normalized canvas ratio so wide gowns (Look 7, 10, 20) never get clamped down
        const baseModelW = baseModelH * (760 / 840);

        for (let i = 0; i < TOTAL_LOOKS; i++) {
          const el = modelRefs.current[i];
          if (!el) continue;

          let d = wrap(i - p, TOTAL_LOOKS);
          if (d > TOTAL_LOOKS - 1.15) d -= TOTAL_LOOKS;

          if (d < -0.75 || d > 4.6) {
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

          const tx = xCenter - (baseModelW * sc) / 2;
          const ty = yFoot - baseModelH * sc;

          el.style.width = `${baseModelW}px`;
          el.style.height = `${baseModelH}px`;
          el.style.opacity = op.toFixed(3);
          el.style.zIndex = String(Math.round(200 - d * 25));
          el.style.pointerEvents = op > 0.25 && d >= -0.25 && d <= 3.6 ? 'auto' : 'none';
          el.style.filter =
            blurPx > 0.2 ? `blur(${(blurPx / Math.max(0.35, sc)).toFixed(1)}px)` : 'none';
          el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
        }
      }

      // 2. Update 40 Horizontal Product Cards in the Bottom Row in exact sync with p
      const railEl = railRef.current;
      if (railEl) {
        const rW = railEl.clientWidth || 390;
        const rH = railEl.clientHeight || 200;
        const cardW = Math.min(185, Math.max(142, rW * 0.42));
        const cardH = Math.max(156, rH - 20);
        const gap = 12;
        const step = cardW + gap;
        const totalTrackW = TOTAL_PIECES * step;
        const scrollX = wrap(p * 2 * step, totalTrackW);

        for (let k = 0; k < TOTAL_PIECES; k++) {
          const cardEl = cardRefs.current[k];
          if (!cardEl) continue;

          let x = k * step - scrollX + 14;
          if (x < -step * 2) x += totalTrackW;
          if (x > totalTrackW - step * 2) x -= totalTrackW;

          cardEl.style.width = `${cardW}px`;
          cardEl.style.height = `${cardH}px`;

          if (x < -cardW - 40 || x > rW + 40) {
            cardEl.style.opacity = '0';
            cardEl.style.pointerEvents = 'none';
            cardEl.style.transform = 'translate3d(-9999px, 0, 0)';
          } else {
            cardEl.style.opacity = '1';
            cardEl.style.pointerEvents = 'auto';
            cardEl.style.transform = `translate3d(${x.toFixed(1)}px, 10px, 0)`;
          }
        }
      }

      const activeIdx = wrap(Math.round(p), TOTAL_LOOKS);
      const nextLookNum = activeIdx + 1;
      setLookNumber((prev) => (prev !== nextLookNum ? nextLookNum : prev));

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        targetRef.current = Math.round(targetRef.current) + 1;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        targetRef.current = Math.round(targetRef.current) - 1;
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedPieceId]);

  // Unified left-right horizontal drag for both Model Stage and Bottom Product Row
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startTRef.current = targetRef.current;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 6) movedRef.current = true;
    const span = Math.max(180, window.innerWidth * 0.26);
    targetRef.current = startTRef.current - dx / span;
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    targetRef.current = Math.round(targetRef.current);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    targetRef.current += delta * 0.0025;
    window.clearTimeout((window as any).__mvSnap);
    (window as any).__mvSnap = window.setTimeout(() => {
      targetRef.current = Math.round(targetRef.current);
    }, 140);
  };

  const handleModelTap = (lookIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (movedRef.current) return;

    let d = wrap(lookIdx - pRef.current, TOTAL_LOOKS);
    if (d > TOTAL_LOOKS - 1.15) d -= TOTAL_LOOKS;

    if (Math.abs(d) < 0.45) {
      // Front model tapped -> Open its Product Card view
      openProductCard(lookIdx * 2);
    } else if (d > 0) {
      // Background model tapped -> Walk it to the front
      targetRef.current = Math.round(pRef.current + d);
    }
  };

  const handleProductCardTap = (pieceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (movedRef.current) return;
    openProductCard(pieceId);
  };

  // ================= VIEW 2: DEDICATED PRODUCT CARD VIEW (WHEN MODEL OR PRODUCT IS CLICKED) =================
  if (selectedPieceId !== null) {
    const activePiece: PieceItem = PIECES_DATA[selectedPieceId] || PIECES_DATA[0];
    const currentLook =
      LOOKS_DATA.find((l) => l.lookNumber === activePiece.lookNumber) || LOOKS_DATA[0];
    const lookPieces = currentLook.pieceIds.map((id) => PIECES_DATA[id]);
    const activeColor = activePiece.colors[selectedColorIdx] || activePiece.colors[0];

    return (
      <div className="h-dvh w-full bg-[#f2f6fb] p-3 sm:p-5 flex items-center justify-center overflow-y-auto">
        {orderNotice && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{orderNotice}</span>
          </div>
        )}

        <div className="w-full max-w-2xl bg-white rounded-[32px] p-4 sm:p-6 shadow-xl border border-slate-200/80 flex flex-col gap-4">
          {/* Top Bar: Back to Models + Switch Piece 1/2 + Cart Count */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setSelectedPieceId(null)}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Look {activePiece.lookNumber}</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
              {lookPieces.map((lp) => (
                <button
                  key={lp.id}
                  type="button"
                  onClick={() => {
                    setSelectedPieceId(lp.id);
                    setSelectedColorIdx(0);
                    setSpinAngle(0);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    lp.id === activePiece.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Product {lp.pieceNumber}
                </button>
              ))}
            </div>

            <div className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 tabular-nums">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{cartCount}</span>
            </div>
          </div>

          {/* Product Image with Interactive 3D 360° Drag Spin */}
          <div
            onPointerDown={(e) => {
              spinDragRef.current = true;
              spinStartXRef.current = e.clientX;
              spinStartAngleRef.current = spinAngle;
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!spinDragRef.current) return;
              const dx = e.clientX - spinStartXRef.current;
              setSpinAngle((spinStartAngleRef.current + dx * 0.9) % 360);
            }}
            onPointerUp={() => {
              spinDragRef.current = false;
            }}
            onPointerCancel={() => {
              spinDragRef.current = false;
            }}
            className="relative h-64 sm:h-72 w-full rounded-[28px] bg-gradient-to-b from-[#f8fafd] to-[#e9eff7] border border-slate-200/70 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
            style={{ perspective: '1200px' }}
          >
            <div
              className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateY(${spinAngle}deg)`,
              }}
            >
              <ProductCutout
                piece={activePiece}
                processedPieces={assets.pieces}
                colorFilter={activeColor?.filter || 'none'}
                className="w-full h-full drop-shadow-[0_18px_24px_rgba(15,23,42,0.16)]"
              />
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-[10.5px] font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs">
              <Rotate3d className="w-3.5 h-3.5 text-amber-600" />
              <span>Drag Left / Right for 3D 360°</span>
            </div>
          </div>

          {/* Product Title & Price */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">{activePiece.name}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{activePiece.fabric}</p>
            </div>
            <div className="text-right tabular-nums shrink-0">
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{activePiece.price}</div>
              <div className="text-xs text-emerald-700 font-bold">
                <span className="text-slate-400 line-through font-normal mr-1.5">
                  {activePiece.mrp}
                </span>
                {activePiece.discountLabel}
              </div>
            </div>
          </div>

          {/* Colour Selector */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 block">
              Colour: <span className="font-normal text-slate-500">{activeColor?.name}</span>
            </span>
            <div className="flex items-center gap-2.5">
              {activePiece.colors.map((c, idx) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColorIdx(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                    selectedColorIdx === idx
                      ? 'border-2 border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/50 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 block">
              Size: <span className="font-normal text-slate-500">{selectedSize}</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {activePiece.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`min-w-[46px] h-10 px-3.5 rounded-full text-xs font-bold transition-all ${
                    selectedSize === sz
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons: Add to Cart & Buy Now */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setCartCount((c) => c + 1);
                setOrderNotice(`Added ${activePiece.name} (${selectedSize}) to Cart`);
              }}
              className="py-3.5 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCartCount((c) => c + 1);
                setOrderNotice(
                  `Order Placed for ${activePiece.name} (${selectedSize} • ${activePiece.price})!`
                );
              }}
              className="py-3.5 px-4 rounded-full bg-gradient-to-r from-[#ff9f00] to-[#fb641b] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= VIEW 1: CLEAN MODEL STAGE ON TOP + SYNCHRONIZED LEFT-RIGHT PRODUCT ROW BELOW =================
  return (
    <main
      onWheel={handleWheel}
      className="h-dvh w-full bg-[#f1f5fa] p-2.5 sm:p-4 flex flex-col gap-2.5 overflow-hidden select-none"
    >
      {/* Top Section: ONLY the 20 Models Sliding Left-Right in Depth (Zero Header / Clutter Boxes) */}
      <section
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="20 Runway Models — Slide Left or Right"
        className="relative flex-1 min-h-0 w-full rounded-[30px] bg-[radial-gradient(110%_90%_at_75%_24%,#ffffff_0%,#eef3f9_58%,#dfe7f2_100%)] overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {/* 20 Single Models Line */}
        <div className="absolute inset-0 pointer-events-none">
          {LOOKS_DATA.map((lk, idx) => (
            <div
              key={lk.lookNumber}
              ref={(el) => {
                modelRefs.current[idx] = el;
              }}
              onClick={(e) => handleModelTap(idx, e)}
              className="absolute top-0 left-0 origin-top-left cursor-pointer will-change-transform"
            >
              <ModelCutout
                look={lk}
                processedModels={assets.models}
                className="w-full h-full drop-shadow-[0_16px_22px_rgba(15,23,42,0.13)]"
              />
            </div>
          ))}
        </div>

        {/* Minimal Look Counter at Bottom Left */}
        <div className="absolute left-4 bottom-4 z-30 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-sm pointer-events-none">
          <div className="font-['Michroma',sans-serif] text-lg sm:text-2xl tracking-[0.14em] uppercase text-slate-900 tabular-nums">
            LOOK {String(lookNumber).padStart(2, '0')}
          </div>
        </div>
      </section>

      {/* Bottom Row: Synchronized Horizontal Left-Right Product Row */}
      <aside
        ref={railRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="Model Products — Left Right Sliding Row"
        className="relative h-[184px] sm:h-[206px] shrink-0 w-full rounded-[28px] bg-[#e9eff6] overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {PIECES_DATA.map((piece, idx) => {
          const isActiveLook = piece.lookNumber === lookNumber;
          return (
            <div
              key={piece.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              onClick={(e) => handleProductCardTap(piece.id, e)}
              className={`absolute top-0 left-0 rounded-[22px] p-2.5 flex flex-col justify-between cursor-pointer will-change-transform transition-shadow ${
                isActiveLook
                  ? 'bg-white ring-2 ring-slate-900 shadow-md'
                  : 'bg-white/90 hover:bg-white shadow-xs'
              }`}
            >
              <div className="h-[104px] sm:h-[120px] w-full rounded-2xl bg-[#f4f7fb] p-2 flex items-center justify-center overflow-hidden">
                <ProductCutout piece={piece} processedPieces={assets.pieces} />
              </div>

              <div className="px-1 pt-1">
                <p className="text-[11px] font-bold text-slate-900 truncate">{piece.name}</p>
                <div className="flex items-center justify-between text-[11px] mt-0.5 tabular-nums">
                  <span className="font-bold text-slate-900">{piece.price}</span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Look {piece.lookNumber}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </aside>
    </main>
  );
}
