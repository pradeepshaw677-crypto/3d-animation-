export interface ColorOption {
  name: string;
  hex: string;
  filter: string;
}

export interface PieceItem {
  id: number;
  lookNumber: number;
  pieceNumber: 1 | 2;
  sourceType: 'higgs_pieces' | 'solo_garment';
  /**
   * For 'higgs_pieces': pixel box [x0, x1, y0, y1] on 960x720 PIECES_SHEET.
   * For 'solo_garment': normalized [nx0, nx1, ny0, ny1] (0..1) on the solo model image.
   */
  cropBox: [number, number, number, number];
  soloImageUrl?: string;
  maskNeckline?: boolean;
  name: string;
  subtitle: string;
  price: string;
  priceNumeric: number;
  mrp: string;
  mrpNumeric: number;
  discountLabel: string;
  category: 'Couture Gowns' | 'Tailoring & Coats' | 'Indian Couture' | 'Footwear & Bags';
  description: string;
  fabric: string;
  pattern: string;
  occasion: string;
  care: string;
  fit: string;
  origin: string;
  rating: number;
  reviewsCount: number;
  sizes: string[];
  colors: ColorOption[];
  bankOffers: string[];
}

export interface LookEntry {
  index: number;
  lookNumber: number;
  title: string;
  subtitle: string;
  silhouette: string;
  accentHex: string;
  sourceType: 'higgs_models' | 'solo_model';
  /**
   * For 'higgs_models': pixel box [x0, x1, y0, y1] on 960x540 MODELS_SHEET.
   * For 'solo_model': normalized [nx0, nx1, ny0, ny1] (0..1) on soloImageUrl.
   */
  modelBox: [number, number, number, number];
  soloImageUrl?: string;
  pieceIds: [number, number];
}

export const HIGGS_MODELS_SHEET =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042056_1a704ff7-b0e5-4a9f-bbda-62392b819fb6.png&w=3840&q=85';

export const HIGGS_PIECES_SHEET =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042057_080e85b0-b4aa-4072-8eb9-2304c7baf42b.png&w=2400&q=85';

const DEFAULT_BANK_OFFERS = [
  'Bank Offer: 10% Instant Discount up to ₹4,500 on HDFC & ICICI Credit Cards',
  'UPI Offer: Flat ₹750 Instant Cashback on GPay, PhonePe & Paytm UPI',
  'No-Cost EMI: Starting at ₹3,499/month on all major Indian bank cards',
  'Maison Vell Assured: Free Express Air Delivery + 7-Day Easy Size Exchange',
];

const COLOR_PALETTES: ColorOption[][] = [
  [
    { name: 'Runway Original', hex: '#d8c4b8', filter: 'none' },
    { name: 'Royal Emerald', hex: '#14532d', filter: 'hue-rotate(115deg) saturate(1.25)' },
    { name: 'Jaipur Ruby', hex: '#881337', filter: 'hue-rotate(325deg) saturate(1.35)' },
    { name: 'Midnight Indigo', hex: '#1e1b4b', filter: 'hue-rotate(210deg) saturate(1.25) brightness(0.92)' },
  ],
  [
    { name: 'Atelier Signature', hex: '#7f1d1d', filter: 'none' },
    { name: 'Imperial Sapphire', hex: '#1e3a8a', filter: 'hue-rotate(215deg) saturate(1.2)' },
    { name: 'Zari Champagne', hex: '#d4af37', filter: 'hue-rotate(42deg) saturate(1.3) brightness(1.06)' },
    { name: 'Obsidian Noir', hex: '#18181b', filter: 'saturate(0.15) contrast(1.18) brightness(0.85)' },
  ],
];

interface RawLookSpec {
  lookNumber: number;
  title: string;
  subtitle: string;
  silhouette: string;
  accentHex: string;
  sourceType: 'higgs_models' | 'solo_model';
  modelBox: [number, number, number, number];
  soloImageUrl?: string;
  p1: {
    name: string;
    subtitle: string;
    priceNumeric: number;
    mrpNumeric: number;
    category: PieceItem['category'];
    cropBox: [number, number, number, number];
    maskNeckline?: boolean;
    fabric: string;
    fit: string;
    occasion: string;
    description: string;
  };
  p2: {
    name: string;
    subtitle: string;
    priceNumeric: number;
    mrpNumeric: number;
    category: PieceItem['category'];
    cropBox: [number, number, number, number];
    maskNeckline?: boolean;
    fabric: string;
    fit: string;
    occasion: string;
    description: string;
  };
}

const RAW_LOOKS: RawLookSpec[] = [
  // ================= LOOKS 1 TO 6: ORIGINAL 6 ISOLATED HIGGS MODELS & 12 ISOLATED PRODUCTS =================
  {
    lookNumber: 1,
    title: 'Ivory Architectural Ruffle & Pleats',
    subtitle: 'Paris-Mumbai Couture Capsule • Look 01',
    silhouette: 'Sculpted Organza Top & Sunburst Maxi Skirt',
    accentHex: '#c8b6a6',
    sourceType: 'higgs_models',
    modelBox: [792, 949, 48, 496],
    p1: {
      name: 'Sculpted Ruffle Organza Blouse',
      subtitle: 'Hand-draped architectural ivory silk organza couture top',
      priceNumeric: 24990,
      mrpNumeric: 39990,
      category: 'Couture Gowns',
      cropBox: [22, 232, 30, 250],
      fabric: '100% Mulberry Silk Organza',
      fit: 'Sculpted Couture Fit',
      occasion: 'Cocktail & Red Carpet',
      description:
        'Hand-pleated ivory silk organza blouse engineered with spiral structural ruffles and internal boning for weightless architectural volume.',
    },
    p2: {
      name: 'Sunburst Pleated Silk Maxi Skirt',
      subtitle: 'Floor-grazing accordion-pleated ivory crepe couture skirt',
      priceNumeric: 28990,
      mrpNumeric: 45990,
      category: 'Couture Gowns',
      cropBox: [256, 466, 30, 250],
      fabric: 'Heavy Silk Crepe de Chine',
      fit: 'High-Waist Flowing A-Line',
      occasion: 'Evening Gala & Reception',
      description:
        'Knife-pleated floor-length maxi skirt crafted from 30-momme silk crepe that ripples in 360 degrees with every step.',
    },
  },
  {
    lookNumber: 2,
    title: 'Noir Nappa Tailoring & Wide Trousers',
    subtitle: 'Paris-Mumbai Couture Capsule • Look 02',
    silhouette: 'Belted Nappa Jacket & Fluid Wool Trousers',
    accentHex: '#3f3f46',
    sourceType: 'higgs_models',
    modelBox: [641, 783, 48, 496],
    p1: {
      name: 'Atelier Belted Nappa Leather Jacket',
      subtitle: 'Supple full-grain lambskin jacket with cinched waist belt',
      priceNumeric: 42990,
      mrpNumeric: 68990,
      category: 'Tailoring & Coats',
      cropBox: [490, 700, 30, 250],
      fabric: 'Italian Full-Grain Lambskin Nappa',
      fit: 'Structured Cinched Waist',
      occasion: 'Runway & Evening Luxe',
      description:
        'Precision-cut black lambskin jacket with wide architectural lapels, hidden snap closure, and a tonal leather waist belt.',
    },
    p2: {
      name: 'Pleated Wide-Leg Virgin Wool Trousers',
      subtitle: 'Full-length tailored black palazzo trousers with double pleats',
      priceNumeric: 21990,
      mrpNumeric: 34990,
      category: 'Tailoring & Coats',
      cropBox: [724, 934, 30, 250],
      fabric: 'Super 130s Virgin Wool Gabardine',
      fit: 'High-Rise Wide-Leg',
      occasion: 'Formal & Luxury Evening',
      description:
        'Fluid wide-leg trousers tailored with deep front pleats and elongated leg drape for a commanding runway silhouette.',
    },
  },
  {
    lookNumber: 3,
    title: 'Blush Billow Silk & Sculpted Midi',
    subtitle: 'Paris-Mumbai Couture Capsule • Look 03',
    silhouette: 'Lantern-Sleeve Chiffon Blouse & Nappa Midi Skirt',
    accentHex: '#d6a29c',
    sourceType: 'higgs_models',
    modelBox: [476, 633, 48, 496],
    p1: {
      name: 'Billow-Sleeve Blush Silk Blouse',
      subtitle: 'Sheer blush silk georgette top with dramaticbishop sleeves',
      priceNumeric: 19990,
      mrpNumeric: 32990,
      category: 'Couture Gowns',
      cropBox: [22, 232, 260, 480],
      fabric: 'Pure French Silk Georgette',
      fit: 'Relaxed Draped Volume',
      occasion: 'Soirée & Festive Dinner',
      description:
        'Airy blush-rose silk blouse with gathered neckline and billowing lantern cuffs fastened with mother-of-pearl buttons.',
    },
    p2: {
      name: 'A-Line Sculpted Nappa Midi Skirt',
      subtitle: 'High-waisted panelled leather midi skirt in espresso noir',
      priceNumeric: 26990,
      mrpNumeric: 42990,
      category: 'Tailoring & Coats',
      cropBox: [256, 466, 260, 480],
      fabric: 'Butter-Soft Calfskin Leather',
      fit: 'Sculpted A-Line Midi',
      occasion: 'Cocktail & Editorial',
      description:
        'Architectural A-line midi skirt seamed from छह precision leather panels with silk-satin lining.',
    },
  },
  {
    lookNumber: 4,
    title: 'Champagne Satin Trench & Lounge',
    subtitle: 'Paris-Mumbai Couture Capsule • Look 04',
    silhouette: 'Draped Storm-Flap Trench & Fluid Trousers',
    accentHex: '#d5c1a7',
    sourceType: 'higgs_models',
    modelBox: [331, 470, 48, 496],
    p1: {
      name: 'Champagne Duchess Satin Trench Coat',
      subtitle: 'Double-breasted luminous satin duster trench with tie belt',
      priceNumeric: 38990,
      mrpNumeric: 62990,
      category: 'Tailoring & Coats',
      cropBox: [490, 700, 492, 712],
      fabric: 'Heavy Duchess Silk Satin',
      fit: 'Relaxed Belted Duster',
      occasion: 'Runway & Destination Luxe',
      description:
        'Luminous champagne satin trench coat featuring storm flaps, tonal buckled cuffs, and a sweeping calf-length hem.',
    },
    p2: {
      name: 'Champagne Tailored Puddle Trousers',
      subtitle: 'High-waisted liquid satin wide-leg trousers',
      priceNumeric: 22490,
      mrpNumeric: 36990,
      category: 'Tailoring & Coats',
      cropBox: [724, 934, 492, 712],
      fabric: 'Heavy Duchess Silk Satin',
      fit: 'Elongated Puddle Hem',
      occasion: 'Evening & Red Carpet',
      description:
        'Tailored wide-leg trousers in matching champagne satin that pool effortlessly over evening heels.',
    },
  },
  {
    lookNumber: 5,
    title: 'Sage Botanical Pleated Couture Gown',
    subtitle: 'Paris-Mumbai Couture Capsule • Look 05',
    silhouette: 'Plunging Cross-Back Pleated Silk Chiffon Gown',
    accentHex: '#7d917b',
    sourceType: 'higgs_models',
    modelBox: [178, 330, 48, 496],
    p1: {
      name: 'Sage Micro-Pleated Silk Evening Gown',
      subtitle: 'Floor-length hand-pleated sage silk chiffon goddess gown',
      priceNumeric: 46990,
      mrpNumeric: 74990,
      category: 'Couture Gowns',
      cropBox: [22, 232, 492, 712],
      fabric: 'Botanical-Dyed Silk Mousseline',
      fit: 'Sculpted Bodice & Flowing Skirt',
      occasion: 'Wedding Reception & Gala',
      description:
        'Artisanal micro-pleated sage green silk mousseline gown with a V-plunge bodice, tiered waist release, and thigh slit.',
    },
    p2: {
      name: 'Pearl Satin Bias-Cut Inner Slip Dress',
      subtitle: 'Luminous champagne-pearl bias-cut silk charmeuse slip',
      priceNumeric: 18990,
      mrpNumeric: 29990,
      category: 'Couture Gowns',
      cropBox: [256, 466, 492, 712],
      fabric: '22-Momme Mulberry Silk Charmeuse',
      fit: 'Bias-Cut Fluid Skim',
      occasion: 'Cocktail & Resort Evening',
      description:
        'Cut on a true 45-degree bias from liquid silk charmeuse with delicate rouleau shoulder straps.',
    },
  },
  {
    lookNumber: 6,
    title: 'Blush Ostrich Feather Cape & Satin',
    subtitle: 'Paris-Mumbai Couture Capsule • Look 06',
    silhouette: 'Hand-Plumed Couture Jacket & Wide Satin Trousers',
    accentHex: '#e3bfb3',
    sourceType: 'higgs_models',
    modelBox: [12, 176, 48, 496],
    p1: {
      name: 'Blush Couture Feather-Plume Jacket',
      subtitle: 'Hand-knotted blush marabou & ostrich feather opera coat',
      priceNumeric: 54990,
      mrpNumeric: 89990,
      category: 'Couture Gowns',
      cropBox: [490, 700, 260, 480],
      fabric: 'Ethical Couture Plumes on Silk Tulle',
      fit: 'Cropped Opera Silhouette',
      occasion: 'Bridal Sangeet & Red Carpet',
      description:
        'Showstopping blush-pink couture jacket crafted with thousands of hand-tied wispy plumes over a silk satin lining.',
    },
    p2: {
      name: 'Blush Liquid Satin Palazzo Trousers',
      subtitle: 'High-rise sweeping blush rose silk-satin trousers',
      priceNumeric: 23990,
      mrpNumeric: 38990,
      category: 'Couture Gowns',
      cropBox: [724, 934, 260, 480],
      fabric: '30-Momme Silk Duchess Satin',
      fit: 'High-Waist Wide Palazzo',
      occasion: 'Festive & Gala Evening',
      description:
        'Ultra-fluid blush satin palazzo trousers with a concealed side zip and mirror-gloss finish.',
    },
  },

  // ================= LOOKS 7 TO 20: 14 SOLO SINGLE-MODEL PORTRAITS & ISOLATED GARMENTS =================
  {
    lookNumber: 7,
    title: 'Crimson Architectural Organza Gown',
    subtitle: 'Solo Runway Edition • Look 07',
    silhouette: 'Sculpted Fan-Pleat Bodice & Tiered Organza Train',
    accentHex: '#991b1b',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_07.jpg',
    modelBox: [0.06, 0.94, 0.04, 0.96],
    p1: {
      name: 'Crimson Fan-Pleat Silk Organza Gown',
      subtitle: 'Architectural ruby-crimson ruffled shoulder evening gown',
      priceNumeric: 58990,
      mrpNumeric: 94990,
      category: 'Couture Gowns',
      cropBox: [0.18, 0.85, 0.22, 0.88],
      maskNeckline: true,
      fabric: 'Pure Como Silk Organza',
      fit: 'Corseted Waist & Voluminous Train',
      occasion: 'Red Carpet, Reception & Cocktail',
      description:
        'Dramatic crimson silk organza couture gown featuring origami fan-pleated lapels, puffed rosette sleeves, and cascading asymmetric tiers.',
    },
    p2: {
      name: '24K Gold-Leaf Strappy Stiletto Sandals',
      subtitle: 'Metallic gold Nappa ankle-wrap evening heels (105mm)',
      priceNumeric: 18490,
      mrpNumeric: 29990,
      category: 'Footwear & Bags',
      cropBox: [0.36, 0.68, 0.77, 0.95],
      maskNeckline: false,
      fabric: 'Metallic Gold Italian Nappa Leather',
      fit: 'True to Indian/EU Size (105mm Heel)',
      occasion: 'Bridal & Gala Footwear',
      description:
        'Handcrafted metallic gold stiletto sandals with asymmetric arch straps and cushioned leather footbeds.',
    },
  },
  {
    lookNumber: 8,
    title: 'Emerald Draped Velvet Power Suit',
    subtitle: 'Solo Runway Edition • Look 08',
    silhouette: 'Asymmetric Wrap Velvet Blazer & Satin Trousers',
    accentHex: '#065f46',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_08.jpg',
    modelBox: [0.15, 0.85, 0.04, 0.96],
    p1: {
      name: 'Emerald Silk-Velvet Draped Wrap Blazer',
      subtitle: 'Jewel-toned emerald velvet tuxedo jacket with side-button drape',
      priceNumeric: 36990,
      mrpNumeric: 58990,
      category: 'Tailoring & Coats',
      cropBox: [0.26, 0.72, 0.17, 0.52],
      maskNeckline: true,
      fabric: 'Silk-Viscose Plush Velvet',
      fit: 'Tailored Asymmetric Wrap',
      occasion: 'Evening Cocktail & Power Formal',
      description:
        'Rich emerald green velvet blazer engineered with peak lapels and side-pleated waist draping that catches studio light from every angle.',
    },
    p2: {
      name: 'Emerald Liquid Satin Wide-Leg Trousers',
      subtitle: 'Floor-skimming emerald silk-satin tailored trousers',
      priceNumeric: 22990,
      mrpNumeric: 36990,
      category: 'Tailoring & Coats',
      cropBox: [0.30, 0.70, 0.45, 0.92],
      maskNeckline: false,
      fabric: 'Heavy Silk Charmeuse',
      fit: 'High-Rise Straight Wide-Leg',
      occasion: 'Evening & Luxury Workwear',
      description:
        'Full-length emerald green satin trousers with pressed center creases and a fluid drape.',
    },
  },
  {
    lookNumber: 9,
    title: 'Royal Cobalt Sculptural Trench & Silver',
    subtitle: 'Solo Runway Edition • Look 09',
    silhouette: 'Belted Double-Faced Wool Trench & Mirror Boots',
    accentHex: '#1d4ed8',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_09.jpg',
    modelBox: [0.15, 0.85, 0.04, 0.96],
    p1: {
      name: 'Royal Cobalt Double-Faced Wool Trench Coat',
      subtitle: 'Electric cobalt storm-flap belted runway overcoat',
      priceNumeric: 49990,
      mrpNumeric: 79990,
      category: 'Tailoring & Coats',
      cropBox: [0.24, 0.74, 0.17, 0.80],
      maskNeckline: true,
      fabric: '100% Double-Faced Merino Wool',
      fit: 'Oversized Belted Couture Coat',
      occasion: 'Winter Luxe & Airport Editorial',
      description:
        'Saturated royal cobalt trench coat featuring exaggerated storm flaps, tonal covered buckle belt, and tabbed cuffs.',
    },
    p2: {
      name: 'Liquid Silver Mirror-Leather Ankle Boots',
      subtitle: 'Chromatic silver block-heel runway boots',
      priceNumeric: 24490,
      mrpNumeric: 39990,
      category: 'Footwear & Bags',
      cropBox: [0.35, 0.73, 0.76, 0.96],
      maskNeckline: false,
      fabric: 'Mirrored Metallic Calfskin',
      fit: 'Sculpted 85mm Block Heel',
      occasion: 'Runway & Party Statement',
      description:
        'High-shine silver metallic leather ankle boots with squared toes and architectural block heels.',
    },
  },
  {
    lookNumber: 10,
    title: 'Champagne Gold Zari Brocade Corset Gown',
    subtitle: 'Solo Indian Couture Edition • Look 10',
    silhouette: 'Handwoven Banarasi Zari Corset & Floor Cape',
    accentHex: '#b45309',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_10.jpg',
    modelBox: [0.12, 0.88, 0.04, 0.96],
    p1: {
      name: 'Champagne Gold Zari Corset & Silk Cape',
      subtitle: 'Hand-embroidered Banarasi gold zardozi corset with attached floor cape',
      priceNumeric: 64990,
      mrpNumeric: 105990,
      category: 'Indian Couture',
      cropBox: [0.18, 0.80, 0.22, 0.62],
      maskNeckline: true,
      fabric: 'Pure Katan Silk Brocade & Tissue Cape',
      fit: 'Structured Boned Corset',
      occasion: 'Bridal Reception, Sangeet & Engagement',
      description:
        'Regal champagne-gold sculpted corset intricately woven with antique Banarasi zari motifs and paired with a sweeping liquid-silk shoulder cape.',
    },
    p2: {
      name: 'Banarasi Gold Brocade Pleated Gown Skirt',
      subtitle: 'Box-pleated floral gold zari brocade column skirt',
      priceNumeric: 44990,
      mrpNumeric: 72990,
      category: 'Indian Couture',
      cropBox: [0.22, 0.76, 0.42, 0.90],
      maskNeckline: false,
      fabric: 'Handloom Varanasi Silk Zari Brocade',
      fit: 'High-Waist Box-Pleated Column',
      occasion: 'Wedding & Royal Festive',
      description:
        'Heirloom gold brocade skirt tailored with central cascading pleats that elongate the silhouette.',
    },
  },
  {
    lookNumber: 11,
    title: 'Amethyst Pleated Chiffon & Pearl Bag',
    subtitle: 'Solo Runway Edition • Look 11',
    silhouette: 'Four-Tier Micro-Pleated Chiffon Gown & Pearl Minaudière',
    accentHex: '#7e22ce',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_11.jpg',
    modelBox: [0.15, 0.85, 0.03, 0.96],
    p1: {
      name: 'Amethyst Tiered Micro-Pleated Chiffon Gown',
      subtitle: 'High-neck lavender amethyst accordion-pleated maxi dress',
      priceNumeric: 41990,
      mrpNumeric: 67990,
      category: 'Couture Gowns',
      cropBox: [0.24, 0.82, 0.16, 0.87],
      maskNeckline: true,
      fabric: 'Featherweight Silk Chiffon',
      fit: 'Cinch-Waist Four-Tier Maxi',
      occasion: 'Destination Wedding & Garden Gala',
      description:
        'Ethereal lavender-amethyst gown with a ruffled mock neck, sheer pleated bishop sleeves, and four floating tiers of sunburst-pleated chiffon.',
    },
    p2: {
      name: 'Hand-Beaded Mother-of-Pearl Top-Handle Bag',
      subtitle: 'Artisanal ivory pearl-woven structured box minaudière',
      priceNumeric: 16990,
      mrpNumeric: 27990,
      category: 'Footwear & Bags',
      cropBox: [0.28, 0.44, 0.51, 0.67],
      maskNeckline: false,
      fabric: 'Freshwater Pearl Beads on Satin Frame',
      fit: 'Structured Mini Tote (Fits Pro Max Phone)',
      occasion: 'Bridal & Cocktail Accessory',
      description:
        'Hand-woven pearl box bag with a sculptural pearl ring handle and gold-plated kiss-lock clasp.',
    },
  },
  {
    lookNumber: 12,
    title: 'Obsidian Satin-Lapel Tuxedo Evening Gown',
    subtitle: 'Solo Runway Edition • Look 12',
    silhouette: 'Plunging Peak-Lapel Tuxedo Floor-Length Gown',
    accentHex: '#18181b',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_12.jpg',
    modelBox: [0.18, 0.82, 0.04, 0.96],
    p1: {
      name: 'Obsidian Peak-Lapel Tuxedo Couture Gown',
      subtitle: 'Floor-length black wool-silk tuxedo dress with duchess satin lapels',
      priceNumeric: 52990,
      mrpNumeric: 84990,
      category: 'Couture Gowns',
      cropBox: [0.28, 0.72, 0.18, 0.88],
      maskNeckline: true,
      fabric: ' Barathea Wool & Duchess Silk Satin',
      fit: 'Sculpted Hourglass Trumpet Hem',
      occasion: 'Black-Tie Gala & Awards Night',
      description:
        'Commanding black-tie tuxedo gown combining sharp duchess-satin peak lapels and a single-button satin cummerbund waist with a flared floor-length skirt.',
    },
    p2: {
      name: 'Obsidian Patent-Pointed Stiletto Pumps',
      subtitle: ' sleek black patent leather pointed-toe evening pumps',
      priceNumeric: 17990,
      mrpNumeric: 28990,
      category: 'Footwear & Bags',
      cropBox: [0.38, 0.62, 0.83, 0.95],
      maskNeckline: false,
      fabric: 'Italian Patent Calfskin',
      fit: '100mm Stiletto Heel',
      occasion: 'Formal & Red Carpet',
      description:
        'Razor-sharp pointed stiletto pumps in mirror-gloss black patent leather.',
    },
  },
  {
    lookNumber: 13,
    title: 'Terracotta Raw Silk Draped Midi & Belt',
    subtitle: 'Solo Runway Edition • Look 13',
    silhouette: 'Asymmetric Folded Raw Silk Dress & Sculpted Leather Belt',
    accentHex: '#9a3412',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_13.jpg',
    modelBox: [0.18, 0.82, 0.03, 0.96],
    p1: {
      name: 'Terracotta Tussar Silk Asymmetric Draped Dress',
      subtitle: 'Hand-pleated burnt terracotta raw silk cocktail midi dress',
      priceNumeric: 29990,
      mrpNumeric: 48990,
      category: 'Couture Gowns',
      cropBox: [0.30, 0.68, 0.17, 0.79],
      maskNeckline: true,
      fabric: 'Handspun Bhagalpuri Tussar Silk',
      fit: 'Draped Asymmetric Midi',
      occasion: 'Resort Luxe, Sundowner & Art Opening',
      description:
        'Rich burnt-terracotta raw silk dress sculpted with diagonal shoulder pleats and a cascading waterfall side drape.',
    },
    p2: {
      name: 'Espresso Saddle-Leather Belt & Strappy Heels Set',
      subtitle: 'Wide brass-buckled waist belt & matching block-heel sandals',
      priceNumeric: 15990,
      mrpNumeric: 25990,
      category: 'Footwear & Bags',
      cropBox: [0.36, 0.67, 0.80, 0.96],
      maskNeckline: false,
      fabric: 'Vegetable-Tanned Espresso Calfskin',
      fit: '80mm Architectural Block Heel',
      occasion: 'Day-to-Evening Luxury',
      description:
        'Hand-stitched espresso brown leather sandals paired with our signature antique-brass waist belt.',
    },
  },
  {
    lookNumber: 14,
    title: 'Ivory Pearl-Encrusted Couture Sari Gown',
    subtitle: 'Solo Indian Couture Edition • Look 14',
    silhouette: 'Pre-Draped Pearl Sari Gown with Structured Shoulder Cape',
    accentHex: '#d6d3d1',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_14.jpg',
    modelBox: [0.16, 0.92, 0.04, 0.95],
    p1: {
      name: 'Ivory Pearl-Embroidered Pre-Draped Sari Gown',
      subtitle: 'Hand-beaded freshwater pearl & crystal couture sari with train',
      priceNumeric: 74990,
      mrpNumeric: 119990,
      category: 'Indian Couture',
      cropBox: [0.30, 0.90, 0.24, 0.91],
      maskNeckline: true,
      fabric: 'Pure Silk Georgette with Hand-Sewn Pearls',
      fit: 'Pre-Draped Couture Sari Fit',
      occasion: 'Cocktail, Engagement & White Wedding',
      description:
        'Masterpiece ivory couture sari gown embellished with over 18,000 hand-sewn pearls and glass bugle beads, finished with a sweeping pallu train.',
    },
    p2: {
      name: 'Sculpted Pearl-Epaulette Couture Sari Blouse',
      subtitle: 'Architectural cap-sleeve pearl-encrusted corset choli',
      priceNumeric: 27990,
      mrpNumeric: 44990,
      category: 'Indian Couture',
      cropBox: [0.33, 0.70, 0.23, 0.45],
      maskNeckline: true,
      fabric: 'Raw Silk with Linear Pearl Embroidery',
      fit: 'Structured Padded Couture Blouse',
      occasion: 'Bridal & Festive Couture',
      description:
        'Power-shoulder couture blouse featuring cascading rows of graduated pearls across the shoulders and sweetheart neckline.',
    },
  },
  {
    lookNumber: 15,
    title: 'Peacock Teal Satin & Ostrich Plume Gown',
    subtitle: 'Solo Runway Edition • Look 15',
    silhouette: 'Bias-Cut Liquid Satin Column Gown with Feather Cuffs',
    accentHex: '#0f766e',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_15.jpg',
    modelBox: [0.18, 0.82, 0.04, 0.96],
    p1: {
      name: 'Peacock Teal Liquid Satin Feather-Cuff Gown',
      subtitle: 'Jewel-toned teal silk column dress with detachable ostrich cuffs',
      priceNumeric: 45990,
      mrpNumeric: 73990,
      category: 'Couture Gowns',
      cropBox: [0.26, 0.74, 0.20, 0.86],
      maskNeckline: true,
      fabric: '30-Momme Mulberry Silk Satin & Ostrich Plumes',
      fit: 'Bias-Cut Column Silhouette',
      occasion: 'Cocktail Night & Festive Soirée',
      description:
        'Mesmerizing peacock-teal silk satin column gown that skims the body like liquid glass, accented with dramatic dyed ostrich-feather cuffs.',
    },
    p2: {
      name: 'Champagne-Silver Minimalist Evening Sandals',
      subtitle: 'Single-strap metallic silver leather evening heels',
      priceNumeric: 16490,
      mrpNumeric: 26990,
      category: 'Footwear & Bags',
      cropBox: [0.40, 0.62, 0.82, 0.95],
      maskNeckline: false,
      fabric: 'Metallic Specchio Leather',
      fit: '95mm Slim Heel',
      occasion: 'Evening & Party',
      description:
        'Ultra-clean single-band metallic sandals designed to elongate the leg.',
    },
  },
  {
    lookNumber: 16,
    title: 'Rose-Gold Metallic Pleated Lamé Cocktail',
    subtitle: 'Solo Runway Edition • Look 16',
    silhouette: 'Plunging Sunburst-Pleated Rose-Gold Lamé Dress',
    accentHex: '#be185d',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_16.jpg',
    modelBox: [0.20, 0.80, 0.04, 0.96],
    p1: {
      name: 'Rose-Gold Metallic Sunburst Pleated Cocktail Dress',
      subtitle: 'Shimmering rose-gold silk lamé mini-midi dress with banded waist',
      priceNumeric: 34990,
      mrpNumeric: 55990,
      category: 'Couture Gowns',
      cropBox: [0.30, 0.68, 0.19, 0.65],
      maskNeckline: true,
      fabric: 'Metallic Rose-Gold Silk Blend Lamé',
      fit: 'Fitted Bodice & Flared Pleated Skirt',
      occasion: 'Cocktail Party, After-Party & Club Luxe',
      description:
        'Luminous rose-gold metallic lamé dress featuring a pleated V-bodice, widehorizontally ruched waist cummerbund, and a kinetic knife-pleated skirt.',
    },
    p2: {
      name: 'Rose-Gold Metallic Ankle-Strap Stilettos',
      subtitle: 'Matching rose-gold specchio leather 105mm evening heels',
      priceNumeric: 17490,
      mrpNumeric: 28490,
      category: 'Footwear & Bags',
      cropBox: [0.40, 0.72, 0.81, 0.96],
      maskNeckline: false,
      fabric: 'Rose-Gold Specchio Calfskin',
      fit: '105mm Stiletto',
      occasion: 'Cocktail & Bridal Reception',
      description:
        'High-shine rose-gold stiletto sandals with delicate ankle buckles.',
    },
  },
  {
    lookNumber: 17,
    title: 'Marigold Saffron Ruffle Cape & Palazzo',
    subtitle: 'Solo Indian Couture Edition • Look 17',
    silhouette: 'Three-Tier Chanderi Silk Ruffle Cape & Wide Palazzos',
    accentHex: '#d97706',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_17.jpg',
    modelBox: [0.20, 0.80, 0.04, 0.96],
    p1: {
      name: 'Marigold Saffron Chanderi Tiered Ruffle Cape Top',
      subtitle: 'Festive saffron-gold silk organza ruffled poncho cape',
      priceNumeric: 31990,
      mrpNumeric: 51990,
      category: 'Indian Couture',
      cropBox: [0.28, 0.76, 0.19, 0.56],
      maskNeckline: true,
      fabric: 'Handwoven Chanderi Silk Tissue',
      fit: 'Fluid Layered Poncho Cape',
      occasion: 'Haldi, Mehendi & Festive Brunch',
      description:
        'Radiant marigold-saffron Chanderi silk cape crafted with three cascading ruffled tiers that float effortlessly over tailored trousers.',
    },
    p2: {
      name: 'Saffron Gold Raw Silk Wide-Leg Palazzo Pants',
      subtitle: 'High-waisted tailored saffron silk flared trousers',
      priceNumeric: 21490,
      mrpNumeric: 34990,
      category: 'Indian Couture',
      cropBox: [0.32, 0.74, 0.45, 0.93],
      maskNeckline: false,
      fabric: 'Pure Mulberry Raw Silk',
      fit: 'High-Rise Tailored Palazzo',
      occasion: 'Festive & Indo-Western',
      description:
        ' Crisp marigold raw-silk palazzo trousers with pintuck center seams and side pockets.',
    },
  },
  {
    lookNumber: 18,
    title: 'Liquid Silver Crystal-Mesh Column & Clutch',
    subtitle: 'Solo Runway Edition • Look 18',
    silhouette: 'Swarovski-Mesh Long-Sleeve Column Gown & Envelope Clutch',
    accentHex: '#64748b',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_18.jpg',
    modelBox: [0.20, 0.80, 0.04, 0.96],
    p1: {
      name: 'Liquid Silver Crystal-Mesh Column Evening Gown',
      subtitle: 'Full-sleeve metallic silver rhinestone-mesh couture gown',
      priceNumeric: 62990,
      mrpNumeric: 99990,
      category: 'Couture Gowns',
      cropBox: [0.31, 0.68, 0.24, 0.88],
      maskNeckline: true,
      fabric: 'Micro-Crystal Metallic Mesh over Silk Jersey',
      fit: 'Sculpted Column Maxi',
      occasion: 'Red Carpet, Cocktail & Reception',
      description:
        'Dazzling liquid-silver column gown encrusted with micro-faceted crystal mesh that shimmers like diamond chainmail under evening lights.',
    },
    p2: {
      name: 'Silver Crystal-Mesh Foldover Envelope Clutch',
      subtitle: 'Matching silver crystal-paved evening clutch bag',
      priceNumeric: 19490,
      mrpNumeric: 31990,
      category: 'Footwear & Bags',
      cropBox: [0.51, 0.70, 0.45, 0.58],
      maskNeckline: false,
      fabric: 'Crystal Mesh & Nappa Lining',
      fit: 'Detachable Silver Chain Strap Included',
      occasion: 'Gala & Cocktail',
      description:
        'Ergonomic envelope clutch paved in matching silver micro-crystals with magnetic closure.',
    },
  },
  {
    lookNumber: 19,
    title: 'Deep Burgundy Sculpted Leather Trench Dress',
    subtitle: 'Solo Runway Edition • Look 19',
    silhouette: 'Double-Breasted Oxblood Leather Trench Dress & Boots',
    accentHex: '#7f1d1d',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_19.jpg',
    modelBox: [0.20, 0.80, 0.04, 0.96],
    p1: {
      name: 'Deep Burgundy Lambskin Leather Trench Dress',
      subtitle: 'Double-breasted oxblood-burgundy belted leather midi dress',
      priceNumeric: 56990,
      mrpNumeric: 91990,
      category: 'Tailoring & Coats',
      cropBox: [0.28, 0.73, 0.16, 0.70],
      maskNeckline: true,
      fabric: 'Supple Oxblood Italian Lambskin',
      fit: 'Double-Breasted Cinched Midi',
      occasion: 'Autumn/Winter Runway & Evening Statement',
      description:
        'Sculptural deep-burgundy leather trench dress featuring notched lapels, tonal leather-wrapped buttons, and a silver-buckled waist belt.',
    },
    p2: {
      name: 'Burgundy Pointed-Toe Stiletto Ankle Boots',
      subtitle: 'Oxblood calfskin heeled ankle boots with side zip',
      priceNumeric: 25990,
      mrpNumeric: 41990,
      category: 'Footwear & Bags',
      cropBox: [0.38, 0.68, 0.78, 0.97],
      maskNeckline: false,
      fabric: 'Polished Oxblood Calfskin',
      fit: '95mm Stiletto Boot',
      occasion: 'Runway & Evening',
      description:
        'Sleek pointed-toe ankle boots in matching deep burgundy calfskin leather.',
    },
  },
  {
    lookNumber: 20,
    title: 'Royal Ruby & Antique Gold Bridal Lehenga',
    subtitle: 'Grand Finale Indian Couture • Look 20',
    silhouette: 'Hand-Embroidered Zardozi Peacock Lehenga & Organza Dupatta',
    accentHex: '#9f1239',
    sourceType: 'solo_model',
    soloImageUrl: 'assets/models/look_20.jpg',
    modelBox: [0.04, 0.96, 0.04, 0.96],
    p1: {
      name: 'Royal Ruby & Antique Gold Zardozi Bridal Lehenga',
      subtitle: 'Grand finale hand-embroidered velvet & silk bridal lehenga set',
      priceNumeric: 124990,
      mrpNumeric: 199990,
      category: 'Indian Couture',
      cropBox: [0.18, 0.82, 0.24, 0.93],
      maskNeckline: true,
      fabric: 'Pure Mulberry Velvet & Silk Organza Dupatta',
      fit: '24-Kali Royal Flared Bridal Lehenga',
      occasion: 'Grand Bridal Wedding & Royal Reception',
      description:
        'Our showstopping Look 20 Grand Finale bridal lehenga, hand-crafted over 1,400 artisan hours with antique gold dabka, nakshi, and peacock zardozi arches.',
    },
    p2: {
      name: 'Zardozi Jewel-Neck Choli & Gold Latkan Dupatta',
      subtitle: 'Sweetheart zardozi bridal blouse with scalloped tulle dupatta',
      priceNumeric: 48990,
      mrpNumeric: 78990,
      category: 'Indian Couture',
      cropBox: [0.28, 0.72, 0.23, 0.56],
      maskNeckline: true,
      fabric: 'Pure Silk Velvet & Gold Tissue Net',
      fit: 'Custom-Fit Structured Bridal Choli',
      occasion: 'Bridal Couture',
      description:
        'Intricately embroidered sweetheart-neck bridal choli paired with a sheer crimson silk-organza dupatta bordered in gold zari.',
    },
  },
];

export const LOOKS_DATA: LookEntry[] = [];
export const PIECES_DATA: PieceItem[] = [];

RAW_LOOKS.forEach((raw, idx) => {
  const p1Id = idx * 2;
  const p2Id = idx * 2 + 1;

  const p1Discount = Math.round(((raw.p1.mrpNumeric - raw.p1.priceNumeric) / raw.p1.mrpNumeric) * 100);
  const p2Discount = Math.round(((raw.p2.mrpNumeric - raw.p2.priceNumeric) / raw.p2.mrpNumeric) * 100);

  const pieceSourceType = raw.sourceType === 'higgs_models' ? 'higgs_pieces' : 'solo_garment';

  PIECES_DATA.push({
    id: p1Id,
    lookNumber: raw.lookNumber,
    pieceNumber: 1,
    sourceType: pieceSourceType,
    cropBox: raw.p1.cropBox,
    soloImageUrl: raw.soloImageUrl,
    maskNeckline: raw.p1.maskNeckline,
    name: raw.p1.name,
    subtitle: raw.p1.subtitle,
    price: `₹${raw.p1.priceNumeric.toLocaleString('en-IN')}`,
    priceNumeric: raw.p1.priceNumeric,
    mrp: `₹${raw.p1.mrpNumeric.toLocaleString('en-IN')}`,
    mrpNumeric: raw.p1.mrpNumeric,
    discountLabel: `${p1Discount}% off`,
    category: raw.p1.category,
    description: raw.p1.description,
    fabric: raw.p1.fabric,
    pattern: 'Atelier Hand-Finished Couture',
    occasion: raw.p1.occasion,
    care: 'Specialist Luxury Dry Clean Only',
    fit: raw.p1.fit,
    origin: 'Maison Vell Atelier — Paris & Mumbai',
    rating: Number((4.7 + (idx % 3) * 0.1).toFixed(1)),
    reviewsCount: 148 + idx * 29,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: COLOR_PALETTES[idx % COLOR_PALETTES.length],
    bankOffers: DEFAULT_BANK_OFFERS,
  });

  PIECES_DATA.push({
    id: p2Id,
    lookNumber: raw.lookNumber,
    pieceNumber: 2,
    sourceType: pieceSourceType,
    cropBox: raw.p2.cropBox,
    soloImageUrl: raw.soloImageUrl,
    maskNeckline: raw.p2.maskNeckline,
    name: raw.p2.name,
    subtitle: raw.p2.subtitle,
    price: `₹${raw.p2.priceNumeric.toLocaleString('en-IN')}`,
    priceNumeric: raw.p2.priceNumeric,
    mrp: `₹${raw.p2.mrpNumeric.toLocaleString('en-IN')}`,
    mrpNumeric: raw.p2.mrpNumeric,
    discountLabel: `${p2Discount}% off`,
    category: raw.p2.category,
    description: raw.p2.description,
    fabric: raw.p2.fabric,
    pattern: 'Atelier Hand-Finished Couture',
    occasion: raw.p2.occasion,
    care: 'Specialist Luxury Dry Clean Only',
    fit: raw.p2.fit,
    origin: 'Maison Vell Atelier — Paris & Mumbai',
    rating: Number((4.6 + ((idx + 1) % 4) * 0.1).toFixed(1)),
    reviewsCount: 112 + idx * 23,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: COLOR_PALETTES[(idx + 1) % COLOR_PALETTES.length],
    bankOffers: DEFAULT_BANK_OFFERS,
  });

  LOOKS_DATA.push({
    index: idx,
    lookNumber: raw.lookNumber,
    title: raw.title,
    subtitle: raw.subtitle,
    silhouette: raw.silhouette,
    accentHex: raw.accentHex,
    sourceType: raw.sourceType,
    modelBox: raw.modelBox,
    soloImageUrl: raw.soloImageUrl,
    pieceIds: [p1Id, p2Id],
  });
});
