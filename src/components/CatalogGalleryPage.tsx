import React, { useState } from 'react';
import { LOOKS_DATA, PIECES_DATA, PieceItem } from '../data/collectionData';
import { ModelCutout, ProductCutout } from './VisualRenderers';
import { ArrowLeft, Heart, Plus, Rotate3d, Search } from 'lucide-react';

interface CatalogGalleryPageProps {
  processedModels: Record<number, string>;
  processedPieces: Record<number, string>;
  favorites: number[];
  onToggleFavorite: (pieceId: number) => void;
  onQuickAddToCart: (piece: PieceItem) => void;
  onOpenProductPage: (pieceId: number, lookIndex: number) => void;
  onBackToRunway: (lookIndex?: number) => void;
}

const CATEGORIES = [
  'All 20 Looks',
  'Couture Gowns',
  'Indian Couture',
  'Tailoring & Coats',
  'Footwear & Bags',
] as const;

export const CatalogGalleryPage: React.FC<CatalogGalleryPageProps> = ({
  processedModels,
  processedPieces,
  favorites,
  onToggleFavorite,
  onQuickAddToCart,
  onOpenProductPage,
  onBackToRunway,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All 20 Looks');
  const [query, setQuery] = useState<string>('');

  const filteredLooks = LOOKS_DATA.filter((look) => {
    const pieces = look.pieceIds.map((id) => PIECES_DATA[id]);
    const matchesCategory =
      selectedCategory === 'All 20 Looks' ||
      pieces.some((p) => p.category === selectedCategory);
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      look.title.toLowerCase().includes(q) ||
      `look ${look.lookNumber}`.includes(q) ||
      pieces.some(
        (p) =>
          p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-10">
      <div className="max-w-[1360px] mx-auto space-y-6">
        {/* Top Filter & Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Complete Runway Archive</span>
                <span aria-hidden="true">·</span>
                <span>20 Single Models &amp; 40 Couture Pieces</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                All 20 Solo Runway Models &amp; Matched Products
              </h1>
            </div>

            <button
              type="button"
              onClick={() => onBackToRunway()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to 3D Runway Line</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Interactive Category Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Look 1–20, gown, lehenga, velvet..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>
        </div>

        {/* 20 Solo Models + Their 2 Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredLooks.map((look) => {
            const lookPieces = look.pieceIds.map((id) => PIECES_DATA[id]);
            return (
              <section
                key={look.lookNumber}
                className="bg-white rounded-[32px] p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-bold text-slate-900 tabular-nums">
                        Look {String(look.lookNumber).padStart(2, '0')} / 20
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Solo Model Showcase</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">{look.title}</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenProductPage(look.pieceIds[0], look.index)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Rotate3d className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open 3D 360°</span>
                  </button>
                </div>

                {/* 3-Column Row: 1 Solo Model Left + 2 Matched Products Right */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                  {/* Column 1: Single Isolated Model */}
                  <div
                    onClick={() => onOpenProductPage(look.pieceIds[0], look.index)}
                    className="rounded-2xl bg-[radial-gradient(circle_at_50%_30%,#ffffff_0%,#eef3f9_100%)] border border-slate-200/80 p-3 flex flex-col items-center justify-between cursor-pointer group"
                  >
                    <div className="h-52 w-full flex items-center justify-center overflow-hidden">
                      <ModelCutout
                        look={look}
                        processedModels={processedModels}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 mt-2">
                      Solo Model #{look.lookNumber}
                    </span>
                  </div>

                  {/* Columns 2 & 3: Both Products Worn by This Model */}
                  {lookPieces.map((piece) => {
                    const isFav = favorites.includes(piece.id);
                    return (
                      <div
                        key={piece.id}
                        onClick={() => onOpenProductPage(piece.id, look.index)}
                        className="rounded-2xl bg-[#f8fafd] hover:bg-[#eff4fa] border border-slate-200/80 p-3 flex flex-col justify-between cursor-pointer group transition-colors"
                      >
                        <div className="relative h-40 w-full rounded-xl bg-white p-2.5 flex items-center justify-center overflow-hidden">
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
                            aria-label="Toggle wishlist"
                            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                            <span>Piece 0{piece.pieceNumber}</span>
                            <span className="font-semibold text-amber-600">360° View</span>
                          </div>
                          <h3 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                            {piece.name}
                          </h3>
                          <div className="mt-2 flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 tabular-nums">
                              {piece.price}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickAddToCart(piece);
                              }}
                              aria-label="Add to bag"
                              className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
