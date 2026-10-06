import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Heart,
  Scale,
  Sparkles,
  Check,
  MapPin,
  ShieldCheck,
  Send,
  Truck,
  RotateCcw,
  RefreshCw,
  ShoppingBag,
  Bell,
  ArrowRight,
  QrCode,
  Smartphone,
  Copy,
  Download,
  Share2,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import {
  Product,
  ProductReview,
  CurrencyCode,
  Coupon,
  BLUEPRINT_CONSTRAINTS,
  clampString,
  sanitizeId,
} from '../types';
import { INITIAL_REVIEWS, formatCurrency, getDiscountPercent } from '../data/catalog';
import { ResilientImage } from './ResilientImage';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variant: string) => void;
  onBuyNow: (product: Product, quantity: number, variant: string) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  onToggleCompare: (product: Product) => void;
  isCompared: boolean;
  currency: CurrencyCode;
  userDisplayName: string;
  onSubscribePriceAlert: (product: Product) => void;
  hasPriceAlert: boolean;
  coupons: Coupon[];
  activeCouponCode: string;
  onApplyCoupon: (code: string) => void;
  deliveryPincode: string;
  onUpdatePincode: (pin: string) => void;
}

interface ReviewSummaryData {
  summary: string;
  pros: string[];
  cons: string[];
  verdict: string;
}

const VARIANT_OPTIONS: Record<string, string[]> = {
  'Audio & Acoustics': ['Natural Titanium', 'Matte Obsidian', 'Studio Pro Edition'],
  'Architectural Living': ['Brushed Stainless / Oak', 'Warm Walnut', 'Anthracite Finish'],
  'Botanical Formulation': ['50ml Standard', '50ml + Refill Duo', '100ml Salon Size'],
  'Precision Horology': ['Titanium Bracelet', 'Ocean Textile Strap', 'Collector Edition'],
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isWishlisted,
  onToggleCompare,
  isCompared,
  currency,
  userDisplayName,
  onSubscribePriceAlert,
  hasPriceAlert,
  coupons,
  activeCouponCode,
  onApplyCoupon,
  deliveryPincode,
  onUpdatePincode,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [pincodeInput, setPincodeInput] = useState(deliveryPincode || '560001');
  const [deliveryEstimate, setDeliveryEstimate] = useState<string>(
    'Free Express Delivery by Tomorrow · Cash on Delivery available'
  );
  const [withExchange, setWithExchange] = useState(false);
  const [firestoreReviews, setFirestoreReviews] = useState<ProductReview[]>([]);
  const [aiSummary, setAiSummary] = useState<ReviewSummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  // Mobile QR Code Generator State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [qrCopied, setQrCopied] = useState(false);
  const [generatingQr, setGeneratingQr] = useState(false);

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setWithExchange(false);
    const variants = VARIANT_OPTIONS[product.category] || ['Standard Edition'];
    setSelectedVariant(variants[0]);
    setAiSummary(null);
    setReviewFeedback(null);
    setShowQrModal(false);
    setQrSvg('');
    setQrCopied(false);

    const reviewsQuery = query(
      collection(db, 'products', product.id, 'reviews'),
      where('productId', '==', product.id)
    );
    const unsub = onSnapshot(
      reviewsQuery,
      (snap) => {
        const list: ProductReview[] = [];
        snap.forEach((d) => list.push(d.data() as ProductReview));
        setFirestoreReviews(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `products/${product.id}/reviews`);
      }
    );

    return () => unsub();
  }, [product]);

  if (!product) return null;

  const variants = VARIANT_OPTIONS[product.category] || ['Standard Edition'];
  const initialReviews = INITIAL_REVIEWS[product.id] || [];
  const allReviews = [
    ...firestoreReviews,
    ...initialReviews.filter((ir) => !firestoreReviews.some((fr) => fr.id === ir.id)),
  ];

  const discountPct = getDiscountPercent(product.price, product.originalPrice);
  const exchangeCreditUsd = Math.round(product.price * 0.15);
  const effectivePriceUsd = withExchange
    ? Math.max(50, product.price - exchangeCreditUsd)
    : product.price;
  const monthlyEmiUsd = Math.round(effectivePriceUsd / 12);

  const handleCheckDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = pincodeInput.trim();
    if (!cleaned) return;
    onUpdatePincode(cleaned);
    setDeliveryEstimate(
      `Free Next-Day Delivery to ${cleaned} · 10-Day Replacement & COD eligible`
    );
  };

  const handleGenerateReviewSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/ai/review-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle: product.title,
          reviews: allReviews.map((r) => ({
            rating: r.rating,
            title: r.title,
            comment: r.comment,
          })),
        }),
      });
      const data = await res.json();
      setAiSummary(data);
    } catch {
      setAiSummary({
        summary:
          'Customers consistently praise the build quality, reliable performance, and fast next-day delivery.',
        pros: ['Premium build & materials', 'Fast delivery & secure packaging', 'Strong value with EMI & coupon'],
        cons: ['Limited stock on popular finishes'],
        verdict: '96% of verified buyers recommend this product.',
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setReviewFeedback('Please sign in from the top navigation bar to post a verified review.');
      return;
    }
    if (reviewTitle.trim().length < 2 || reviewComment.trim().length < 5) {
      setReviewFeedback('Please enter a short headline and review comment.');
      return;
    }

    setSubmittingReview(true);
    setReviewFeedback(null);
    const reviewId = sanitizeId(`rev_${auth.currentUser.uid.slice(0, 8)}_${Date.now()}`);

    const newReview: ProductReview = {
      id: reviewId,
      productId: product.id,
      authorId: auth.currentUser.uid,
      authorName: clampString(
        userDisplayName,
        1,
        BLUEPRINT_CONSTRAINTS.DISPLAY_NAME_MAX,
        'Verified Buyer'
      ),
      rating: Math.min(5, Math.max(1, Math.round(reviewRating))),
      title: clampString(
        reviewTitle,
        2,
        BLUEPRINT_CONSTRAINTS.REVIEW_TITLE_MAX,
        'Excellent quality'
      ),
      comment: clampString(
        reviewComment,
        5,
        BLUEPRINT_CONSTRAINTS.REVIEW_COMMENT_MAX,
        'Highly recommended.'
      ),
      verifiedPurchase: true,
    };

    try {
      await setDoc(doc(db, 'products', product.id, 'reviews', reviewId), {
        ...newReview,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setReviewTitle('');
      setReviewComment('');
      setReviewFeedback('Thank you — your verified review has been published.');
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `products/${product.id}/reviews/${reviewId}`
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?product=${product.id}`
      : `https://primekart.aetheria.store/?product=${product.id}`;

  const handleGenerateQr = async () => {
    if (!product) return;
    setGeneratingQr(true);
    try {
      const svg = await QRCode.toString(productUrl, {
        type: 'svg',
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        width: 256,
      });
      setQrSvg(svg);
      setShowQrModal(true);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    if (!product) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on PrimeKart`,
          url: productUrl,
        });
      } catch {
        // ignore
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    if (!qrSvg || !product) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `primekart-${product.id}-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showQrModal) {
        setShowQrModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQrModal]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 sm:p-8">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full my-auto overflow-hidden shadow-2xl">
        {/* Clean Minimal Header Bar */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>{product.subcategory}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-900 font-medium">{product.brand}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateQr}
              disabled={generatingQr}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Generate QR code to view on your phone"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">Open on Phone</span>
              <span className="sm:hidden">QR</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-COLUMN CONTIGUOUS PURCHASE MODULE */}
        <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column (6 cols): Product Visual Showcase & Secondary Actions */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-6">
            <div className="aspect-[4/4] w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
              <ResilientImage
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Clean Secondary Utility Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => onToggleWishlist(product)}
                className={`py-2.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                  isWishlisted
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 hover:border-slate-400 text-slate-700'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
              </button>
              <button
                onClick={() => onToggleCompare(product)}
                className={`py-2.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                  isCompared
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 hover:border-slate-400 text-slate-700'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{isCompared ? 'Comparing' : 'Compare'}</span>
              </button>
              <button
                onClick={() => onSubscribePriceAlert(product)}
                className={`py-2.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                  hasPriceAlert
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 hover:border-slate-400 text-slate-700'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{hasPriceAlert ? 'Alert Active' : 'Price Alert'}</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateQr}
                disabled={generatingQr}
                className="py-2.5 px-3 rounded-lg border border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer group"
                title="Generate QR code to open on your phone"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900" />
                <span>{generatingQr ? 'Generating...' : 'QR Code'}</span>
              </button>
            </div>

            {/* Specifications & Sustainability Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="font-semibold text-slate-900">Technical Specifications</div>
              <p className="text-slate-600 font-mono leading-relaxed">{product.specsSummary}</p>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-slate-500">
                <span>{product.ecoMaterialTag}</span>
                <span className="font-mono text-emerald-700 font-medium">
                  Eco Score {product.sustainabilityScore}/100
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (6 cols): Contiguous Purchase Module */}
          <div className="lg:col-span-6 space-y-6">
            {/* Title, Brand & Rating */}
            <div className="space-y-2 border-b border-slate-100 pb-5">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                {product.brand} · Sold by {product.sellerName}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 leading-snug">
                {product.title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                <span className="font-semibold text-slate-900">
                  ★ {product.rating.toFixed(2)}
                </span>
                <span>·</span>
                <span>{allReviews.length + product.reviewCount} verified ratings</span>
                <span>·</span>
                <span className="text-emerald-700 font-medium">
                  {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Price, Savings & EMI */}
            <div className="space-y-2 border-b border-slate-100 pb-5">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
                  {formatCurrency(effectivePriceUsd, currency)}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-slate-400 line-through font-mono">
                      {formatCurrency(product.originalPrice, currency)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">
                      Save {discountPct}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Inclusive of all taxes · No-Cost EMI from{' '}
                <span className="font-mono font-medium text-slate-800">
                  {formatCurrency(monthlyEmiUsd, currency)}/mo
                </span>
              </p>

              {/* Optional Trade-In Exchange Toggle */}
              <label className="inline-flex items-center gap-2 pt-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withExchange}
                  onChange={(e) => setWithExchange(e.target.checked)}
                  className="accent-slate-900 rounded"
                />
                <span>
                  Apply Trade-In Exchange Credit (−{formatCurrency(exchangeCreditUsd, currency)})
                </span>
              </label>
            </div>

            {/* Variant & Quantity Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Edition / Finish
                </label>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                        selectedVariant === v
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-4 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Quantity
                </label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-mono text-xs focus:outline-none focus:border-slate-900"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Unit' : 'Units'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Primary Purchase CTAs: Add to Cart + Buy Now */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  onAddToCart(product, quantity, selectedVariant);
                  onClose();
                }}
                className="py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={() => onBuyNow(product, quantity, selectedVariant)}
                className="py-3.5 px-5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>Buy Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Cross-Device Handoff Callout */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
                  <Smartphone className="w-4 h-4 text-slate-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>Shop on your Phone</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      Mobile QR
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Scan QR code with your camera to open this product on mobile
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateQr}
                disabled={generatingQr}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Generate QR Code</span>
              </button>
            </div>

            {/* Available Coupons (Clean 1-Click Apply List) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="text-xs font-semibold text-slate-900">
                Available Promotional Offers
              </div>
              <div className="space-y-2">
                {coupons.map((c) => {
                  const isApplied = activeCouponCode === c.code;
                  return (
                    <div
                      key={c.code}
                      className="flex items-center justify-between gap-3 text-xs bg-white p-2.5 rounded-lg border border-slate-200/80"
                    >
                      <div className="truncate">
                        <span className="font-mono font-bold text-slate-900">{c.code}</span>
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className="text-slate-600">{c.description}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onApplyCoupon(c.code)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold shrink-0 transition-colors ${
                          isApplied
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                        }`}
                      >
                        {isApplied ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pincode Delivery Checker */}
            <form onSubmit={handleCheckDelivery} className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  placeholder="Enter Pincode / ZIP"
                  className="w-40 px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-slate-900"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Check Delivery
                </button>
              </div>
              <p className="text-xs text-slate-600 pl-6">{deliveryEstimate}</p>
            </form>

            {/* Product Description */}
            <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
              {product.description}
            </p>
          </div>
        </div>

        {/* BOTTOM SECTION: AI Review Highlights & Customer Reviews */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-6 sm:px-8 lg:px-10 py-8 space-y-8">
          <div className="p-5 bg-white border border-slate-200/80 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>AI Customer Review Synthesis</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Summary of verified customer sentiment, pros, and considerations.
                </p>
              </div>
              <button
                onClick={handleGenerateReviewSummary}
                disabled={loadingSummary}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center gap-2 self-start sm:self-auto"
              >
                {loadingSummary ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <span>Summarize Reviews</span>
                )}
              </button>
            </div>

            {aiSummary && (
              <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                <p className="text-slate-700 leading-relaxed">{aiSummary.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <div className="font-semibold text-slate-900 mb-1.5">Pros</div>
                    <ul className="space-y-1 text-slate-600">
                      {aiSummary.pros.map((pro, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <div className="font-semibold text-slate-900 mb-1.5">Considerations</div>
                    <ul className="space-y-1 text-slate-600">
                      {aiSummary.cons.map((con, i) => (
                        <li key={i}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Verified Customer Reviews ({allReviews.length})
              </h3>
              {allReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-900">{rev.authorName}</span>
                    <span className="text-slate-500">Verified Purchase</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-amber-500 font-semibold">{'★'.repeat(rev.rating)}</span>
                    <span className="font-semibold text-slate-900">{rev.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>

            <div className="lg:col-span-5">
              <form
                onSubmit={handleSubmitReview}
                className="p-5 bg-white border border-slate-200/80 rounded-xl space-y-3"
              >
                <h4 className="text-sm font-semibold text-slate-900">Write a Customer Review</h4>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`px-2.5 py-1 rounded border text-xs font-medium ${
                          reviewRating >= star
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        {star} ★
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Review headline"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
                {reviewFeedback && (
                  <p className="text-xs text-slate-700">{reviewFeedback}</p>
                )}
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReview ? 'Publishing...' : 'Publish Review'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE QR CODE MODAL OVERLAY */}
      {showQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Scan to Open on Phone</h3>
                  <p className="text-[11px] text-slate-500">Cross-device mobile handoff</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close QR Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Summary Mini Card */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0">
                <ResilientImage
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-slate-500 truncate">{product.brand}</div>
                <div className="text-xs font-semibold text-slate-900 truncate">{product.title}</div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                  {formatCurrency(effectivePriceUsd, currency)}
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              {qrSvg ? (
                <div
                  className="w-52 h-52 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              )}
              <div className="mt-2.5 text-center">
                <p className="text-xs font-semibold text-slate-900">
                  Scan with your mobile camera
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Opens this product instantly on your smartphone
                </p>
              </div>
            </div>

            {/* URL Link and Actions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-600">
                <span className="truncate flex-1 text-[11px]">{productUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-900 font-sans font-semibold text-[11px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  {qrCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-600" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleShare}
                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save SVG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
