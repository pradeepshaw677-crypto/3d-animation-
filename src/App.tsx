/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LOOKS_DATA, PIECES_DATA, PieceItem } from './data/collectionData';
import { ModelCutout, ProductCutout } from './components/VisualRenderers';
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Heart,
  MapPin,
  Plus,
  Rotate3d,
  RotateCw,
  Ruler,
  ShoppingBag,
  Smartphone,
  Star,
  Tag,
  Trash2,
  X,
  Zap,
  ZoomIn,
} from 'lucide-react';

const TOTAL_LOOKS = LOOKS_DATA.length;
const TOTAL_PIECES = PIECES_DATA.length;
const AUTO_RESUME_DELAY_MS = 2000; // Resume auto-run 2 seconds after last touch/slide

// 7-stop depth table for d in [-1, 0, 1, 2, 3, 4, 5]
// Calibrated so 100% of every model's head and feet stay inside the stage with zero clipping
const KX = [1.08, 0.73, 0.46, 0.27, 0.14, 0.05, -0.04];
const KY = [0.96, 0.95, 0.88, 0.81, 0.75, 0.70, 0.66];
const KS = [0.94, 0.86, 0.63, 0.46, 0.33, 0.22, 0.14];
const KB = [12, 0, 2, 5, 9, 14, 19];
const KO = [0, 1, 0.92, 0.75, 0.50, 0.24, 0];

const PINCODE_CITIES: Record<string, string> = {
  '400': 'Mumbai, Maharashtra',
  '110': 'New Delhi, Delhi NCR',
  '560': 'Bengaluru, Karnataka',
  '500': 'Hyderabad, Telangana',
  '600': 'Chennai, Tamil Nadu',
  '700': 'Kolkata, West Bengal',
  '411': 'Pune, Maharashtra',
  '380': 'Ahmedabad, Gujarat',
  '302': 'Jaipur, Rajasthan',
  '122': 'Gurugram, Haryana',
  '201': 'Noida, Uttar Pradesh',
  '395': 'Surat, Gujarat',
};

interface CartLine {
  key: string;
  piece: PieceItem;
  size: string;
  color: string;
  quantity: number;
}

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
  const [lookNumber, setLookNumber] = useState<number>(1);

  // Full-screen Product Card view state (when any model or product is clicked)
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(0);
  const [spinAngle, setSpinAngle] = useState<number>(0);
  const [autoSpin360, setAutoSpin360] = useState<boolean>(true);
  const [zoom360, setZoom360] = useState<number>(1);
  const [showSizeChart, setShowSizeChart] = useState<boolean>(false);
  const [pincode, setPincode] = useState<string>('400001');
  const [pincodeStatus, setPincodeStatus] = useState<string>(
    'Free Express Air Delivery by Tomorrow • COD & UPI Available'
  );

  // Persistent Cart, Wishlist, Custom PNG Overrides & Express Indian Checkout State
  const [customProductPngs, setCustomProductPngs] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem('mv_custom_products_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [customModelPngs, setCustomModelPngs] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem('mv_custom_models_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const productFileInputRef = useRef<HTMLInputElement | null>(null);
  const modelFileInputRef = useRef<HTMLInputElement | null>(null);

  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      const saved = localStorage.getItem('mv_cart_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('mv_favs_v3');
      return saved ? JSON.parse(saved) : [0, 12, 38];
    } catch {
      return [0, 12, 38];
    }
  });
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('Mumbai, Maharashtra');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI (GPay / PhonePe)');
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    total: string;
    method: string;
  } | null>(null);

  const [orderNotice, setOrderNotice] = useState<string | null>(null);

  // Refs for persistent 60fps synchronized left-right model + product rail animation
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
  const lastDragXRef = useRef<number>(0);
  const lastDragTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const lastInteractionTimeRef = useRef<number>(-10000);
  const modalOpenRef = useRef<boolean>(false);

  useEffect(() => {
    modalOpenRef.current = selectedPieceId !== null || cartOpen;
  }, [selectedPieceId, cartOpen]);

  // 360 spin drag ref inside Product Card view
  const spinDragRef = useRef<boolean>(false);
  const spinStartXRef = useRef<number>(0);
  const spinStartAngleRef = useRef<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem('mv_cart_v3', JSON.stringify(cart));
    } catch {
      // Ignore quota
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('mv_favs_v3', JSON.stringify(favorites));
    } catch {
      // Ignore quota
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('mv_custom_products_v1', JSON.stringify(customProductPngs));
    } catch {
      // Ignore quota
    }
  }, [customProductPngs]);

  useEffect(() => {
    try {
      localStorage.setItem('mv_custom_models_v1', JSON.stringify(customModelPngs));
    } catch {
      // Ignore quota
    }
  }, [customModelPngs]);

  const handleUploadProductPng = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedPieceId === null) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomProductPngs((prev) => ({ ...prev, [selectedPieceId]: reader.result as string }));
        setOrderNotice('Updated Dress PNG!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUploadModelPng = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentLook) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomModelPngs((prev) => ({
          ...prev,
          [currentLook.lookNumber]: reader.result as string,
        }));
        setOrderNotice(`Updated Look ${currentLook.lookNumber} Model PNG!`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (!orderNotice) return;
    const t = setTimeout(() => setOrderNotice(null), 2300);
    return () => clearTimeout(t);
  }, [orderNotice]);

  // Smooth 360° auto-rotation inside the Product Card view
  useEffect(() => {
    if (selectedPieceId === null || !autoSpin360) return;
    let rafId = 0;
    let last = performance.now();
    const spinLoop = (now: number) => {
      const dt = now - last;
      last = now;
      if (!spinDragRef.current) {
        setSpinAngle((prev) => (prev + dt * 0.036) % 360);
      }
      rafId = requestAnimationFrame(spinLoop);
    };
    rafId = requestAnimationFrame(spinLoop);
    return () => cancelAnimationFrame(rafId);
  }, [selectedPieceId, autoSpin360]);

  const openProductCard = useCallback((pieceId: number) => {
    const clamped = wrap(pieceId, TOTAL_PIECES);
    setSelectedPieceId(clamped);
    setSelectedSize('M');
    setSelectedColorIdx(0);
    setSpinAngle(14);
    setAutoSpin360(true);
    setZoom360(1);
    setShowSizeChart(false);
  }, []);

  const toggleFavorite = useCallback((pieceId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const exists = prev.includes(pieceId);
      setOrderNotice(exists ? 'Removed from Wishlist' : 'Saved to Wishlist ♥');
      return exists ? prev.filter((id) => id !== pieceId) : [...prev, pieceId];
    });
  }, []);

  const addToCart = useCallback(
    (piece: PieceItem, size: string = 'M', color: string = 'Original', qty: number = 1) => {
      const key = `${piece.id}-${size}-${color}`;
      setCart((prev) => {
        const idx = prev.findIndex((item) => item.key === key);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          return next;
        }
        return [...prev, { key, piece, size, color, quantity: qty }];
      });
      setOrderNotice(`Added ${piece.name} (${size}) to Cart`);
    },
    []
  );

  // Persistent 60fps loop (empty dependency array [] so it NEVER resets or reloads!)
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(60, now - lastTime);
      lastTime = now;

      // Always-on Auto-Run: runs continuously and automatically resumes 2 seconds after any user touch/slide
      const idleMs = now - lastInteractionTimeRef.current;
      if (!draggingRef.current && !modalOpenRef.current && idleMs >= AUTO_RESUME_DELAY_MS) {
        targetRef.current += (dt / 1000) * 0.38;
      }

      const ease = 1 - Math.pow(0.0005, dt / 1000);
      pRef.current += (targetRef.current - pRef.current) * ease;

      const p = pRef.current;

      // 1. Update 20 Models on the Top Stage
      const stageEl = stageRef.current;
      if (stageEl && stageEl.clientWidth > 0) {
        const W = stageEl.clientWidth;
        const H = stageEl.clientHeight;
        // Full head-to-toe height with guaranteed top & bottom clearance (zero head or foot clipping)
        const baseModelH = H * 0.96;
        const baseModelW = baseModelH * (960 / 1080);

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

      // 2. Update Horizontal Product Cards in the Bottom Row in exact sync with p
      const railEl = railRef.current;
      if (railEl && railEl.clientWidth > 0) {
        const rW = railEl.clientWidth;
        const rH = railEl.clientHeight;
        const cardW = Math.min(188, Math.max(146, rW * 0.42));
        const cardH = Math.max(160, rH - 20);
        const gap = 12;
        const step = cardW + gap;
        const totalTrackW = TOTAL_PIECES * step;

        const wP = wrap(p, TOTAL_LOOKS);
        const i0 = Math.floor(wP);
        const i1 = (i0 + 1) % TOTAL_LOOKS;
        const frac = wP - i0;
        const c0 = LOOKS_DATA[i0].firstPieceIndex;
        const c1 = i1 === 0 ? TOTAL_PIECES : LOOKS_DATA[i1].firstPieceIndex;
        const activeCardIdx = c0 + (c1 - c0) * frac;
        const scrollX = wrap(activeCardIdx * step, totalTrackW);

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
        lastInteractionTimeRef.current = performance.now();
        targetRef.current = Math.round(targetRef.current) + 1;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        lastInteractionTimeRef.current = performance.now();
        targetRef.current = Math.round(targetRef.current) - 1;
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Unified left-right horizontal drag with flick momentum + 2s auto-run resume
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const now = performance.now();
    lastInteractionTimeRef.current = now;
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    lastDragXRef.current = e.clientX;
    lastDragTimeRef.current = now;
    velocityRef.current = 0;
    // Sync targetRef to current visual pRef so catching a moving model feels instant and natural
    targetRef.current = pRef.current;
    startTRef.current = pRef.current;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return;
    const now = performance.now();
    lastInteractionTimeRef.current = now;
    const dt = Math.max(1, now - lastDragTimeRef.current);
    const stepDx = e.clientX - lastDragXRef.current;
    velocityRef.current = stepDx / dt; // px per ms
    lastDragXRef.current = e.clientX;
    lastDragTimeRef.current = now;

    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 6) movedRef.current = true;
    const span = Math.max(180, window.innerWidth * 0.26);
    targetRef.current = startTRef.current - dx / span;
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    lastInteractionTimeRef.current = performance.now();
    if (movedRef.current) {
      // Apply smooth flick momentum; auto-run will resume automatically 2 seconds after this release
      const momentumLooks = Math.max(-2.5, Math.min(2.5, -velocityRef.current * 0.85));
      targetRef.current = Math.round(targetRef.current + momentumLooks);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    lastInteractionTimeRef.current = performance.now();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    targetRef.current += delta * 0.0025;
  };

  const handleModelTap = (lookIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (movedRef.current) return;

    let d = wrap(lookIdx - pRef.current, TOTAL_LOOKS);
    if (d > TOTAL_LOOKS - 1.15) d -= TOTAL_LOOKS;

    // Clicking any visible model opens her dress card immediately
    const firstId = LOOKS_DATA[lookIdx]?.firstPieceIndex ?? 0;
    if (Math.abs(d) < 0.65) {
      openProductCard(firstId);
    } else if (d > 0) {
      lastInteractionTimeRef.current = performance.now();
      targetRef.current = pRef.current + d;
      openProductCard(firstId);
    }
  };

  const handleProductCardTap = (pieceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (movedRef.current) return;
    openProductCard(pieceId);
  };

  const handleCheckPincode = () => {
    const clean = pincode.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    if (clean.length !== 6) {
      setPincodeStatus('Enter a valid 6-digit Indian Pincode (e.g. 400001)');
      return;
    }
    const matched = PINCODE_CITIES[clean.slice(0, 3)] || 'Your City (Pan-India Express)';
    setCity(matched);
    setPincodeStatus(`✓ Express Delivery to ${matched} by Tomorrow, 11 AM • Free COD & UPI`);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.piece.priceNumeric * item.quantity, 0);
  const formattedCartTotal = `₹${totalCartAmount.toLocaleString('en-IN')}`;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = `MV-${Math.floor(100000 + Math.random() * 900000)}`;
    setConfirmedOrder({
      orderId,
      total: formattedCartTotal,
      method: paymentMethod,
    });
    setCart([]);
    setOrderNotice(`Order ${orderId} Confirmed!`);
  };

  const activeLookObj = LOOKS_DATA[lookNumber - 1] || LOOKS_DATA[0];
  const activePiece: PieceItem | null =
    selectedPieceId !== null ? PIECES_DATA[selectedPieceId] || PIECES_DATA[0] : null;
  const currentLook = activePiece
    ? LOOKS_DATA.find((l) => l.lookNumber === activePiece.lookNumber) || LOOKS_DATA[0]
    : null;
  const lookPieces = currentLook ? currentLook.pieceIds.map((id) => PIECES_DATA[id]) : [];
  const activeColor = activePiece
    ? activePiece.colors[selectedColorIdx] || activePiece.colors[0]
    : null;
  const normalizedSpin = Math.round(((spinAngle % 360) + 360) % 360);

  return (
    <div className="h-dvh w-full bg-[#f1f5fa] overflow-hidden relative">
      {/* Hidden PNG file inputs so user can replace any Dress PNG or Model PNG anytime */}
      <input
        ref={productFileInputRef}
        type="file"
        accept="image/png,image/webp,image/jpeg"
        onChange={handleUploadProductPng}
        className="hidden"
      />
      <input
        ref={modelFileInputRef}
        type="file"
        accept="image/png,image/webp,image/jpeg"
        onChange={handleUploadModelPng}
        className="hidden"
      />

      {/* Global Toast Notice */}
      <AnimatePresence>
        {orderNotice && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.92 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 pointer-events-none"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{orderNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Runway + Product Row (Kept mounted so images NEVER reload or reset position) */}
      <main
        onWheel={handleWheel}
        className={`h-dvh w-full p-2.5 sm:p-4 flex flex-col gap-2.5 overflow-hidden select-none transition-opacity duration-150 ${
          selectedPieceId !== null || cartOpen
            ? 'opacity-0 pointer-events-none invisible'
            : 'opacity-100 visible'
        }`}
      >
        {/* Top Section: 20 Full-Height Uncut Models Sliding Left-Right */}
        <section
          ref={stageRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="20 Runway Models — Auto Running & Slide Left or Right"
          className="relative flex-1 min-h-0 w-full rounded-[30px] bg-[radial-gradient(110%_90%_at_75%_24%,#ffffff_0%,#eef3f9_58%,#dfe7f2_100%)] overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {/* Dynamic Couture Floor Spotlight Aura underneath the Front Model */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[12%] bottom-[3%] w-56 h-12 rounded-full blur-2xl transition-colors duration-500 opacity-35"
            style={{ backgroundColor: activeLookObj.accentHex }}
          />

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
                  customUrl={customModelPngs[lk.lookNumber]}
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>

          {/* Bottom-Left Look Counter */}
          <div className="absolute left-3.5 bottom-3.5 z-30 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xs pointer-events-none">
            <div className="font-['Michroma',sans-serif] text-base sm:text-xl tracking-[0.14em] uppercase text-slate-900 tabular-nums">
              LOOK {String(lookNumber).padStart(2, '0')}
            </div>
          </div>
        </section>

        {/* Bottom Row: Synchronized Horizontal Left-Right Product Row (Isolated Dress-Only PNGs) */}
        <aside
          ref={railRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="Model Products — Left Right Sliding Row"
          className="relative h-[192px] sm:h-[214px] shrink-0 w-full rounded-[28px] bg-[#e9eff6] overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {PIECES_DATA.map((piece, idx) => {
            const isActiveLook = piece.lookNumber === lookNumber;
            const isFav = favorites.includes(piece.id);
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
                <div className="relative h-[112px] sm:h-[130px] shrink-0 w-full rounded-2xl bg-[#f4f7fb] p-1.5 flex items-center justify-center overflow-hidden">
                  <ProductCutout
                    piece={piece}
                    customUrl={customProductPngs[piece.id]}
                    className="w-full h-full"
                  />

                  {/* Wishlist Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(piece.id, e)}
                    aria-label="Wishlist"
                    className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-2xs transition-transform active:scale-75"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
                      }`}
                    />
                  </button>

                  {/* 1-Tap Quick Add to Cart Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(piece, 'M', piece.colors[0]?.name || 'Original', 1);
                    }}
                    aria-label="Quick add to cart"
                    className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs transition-transform active:scale-75"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="px-1 pt-1">
                  <p className="text-[11px] font-bold text-slate-900 truncate">{piece.name}</p>
                  <div className="flex items-center justify-between text-[11px] mt-0.5 tabular-nums">
                    <span className="font-bold text-slate-900">{piece.price}</span>
                    <span className="text-[10px] font-semibold text-emerald-700">
                      {piece.discountLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </aside>
      </main>

      {/* Dedicated Full-Screen Product Card Page (Mobile & Desktop Optimized — Isolated Dress 3D 360°) */}
      <AnimatePresence>
        {activePiece && currentLook && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-[#f2f6fb] p-2.5 sm:p-5 overflow-y-auto flex items-start sm:items-center justify-center"
          >
            <div className="w-full max-w-2xl bg-white rounded-[28px] sm:rounded-[32px] p-3.5 sm:p-6 shadow-xl border border-slate-200/80 flex flex-col gap-3.5 my-auto">
              {/* Top Bar: Back to exact same Look + Switch Dress 1/2 + Prev/Next Look + Cart */}
              <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPieceId(null)}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Look {activePiece.lookNumber}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const prevLookIdx = wrap(currentLook.index - 1, TOTAL_LOOKS);
                      pRef.current = prevLookIdx;
                      targetRef.current = prevLookIdx;
                      openProductCard(LOOKS_DATA[prevLookIdx].firstPieceIndex);
                    }}
                    title="Previous Model Look"
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextLookIdx = wrap(currentLook.index + 1, TOTAL_LOOKS);
                      pRef.current = nextLookIdx;
                      targetRef.current = nextLookIdx;
                      openProductCard(LOOKS_DATA[nextLookIdx].firstPieceIndex);
                    }}
                    title="Next Model Look"
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {lookPieces.length > 1 && (
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
                    {lookPieces.map((lp, pIdx) => (
                      <button
                        key={lp.id}
                        type="button"
                        onClick={() => {
                          setSelectedPieceId(lp.id);
                          setSelectedColorIdx(0);
                        }}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                          lp.id === activePiece.id
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {pIdx === 0 ? 'Top / Jacket' : 'Skirt / Pants'}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(activePiece.id)}
                    aria-label="Save to Wishlist"
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favorites.includes(activePiece.id)
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPieceId(null);
                      setConfirmedOrder(null);
                      setCartOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 tabular-nums"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{totalCartCount}</span>
                  </button>
                </div>
              </div>

              {/* Isolated Dress-Only Product Image with Interactive 3D 360° Turntable (Guaranteed Mobile Height with shrink-0) */}
              <div
                onPointerDown={(e) => {
                  if ((e.target as HTMLElement).closest('button, input')) return;
                  setAutoSpin360(false);
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
                className="relative h-[240px] sm:h-[296px] min-h-[240px] shrink-0 w-full rounded-[26px] bg-gradient-to-b from-[#f8fafd] to-[#e9eff7] border border-slate-200/70 p-3 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
                style={{ perspective: '1200px' }}
              >
                {/* Top 360 Studio Controls + Custom PNG Replacement Buttons */}
                <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
                  <div className="px-2.5 py-1 rounded-full bg-white/90 border border-slate-200 text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-2xs tabular-nums">
                    <Rotate3d className="w-3.5 h-3.5 text-amber-600" />
                    <span>3D 360° • {normalizedSpin}°</span>
                  </div>

                  <div className="flex items-center gap-1 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => productFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-slate-200 text-[10px] font-bold"
                      title="Replace this Dress PNG with your own PNG"
                    >
                      Change Dress PNG
                    </button>

                    <button
                      type="button"
                      onClick={() => modelFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-slate-200 text-[10px] font-bold hidden sm:inline-flex"
                      title="Replace this Look's Model PNG with your own PNG"
                    >
                      Change Model PNG
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutoSpin360((s) => !s)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                        autoSpin360
                          ? 'bg-slate-900 text-white'
                          : 'bg-white/90 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <RotateCw className={`w-3 h-3 ${autoSpin360 ? 'animate-spin' : ''}`} />
                      <span>{autoSpin360 ? '360°' : 'Spin'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setZoom360((z) => (z === 1 ? 1.3 : 1))}
                      className={`p-1.5 rounded-full border transition-all ${
                        zoom360 > 1
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white/90 text-slate-700 border-slate-200'
                      }`}
                      title="Toggle Zoom"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3D Rotating Isolated Dress (Explicit dimensions so Mobile WebView never collapses it) */}
                <div
                  className="w-[210px] h-[175px] sm:w-[260px] sm:h-[225px] shrink-0 flex items-center justify-center"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `scale(${zoom360}) rotateY(${spinAngle}deg)`,
                  }}
                >
                  <ProductCutout
                    piece={activePiece}
                    customUrl={customProductPngs[activePiece.id]}
                    colorFilter={activeColor?.filter || 'none'}
                    className="w-full h-full"
                  />
                </div>

                {/* Bottom 360° Angle Presets */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-full border border-slate-200 shadow-2xs">
                  {[0, 45, 90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => {
                        setAutoSpin360(false);
                        setSpinAngle(deg);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums transition-colors ${
                        Math.abs(normalizedSpin - deg) < 18
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Title, Rating & Price */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold tabular-nums">
                      <span>{activePiece.rating}</span>
                      <Star className="w-2.5 h-2.5 fill-white" />
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {activePiece.reviewsCount} Verified Reviews · {activePiece.fabric}
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {activePiece.name}
                  </h1>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900">
                    {activePiece.price}
                  </div>
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
                <div className="flex flex-wrap items-center gap-2">
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

              {/* Size Selector + Interactive Indian Size Guide */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    Size (India): <span className="font-normal text-slate-500">{selectedSize}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSizeChart((s) => !s)}
                    className="inline-flex items-center gap-1 font-semibold text-slate-900 underline underline-offset-2"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>{showSizeChart ? 'Hide Size Chart' : 'Size Chart'}</span>
                  </button>
                </div>
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

                {showSizeChart && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] tabular-nums grid grid-cols-4 gap-1 text-slate-600">
                    <strong className="text-slate-900">Size</strong>
                    <strong className="text-slate-900">Bust</strong>
                    <strong className="text-slate-900">Waist</strong>
                    <strong className="text-slate-900">Hip</strong>
                    <span>XS</span><span>32&quot;</span><span>26&quot;</span><span>35&quot;</span>
                    <span>S</span><span>34&quot;</span><span>28&quot;</span><span>37&quot;</span>
                    <span>M</span><span>36&quot;</span><span>30&quot;</span><span>39&quot;</span>
                    <span>L</span><span>38&quot;</span><span>32&quot;</span><span>41&quot;</span>
                    <span>XL</span><span>40&quot;</span><span>34&quot;</span><span>43&quot;</span>
                    <span>XXL</span><span>42&quot;</span><span>36&quot;</span><span>45&quot;</span>
                  </div>
                )}
              </div>

              {/* Pincode Express Delivery Checker & Bank Offer */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Enter Pincode"
                    className="w-28 bg-white border border-slate-200 rounded-full px-3 py-1 text-xs focus:outline-none focus:border-slate-900 tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={handleCheckPincode}
                    className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10.5px] font-bold"
                  >
                    Check
                  </button>
                  <span className="text-[11px] text-emerald-700 font-medium truncate">
                    {pincodeStatus}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{activePiece.bankOffers[0]}</span>
                </div>
              </div>

              {/* CTA Buttons: Add to Cart & Buy Now */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    addToCart(activePiece, selectedSize, activeColor?.name || 'Original', 1)
                  }
                  className="py-3.5 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addToCart(activePiece, selectedSize, activeColor?.name || 'Original', 1);
                    setSelectedPieceId(null);
                    setConfirmedOrder(null);
                    setCartOpen(true);
                  }}
                  className="py-3.5 px-4 rounded-full bg-gradient-to-r from-[#ff9f00] to-[#fb641b] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Shopping Bag & Express Indian Checkout Modal */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-[#f2f6fb] p-3 sm:p-5 flex items-center justify-center overflow-y-auto"
          >
            <div className="w-full max-w-xl bg-white rounded-[32px] p-5 sm:p-6 shadow-xl border border-slate-200/80 flex flex-col gap-4 my-auto max-h-[94dvh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {confirmedOrder ? 'Order Confirmed' : `Shopping Bag (${totalCartCount})`}
                </h2>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {confirmedOrder ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Order {confirmedOrder.orderId} Confirmed!
                  </h3>
                  <p className="text-xs text-slate-600">
                    Total Paid: <strong>{confirmedOrder.total}</strong> via {confirmedOrder.method}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedOrder(null);
                      setCartOpen(false);
                    }}
                    className="px-6 py-3 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Back to Runway
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">Your Bag is Empty</p>
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold"
                  >
                    Explore 20 Models
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {cart.map((line) => (
                      <div
                        key={line.key}
                        className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70"
                      >
                        <div className="w-14 h-14 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center overflow-hidden">
                          <ProductCutout piece={line.piece} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {line.piece.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Size {line.size} · {line.color} × {line.quantity}
                          </p>
                          <p className="text-xs font-bold text-emerald-700 tabular-nums">
                            ₹{(line.piece.priceNumeric * line.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCart((prev) => prev.filter((item) => item.key !== line.key))
                          }
                          className="p-2 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handlePlaceOrder} className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Full Name"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
                      />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Mobile Number"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Complete Delivery Address & Pincode"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
                    />

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'UPI (GPay / PhonePe)', icon: Smartphone },
                        { label: 'Card / No-Cost EMI', icon: CreditCard },
                        { label: 'Cash on Delivery', icon: Banknote },
                      ].map((pm) => {
                        const Icon = pm.icon;
                        const active = paymentMethod === pm.label;
                        return (
                          <button
                            key={pm.label}
                            type="button"
                            onClick={() => setPaymentMethod(pm.label)}
                            className={`p-2.5 rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 text-center transition-all ${
                              active
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="truncate w-full">{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#ff9f00] to-[#fb641b] text-white text-xs font-bold uppercase tracking-wider shadow-md"
                    >
                      Place Order • {formattedCartTotal}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
