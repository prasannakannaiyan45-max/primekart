import { Product, ProductReview, Coupon, CurrencyCode, LanguageCode, ProductCategory } from '../types';

export const HERO_IMAGE_PATH = '/src/assets/images/hero_architectural_living_1790742866099.jpg';

export const CATEGORY_DISPLAY_LABELS: Record<'All' | ProductCategory, { label: string; short: string; tagline: string }> = {
  All: {
    label: 'All Categories',
    short: 'All',
    tagline: 'Mobiles, Electronics, Home, Kitchen, Beauty & Watches',
  },
  'Audio & Acoustics': {
    label: 'Mobiles, Audio & Electronics',
    short: 'Mobiles & Audio',
    tagline: 'Flagship 5G Smartphones, ANC Headphones & Studio Audio',
  },
  'Architectural Living': {
    label: 'Home, Kitchen & Furniture',
    short: 'Home & Appliances',
    tagline: 'Smart Espresso Machines, Ergonomic Chairs & Designer Lighting',
  },
  'Botanical Formulation': {
    label: 'Beauty, Skincare & Personal Care',
    short: 'Beauty & Care',
    tagline: 'Clinical Derma Serums, Organic Care & Refillable Essentials',
  },
  'Precision Horology': {
    label: 'Watches, Wearables & Accessories',
    short: 'Watches & Tech',
    tagline: 'Titanium Chronographs, Smart Wearables & Precision Timepieces',
  },
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_flagship_phone_01',
    title: 'AetherPhone Pro Max 5G (512GB, Natural Titanium) — 120Hz LTPO OLED',
    brand: 'AetherTech Mobile',
    category: 'Audio & Acoustics',
    subcategory: 'Flagship 5G Smartphones',
    price: 1099,
    originalPrice: 1299,
    stock: 24,
    rating: 4.92,
    reviewCount: 342,
    imageUrl: '/src/assets/images/product_flagship_smartphone_1790748218163.jpg',
    description:
      'Aerospace Grade-5 Titanium enclosure with 3nm Neural Engine, 50MP Periscope 5x Optical Telephoto Pro camera array, satellite SOS connectivity, and all-day 5400mAh silicon-carbon battery with 85W HyperCharge.',
    specsSummary:
      '6.8" 120Hz ProMotion OLED · 512GB NVMe + 16GB RAM · 50MP Triple Pro Camera · Grade-5 Recycled Titanium · 5G Dual eSIM',
    sustainabilityScore: 95,
    carbonFootprintKg: 11.4,
    ecoMaterialTag: '100% Recycled Cobalt Battery & Grade-5 Titanium',
    sellerId: 'seller_aethertech',
    sellerName: 'AetherTech Official Store',
    isPublished: true,
  },
  {
    id: 'prod_anc_headphones_02',
    title: 'SonicQuiet Ultra Wireless ANC Headphones — 60Hr Battery & Spatial Audio',
    brand: 'Klangwerk Akustik',
    category: 'Audio & Acoustics',
    subcategory: 'Noise Cancelling Headphones',
    price: 329,
    originalPrice: 449,
    stock: 38,
    rating: 4.89,
    reviewCount: 518,
    imageUrl: '/src/assets/images/product_anc_headphones_1790748252419.jpg',
    description:
      '8-microphone Adaptive Active Noise Cancellation cancels up to -48dB of cabin and office noise. Features LDAC Hi-Res lossless Bluetooth 5.4, multipoint dual-device pairing, and plush protein-leather memory foam earcups.',
    specsSummary:
      '-48dB Adaptive ANC · 60-Hour Fast-Charge Battery · 40mm Beryllium Drivers · Bluetooth 5.4 Multipoint + USB-C Lossless',
    sustainabilityScore: 94,
    carbonFootprintKg: 4.2,
    ecoMaterialTag: 'Replaceable Magnetic Ear Cushions · Recycled Aluminum Yokes',
    sellerId: 'atelier_klangwerk',
    sellerName: 'Klangwerk Official Retail',
    isPublished: true,
  },
  {
    id: 'prod_espresso_barista_03',
    title: 'BaristaPro Dual-Boiler Smart Espresso & Cappuccino Maker (15-Bar PID)',
    brand: 'Vespera Home Appliances',
    category: 'Architectural Living',
    subcategory: 'Kitchen & Coffee Appliances',
    price: 589,
    originalPrice: 799,
    stock: 15,
    rating: 4.94,
    reviewCount: 276,
    imageUrl: '/src/assets/images/product_espresso_machine_1790748266346.jpg',
    description:
      'Commercial-grade 58mm stainless steel portafilter, integrated conical burr grinder with 30 grind settings, digital PID temperature stability, and commercial micro-foam steam wand for café-quality latte art at home.',
    specsSummary:
      '15-Bar Italian Pump · Integrated 30-Step Conical Burr Grinder · Digital PID Temp Control · Brushed 304 Stainless Steel',
    sustainabilityScore: 96,
    carbonFootprintKg: 12.8,
    ecoMaterialTag: 'Zero-Plastic Brew Path · Auto Eco-Sleep Mode',
    sellerId: 'atelier_vespera',
    sellerName: 'Vespera Home & Kitchen Hub',
    isPublished: true,
  },
  {
    id: 'prod_beolab_monolith_01',
    title: 'Klangwerk Reference M1 Dolby Atmos Wireless Smart Speaker (320W)',
    brand: 'Klangwerk Akustik',
    category: 'Audio & Acoustics',
    subcategory: 'Smart Home Theater Speakers',
    price: 1280,
    originalPrice: 1450,
    stock: 14,
    rating: 4.9,
    reviewCount: 148,
    imageUrl: '/src/assets/images/product_acoustic_monitor_1790742879041.jpg',
    description:
      'CNC-machined recycled aluminum paired with European walnut acoustic louvers. Engineered for automatic room acoustic calibration, Wi-Fi 7 & AirPlay 2 lossless spatial streaming, and deep 28Hz bass.',
    specsSummary:
      '320W Class-D Bi-Amp · 28Hz–34kHz Frequency Response · Recycled 6061 Aluminum & FSC Walnut · Room-Sense DSP Calibration',
    sustainabilityScore: 94,
    carbonFootprintKg: 14.2,
    ecoMaterialTag: '100% Post-Consumer Aluminum & FSC Walnut',
    sellerId: 'atelier_klangwerk',
    sellerName: 'Klangwerk Official Retail',
    isPublished: true,
  },
  {
    id: 'prod_nordic_lounge_02',
    title: 'Vespera Ergonomic Solid Oak & Full-Grain Leather Lounge Chair',
    brand: 'Studio Vespera Copenhagen',
    category: 'Architectural Living',
    subcategory: 'Living Room & Study Furniture',
    price: 1890,
    originalPrice: 2299,
    stock: 6,
    rating: 4.95,
    reviewCount: 92,
    imageUrl: '/src/assets/images/product_lounge_chair_1790742893621.jpg',
    description:
      'Hand-joined from quarter-sawn solid white oak and vegetable-tanned cognac saddle leather. Designed with orthopedic lumbar geometry that supports posture over hours of work or reading.',
    specsSummary:
      'Solid FSC Danish White Oak · Vegetable-Tanned Full-Grain Leather · H 74cm × W 78cm × D 81cm · 10-Year Structural Warranty',
    sustainabilityScore: 97,
    carbonFootprintKg: 21.5,
    ecoMaterialTag: 'FSC Certified Timber · Chrome-Free Leather',
    sellerId: 'atelier_vespera',
    sellerName: 'Vespera Home & Kitchen Hub',
    isPublished: true,
  },
  {
    id: 'prod_botanical_serum_03',
    title: 'Nocturne 2% Ectoin + Bakuchiol Cellular Repair Night Serum (50ml)',
    brand: 'Laboratoire Solenne',
    category: 'Botanical Formulation',
    subcategory: 'Clinical Derma Skincare',
    price: 165,
    originalPrice: 220,
    stock: 42,
    rating: 4.85,
    reviewCount: 412,
    imageUrl: '/src/assets/images/product_botanical_serum_1790742905920.jpg',
    description:
      'Cold-pressed alpine sea buckthorn, 1.5% bakuchiol (plant retinol alternative), and 2% bio-fermented ectoin in UV-protective biophotonic glass. Clinically proven 72-hour barrier hydration for all skin types.',
    specsSummary:
      '50ml Refillable Biophotonic Glass · 2% Pure Ectoin + 1.5% Bakuchiol · Dermatologist Tested · Fragrance & Paraben Free',
    sustainabilityScore: 98,
    carbonFootprintKg: 1.4,
    ecoMaterialTag: 'Refillable Biophotonic Glass · Carbon-Negative Cold Process',
    sellerId: 'atelier_solenne',
    sellerName: 'Solenne Official Beauty Store',
    isPublished: true,
  },
  {
    id: 'prod_chronograph_04',
    title: 'Aether Field Chronograph Grade-5 Titanium Automatic Watch (10 ATM)',
    brand: 'Horologium Glashütte',
    category: 'Precision Horology',
    subcategory: 'Luxury & Smart Watches',
    price: 2450,
    originalPrice: 2890,
    stock: 4,
    rating: 4.92,
    reviewCount: 87,
    imageUrl: '/src/assets/images/product_chronograph_watch_1790742917141.jpg',
    description:
      'Micro-blasted Grade-5 titanium case housing an in-house column-wheel automatic movement with 68-hour power reserve, anti-magnetic silicon escapement, and scratch-proof box sapphire crystal.',
    specsSummary:
      '39.5mm Grade-5 Titanium Case · Calibre HG-09 Automatic · 68h Power Reserve · 100m Water Resistance · Sapphire Crystal',
    sustainabilityScore: 91,
    carbonFootprintKg: 6.8,
    ecoMaterialTag: 'Recycled Aerospace Titanium · Battery-Free Mechanical',
    sellerId: 'atelier_horologium',
    sellerName: 'Horologium Official Watch Co',
    isPublished: true,
  },
  {
    id: 'prod_travertine_lamp_05',
    title: 'Solstice Smart Warm-Dim Brass & Travertine Table Lamp (CRI 98+)',
    brand: 'Studio Vespera Copenhagen',
    category: 'Architectural Living',
    subcategory: 'Smart Home Lighting',
    price: 740,
    originalPrice: 890,
    stock: 11,
    rating: 4.88,
    reviewCount: 139,
    imageUrl: '/src/assets/images/product_travertine_lamp_1790753411524.jpg',
    description:
      'Carved from natural Roman travertine stone and solid brushed brass. Features a stepless rotary dimmer with circadian LED array (1800K candlelight to 3000K warm daylight) and eye-care flicker-free driver.',
    specsSummary:
      'Roman Travertine Base & Solid Brass · Circadian 1800K–3000K Warm-Dim · CRI 98+ · 50,000h Modular LED Engine',
    sustainabilityScore: 93,
    carbonFootprintKg: 8.9,
    ecoMaterialTag: 'Modular Repairable LED · Quarry Offcut Travertine',
    sellerId: 'atelier_vespera',
    sellerName: 'Vespera Home & Kitchen Hub',
    isPublished: true,
  },
];

export const CATEGORY_DEFAULT_IMAGES: Record<ProductCategory, string> = {
  'Audio & Acoustics': '/src/assets/images/product_flagship_smartphone_1790748218163.jpg',
  'Architectural Living': '/src/assets/images/product_espresso_machine_1790748266346.jpg',
  'Botanical Formulation': '/src/assets/images/product_botanical_serum_1790742905920.jpg',
  'Precision Horology': '/src/assets/images/product_chronograph_watch_1790742917141.jpg',
};

export function resolveGenuineProductImage(
  productId: string,
  category: ProductCategory,
  rawUrl?: string
): string {
  const canonical = INITIAL_PRODUCTS.find((p) => p.id === productId);
  if (canonical) {
    return canonical.imageUrl;
  }
  if (rawUrl && rawUrl.startsWith('/src/assets/images/')) {
    return rawUrl;
  }
  return CATEGORY_DEFAULT_IMAGES[category] || '/src/assets/images/product_flagship_smartphone_1790748218163.jpg';
}

export const INITIAL_REVIEWS: Record<string, ProductReview[]> = {
  prod_flagship_phone_01: [
    {
      id: 'rev_phone_01',
      productId: 'prod_flagship_phone_01',
      authorId: 'verified_buyer_10',
      authorName: 'Rohan Mehta · Verified Purchase',
      rating: 5,
      title: 'Best flagship camera and battery life I have ever used!',
      comment:
        'Delivered next day via Prime Express. The 5x optical telephoto lens takes DSLR-level portraits, and the 5400mAh battery easily lasts 2 full days on 5G. Zero heating during gaming.',
      verifiedPurchase: true,
    },
    {
      id: 'rev_phone_02',
      productId: 'prod_flagship_phone_01',
      authorId: 'verified_buyer_11',
      authorName: 'Ananya Sharma · Verified Purchase',
      rating: 5,
      title: 'Super light titanium build + instant exchange discount',
      comment:
        'Got an awesome instant discount with coupon AETHERIA15 plus No-Cost EMI. The natural titanium frame feels ultra-premium and does not catch fingerprints.',
      verifiedPurchase: true,
    },
  ],
  prod_anc_headphones_02: [
    {
      id: 'rev_anc_01',
      productId: 'prod_anc_headphones_02',
      authorId: 'verified_buyer_12',
      authorName: 'Vikram Nair · Frequent Flyer',
      rating: 5,
      title: 'Completely silences airplane engine roar — 60hr battery is real',
      comment:
        'Used these on a 14-hour flight and only used 20% battery. Comfort on the ears is much softer than competitors and multipoint switches seamlessly between Mac and phone.',
      verifiedPurchase: true,
    },
  ],
  prod_espresso_barista_03: [
    {
      id: 'rev_esp_01',
      productId: 'prod_espresso_barista_03',
      authorId: 'verified_buyer_13',
      authorName: 'Priya & Kabir · Home Baristas',
      rating: 5,
      title: 'Paid for itself in 2 months of skipping coffee shops',
      comment:
        'The built-in 30-step burr grinder and PID temperature gauge give thick golden crema every single morning. Steam wand froths oat and dairy milk in 15 seconds.',
      verifiedPurchase: true,
    },
  ],
  prod_beolab_monolith_01: [
    {
      id: 'rev_m1_01',
      productId: 'prod_beolab_monolith_01',
      authorId: 'verified_buyer_1',
      authorName: 'Henrik Lindqvist · Mastering Engineer',
      rating: 5,
      title: 'Unmatched transient coherence in an untreated living room',
      comment:
        'The Room-Sense DSP immediately tamed a 62Hz standing wave in our living space. The walnut louvers eliminate high-frequency diffraction completely, and imaging is holographic.',
      verifiedPurchase: true,
    },
  ],
  prod_nordic_lounge_02: [
    {
      id: 'rev_lounge_01',
      productId: 'prod_nordic_lounge_02',
      authorId: 'verified_buyer_3',
      authorName: 'Soren Kierk · Industrial Designer',
      rating: 5,
      title: 'Heirloom mortise-and-tenon joinery & orthopedic comfort',
      comment:
        'The saddle leather already shows a warm amber patina after three months. Lumbar angle is spot-on for long reading and laptop sessions.',
      verifiedPurchase: true,
    },
  ],
  prod_botanical_serum_03: [
    {
      id: 'rev_serum_01',
      productId: 'prod_botanical_serum_03',
      authorId: 'verified_buyer_4',
      authorName: 'Dr. Elena Rostova · Dermatologist',
      rating: 5,
      title: 'Clinical-grade ectoin concentration without fragrance',
      comment:
        'Rare to see 2% bio-fermented ectoin paired with cold-pressed sea buckthorn in a genuinely UV-opaque biophotonic vessel. Calms barrier redness overnight.',
      verifiedPurchase: true,
    },
  ],
};

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'AETHERIA15',
    description: '15% Instant Mega-Sale Discount on orders above $250 (or ₹20,000)',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 250,
    isActive: true,
    ecoBonus: false,
    createdBy: 'system_admin',
  },
  {
    code: 'ECOCARBON10',
    description: 'Flat $40 (₹3,340) Green Cashback on Eco-Certified orders above $180',
    discountType: 'fixed',
    discountValue: 40,
    minOrderAmount: 180,
    isActive: true,
    ecoBonus: true,
    createdBy: 'system_admin',
  },
  {
    code: 'ATELIERVIP',
    description: '20% Prime VIP & Bank Card Instant Discount on orders above $800',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 800,
    isActive: true,
    ecoBonus: false,
    createdBy: 'system_admin',
  },
];

export const CURRENCY_RATES: Record<CurrencyCode, { symbol: string; rate: number }> = {
  USD: { symbol: '$', rate: 1 },
  INR: { symbol: '₹', rate: 83.5 },
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.79 },
};

export function formatCurrency(amountUsd: number, currency: CurrencyCode): string {
  const cfg = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;
  const converted = amountUsd * cfg.rate;
  if (currency === 'INR') {
    return `${cfg.symbol}${Math.round(converted).toLocaleString('en-IN')}`;
  }
  return `${cfg.symbol}${converted.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function getDiscountPercent(price: number, originalPrice: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export const TRANSLATIONS: Record<
  LanguageCode,
  {
    navDiscover: string;
    navVisualAi: string;
    navCompare: string;
    navOrders: string;
    navAtelier: string;
    heroKicker: string;
    heroTitle: string;
    heroSubtitle: string;
    heroCta: string;
  }
> = {
  EN: {
    navDiscover: 'All Categories & Deals',
    navVisualAi: 'AI Lens & Voice Search',
    navCompare: 'Compare',
    navOrders: 'Returns & Orders',
    navAtelier: 'Seller Hub',
    heroKicker: 'MEGA ELECTRONICS & HOME SAVING DAYS · PRIME ASSURED DELIVERY',
    heroTitle: 'Up to 35% Off Flagship 5G Tech, ANC Audio & Smart Home.',
    heroSubtitle:
      'Instant 15% Coupon Discount (Code: AETHERIA15), No-Cost EMI up to 12 months, UPI Cashback & Verified Next-Day Delivery.',
    heroCta: 'Shop Lightning Deals',
  },
  FR: {
    navDiscover: 'Toutes Catégories & Offres',
    navVisualAi: 'Recherche Visuelle IA',
    navCompare: 'Comparer',
    navOrders: 'Retours & Commandes',
    navAtelier: 'Espace Vendeur',
    heroKicker: 'JOURS MÉGA PROMOS · LIVRAISON EXPRESS GARANTIE',
    heroTitle: 'Jusqu’à -35% sur Smartphones 5G, Audio ANC & Maison.',
    heroSubtitle:
      'Remise immédiate de 15% (Code: AETHERIA15), paiement en plusieurs fois sans frais et livraison rapide.',
    heroCta: 'Voir les Offres Flash',
  },
  DE: {
    navDiscover: 'Alle Kategorien & Deals',
    navVisualAi: 'KI-Kamera & Sprachsuche',
    navCompare: 'Vergleichen',
    navOrders: 'Meine Bestellungen',
    navAtelier: 'Verkäufer-Zentrale',
    heroKicker: 'MEGA DEAL TAGE · KOSTENLOSE EXPRESS-LIEFERUNG',
    heroTitle: 'Bis zu 35% Rabatt auf 5G-Smartphones, ANC-Audio & Wohnen.',
    heroSubtitle:
      '15% Sofortrabatt mit Code AETHERIA15, 0% Finanzierung und geprüfte Nachhaltigkeit.',
    heroCta: 'Blitzangebote Entdecken',
  },
  JA: {
    navDiscover: '全カテゴリー・タイムセール',
    navVisualAi: 'AIカメラ・音声検索',
    navCompare: '商品比較',
    navOrders: '返品・注文履歴',
    navAtelier: '出品・セラー管理',
    heroKicker: 'メガタイムセール開催中 · お急ぎ便無料',
    heroTitle: '最新5Gスマホ・ANCヘッドホン・スマート家電が最大35%OFF',
    heroSubtitle:
      'クーポン「AETHERIA15」で15%即時割引・分割手数料無料・翌日配送対応。',
    heroCta: 'タイムセールを見る',
  },
};
