import React, { useState } from 'react';
import { LOOKS_DATA, PIECES_DATA, LookEntry, PieceItem } from '../data/collectionData';
import { ModelCutout, ProductCutout, Studio360Viewer } from './VisualRenderers';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  Truck,
  Zap,
  Rotate3d,
} from 'lucide-react';

interface ProductStudioPageProps {
  piece: PieceItem;
  processedModels: Record<number, string>;
  processedPieces: Record<number, string>;
  favorites: number[];
  onToggleFavorite: (pieceId: number) => void;
  onSelectPiece: (pieceId: number) => void;
  onBackToRunway: (lookIndex: number) => void;
  onAddToCart: (piece: PieceItem, size: string, color: string, quantity: number) => void;
  onBuyNow: (piece: PieceItem, size: string, color: string, quantity: number) => void;
}

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

export const ProductStudioPage: React.FC<ProductStudioPageProps> = ({
  piece,
  processedModels,
  processedPieces,
  favorites,
  onToggleFavorite,
  onSelectPiece,
  onBackToRunway,
  onAddToCart,
  onBuyNow,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeChart, setShowSizeChart] = useState<boolean>(false);
  const [pincode, setPincode] = useState<string>('400001');
  const [pincodeStatus, setPincodeStatus] = useState<string>(
    'Free Express Air Delivery by Tomorrow • Cash on Delivery & UPI Available'
  );

  const currentLook: LookEntry =
    LOOKS_DATA.find((l) => l.lookNumber === piece.lookNumber) || LOOKS_DATA[0];
  const lookPieces: PieceItem[] = currentLook.pieceIds.map((id) => PIECES_DATA[id]);
  const isFav = favorites.includes(piece.id);
  const activeColor = piece.colors[selectedColorIdx] || piece.colors[0];

  const handleCheckPincode = () => {
    const clean = pincode.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    if (clean.length !== 6) {
      setPincodeStatus('Please enter a valid 6-digit Indian Pincode (e.g. 400001)');
      return;
    }
    const city = PINCODE_CITIES[clean.slice(0, 3)] || 'Your Location (Pan-India Express)';
    setPincodeStatus(`Delivering to ${city} (${clean}) by Tomorrow, 11 AM • Free COD & UPI`);
  };

  const handleStepLook = (dir: -1 | 1) => {
    const nextLookIdx = (currentLook.index + dir + 20) % 20;
    const nextLook = LOOKS_DATA[nextLookIdx];
    setSelectedColorIdx(0);
    onSelectPiece(nextLook.pieceIds[0]);
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-10">
      <div className="max-w-[1360px] mx-auto space-y-6">
        {/* Dedicated Page Navigation Bar */}
        <div className="bg-white rounded-2xl px-4 sm:px-6 py-3.5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onBackToRunway(currentLook.index)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Runway Stage</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span>Look {currentLook.lookNumber} of 20</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-900 font-semibold">{currentLook.title}</span>
            </div>
          </div>

          {/* Switch Between This Model's Products + Prev/Next Look */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {lookPieces.map((lp) => (
                <button
                  key={lp.id}
                  type="button"
                  onClick={() => {
                    setSelectedColorIdx(0);
                    onSelectPiece(lp.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    lp.id === piece.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Piece 0{lp.pieceNumber}: {lp.name.split(' ').slice(0, 2).join(' ')}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleStepLook(-1)}
              title="Previous Model Look"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleStepLook(1)}
              title="Next Model Look"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition-colors shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Product Studio Split: 3D 360° Turntable Left + Purchase Module Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 6 Columns: 3D 360° Interactive Dress Turntable + All Products of this Model */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-4">
            <Studio360Viewer
              piece={piece}
              look={currentLook}
              processedPieces={processedPieces}
              processedModels={processedModels}
              colorFilter={activeColor?.filter || 'none'}
            />

            {/* Complete Display of Every Product Worn by Model # + Solo Model Reference Card */}
            <div className="bg-white rounded-[28px] p-4 sm:p-5 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Complete Look #{currentLook.lookNumber} Breakdown (Model + Both Products)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Click either piece below to load it into the 3D 360° turntable above
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Card 1: Solo Model Reference */}
                <div className="p-2.5 rounded-2xl bg-[#f4f7fb] border border-slate-200/80 flex flex-col items-center text-center">
                  <div className="h-28 w-full rounded-xl bg-white p-1.5 flex items-center justify-center overflow-hidden">
                    <ModelCutout look={currentLook} processedModels={processedModels} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-900 mt-2">
                    Solo Model #{currentLook.lookNumber}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate w-full">
                    {currentLook.title}
                  </span>
                </div>

                {/* Cards 2 & 3: Both Individual Products of this Model */}
                {lookPieces.map((lp) => {
                  const isCurrent = lp.id === piece.id;
                  return (
                    <button
                      key={lp.id}
                      type="button"
                      onClick={() => {
                        setSelectedColorIdx(0);
                        onSelectPiece(lp.id);
                      }}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center text-left transition-all ${
                        isCurrent
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                          : 'bg-[#f4f7fb] hover:bg-slate-100 text-slate-900 border-slate-200/80'
                      }`}
                    >
                      <div className="h-28 w-full rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden">
                        <ProductCutout piece={lp} processedPieces={processedPieces} />
                      </div>
                      <div className="w-full mt-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={isCurrent ? 'text-slate-300' : 'text-slate-500'}>
                            Piece 0{lp.pieceNumber}
                          </span>
                          <span className="font-mono font-bold text-amber-500">360°</span>
                        </div>
                        <p className="text-xs font-semibold truncate mt-0.5">{lp.name}</p>
                        <p
                          className={`text-xs font-bold tabular-nums mt-0.5 ${
                            isCurrent ? 'text-emerald-300' : 'text-emerald-700'
                          }`}
                        >
                          {lp.price}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 6 Columns: Contiguous Flipkart-Style Luxury Indian Purchase Module */}
          <div className="lg:col-span-6 bg-white rounded-[32px] p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
            {/* Header Metadata & Title */}
            <div className="space-y-2 border-b border-slate-100 pb-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">Maison Vell Atelier</span>
                  <span aria-hidden="true">·</span>
                  <span>Look {piece.lookNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span>{piece.category}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleFavorite(piece.id)}
                  aria-label="Save to Wishlist"
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isFav
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{isFav ? 'Saved' : 'Wishlist'}</span>
                </button>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {piece.name}
              </h1>
              <p className="text-sm text-slate-600">{piece.subtitle}</p>

              {/* Rating & Assurance Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold tabular-nums">
                  <span>{piece.rating}</span>
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
                </div>
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  {piece.reviewsCount} Verified Couture Buyers
                </span>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Maison Vell Assured</span>
                </span>
              </div>

              {/* Indian INR Price & Discount */}
              <div className="pt-2 flex items-baseline gap-3 tabular-nums">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900">{piece.price}</span>
                <span className="text-base text-slate-400 line-through">{piece.mrp}</span>
                <span className="text-sm font-bold text-emerald-700">{piece.discountLabel}</span>
              </div>
              <p className="text-xs text-slate-500 tabular-nums">
                Inclusive of all GST &amp; luxury duties · No-Cost EMI from ₹
                {Math.round(piece.priceNumeric / 6).toLocaleString('en-IN')}/month
              </p>
            </div>

            {/* Colour Selector with Live Garment Cutout Previews */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">
                  Select Shade: <span className="text-slate-600">{activeColor?.name}</span>
                </span>
                <span className="text-slate-500">{piece.colors.length} Couture Shades</span>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {piece.colors.map((c, idx) => {
                  const selected = idx === selectedColorIdx;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColorIdx(idx)}
                      className={`p-2 rounded-2xl border text-center transition-all ${
                        selected
                          ? 'border-2 border-slate-900 bg-slate-50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="h-14 w-full rounded-xl bg-[#f4f7fb] p-1.5 flex items-center justify-center overflow-hidden">
                        <ProductCutout
                          piece={piece}
                          processedPieces={processedPieces}
                          colorFilter={c.filter}
                        />
                      </div>
                      <span className="block text-[11px] font-medium text-slate-800 truncate mt-1.5">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Indian Size Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">
                  Select Size (India): <span className="text-slate-600">{selectedSize}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizeChart((s) => !s)}
                  className="inline-flex items-center gap-1 font-semibold text-slate-900 underline underline-offset-4"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>{showSizeChart ? 'Hide Size Guide' : 'Indian Size Guide'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {piece.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`min-w-[52px] h-11 px-4 rounded-xl text-xs font-bold transition-all ${
                      selectedSize === sz
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 hover:border-slate-900'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {showSizeChart && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs tabular-nums">
                  <div className="grid grid-cols-4 gap-1.5 text-slate-600">
                    <strong className="text-slate-900">Size</strong>
                    <strong className="text-slate-900">Bust/Chest</strong>
                    <strong className="text-slate-900">Waist</strong>
                    <strong className="text-slate-900">Hip</strong>
                    <span>XS</span><span>32 in</span><span>26 in</span><span>35 in</span>
                    <span>S</span><span>34 in</span><span>28 in</span><span>37 in</span>
                    <span>M</span><span>36 in</span><span>30 in</span><span>39 in</span>
                    <span>L</span><span>38 in</span><span>32 in</span><span>41 in</span>
                    <span>XL</span><span>40 in</span><span>34 in</span><span>43 in</span>
                    <span>XXL</span><span>42 in</span><span>36 in</span><span>45 in</span>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Buttons: Quantity + Add to Cart + Buy Now */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center justify-between sm:justify-center gap-3 bg-slate-100 px-3.5 py-2.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-medium text-slate-500 sm:hidden">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 font-bold text-slate-900"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-bold tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 font-bold text-slate-900"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onAddToCart(piece, selectedSize, activeColor?.name || 'Original', quantity)
                }
                className="flex-1 py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onBuyNow(piece, selectedSize, activeColor?.name || 'Original', quantity)
                }
                className="flex-1 py-3.5 px-5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 whitespace-nowrap"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Buy Now • {piece.price}</span>
              </button>
            </div>

            {/* Available Indian Bank & UPI Offers */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <p className="text-xs font-semibold text-slate-900">
                Available Bank &amp; UPI Offers
              </p>
              <div className="space-y-1.5">
                {piece.bankOffers.map((offer, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{offer}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Indian Pincode Delivery & COD Verification */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <MapPin className="w-4 h-4 text-slate-700" />
                <span>Check Express Delivery &amp; COD Availability</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Enter 6-digit Pincode (e.g. 400001)"
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-slate-900 tabular-nums"
                />
                <button
                  type="button"
                  onClick={handleCheckPincode}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Verify Pincode
                </button>
              </div>
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 shrink-0" />
                <span>{pincodeStatus}</span>
              </p>
            </div>

            {/* Detailed Craftsmanship & Specifications */}
            <div className="space-y-3 border-t border-slate-100 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Couture Specifications &amp; Craftsmanship
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-500 block">Fabric Composition</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{piece.fabric}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-500 block">Silhouette / Fit</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{piece.fit}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-500 block">Occasion</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{piece.occasion}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-500 block">Wash &amp; Care</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{piece.care}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pt-1">{piece.description}</p>
            </div>
          </div>
        </div>

        {/* Bottom Switcher: All 20 Solo Models & Their Products */}
        <section className="bg-white rounded-[32px] p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Switch to Any of the 20 Solo Models &amp; Their Products
              </h2>
              <p className="text-xs text-slate-500">
                Every look features a unique single model with matched couture pieces ready for 3D 360° inspection
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
            {LOOKS_DATA.map((lk) => {
              const isCurrent = lk.lookNumber === piece.lookNumber;
              const firstPiece = PIECES_DATA[lk.pieceIds[0]];
              return (
                <button
                  key={lk.lookNumber}
                  type="button"
                  onClick={() => {
                    setSelectedColorIdx(0);
                    onSelectPiece(lk.pieceIds[0]);
                  }}
                  className={`p-2 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                      : 'bg-[#f4f7fb] hover:bg-slate-100 text-slate-900 border-slate-200/80'
                  }`}
                >
                  <div className="h-24 w-full rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden">
                    <ModelCutout look={lk} processedModels={processedModels} />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold tabular-nums">Look {lk.lookNumber}</span>
                      <Rotate3d className="w-3 h-3 text-amber-500" />
                    </div>
                    <p
                      className={`text-[10px] truncate mt-0.5 ${
                        isCurrent ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {firstPiece.price}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
