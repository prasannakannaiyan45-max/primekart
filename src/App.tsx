import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Mic,
  MicOff,
  Sparkles,
  ShoppingBag,
  Heart,
  Scale,
  User as UserIcon,
  LogOut,
  Globe,
  Camera,
  SlidersHorizontal,
  MapPin,
  ShieldCheck,
  Leaf,
  Award,
  Check,
  RefreshCw,
  Tag,
  ArrowRight,
  Plus,
  FileText,
  Download,
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import {
  db,
  auth,
  signInWithGoogle,
  signOutUser,
  OperationType,
  handleFirestoreError,
} from './firebase';
import {
  Product,
  ProductCategory,
  CartItem,
  Order,
  Coupon,
  CurrencyCode,
  LanguageCode,
  UserProfile,
  UserRole,
  BLUEPRINT_CONSTRAINTS,
  clampString,
} from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  CATEGORY_DISPLAY_LABELS,
  formatCurrency,
  getDiscountPercent,
  TRANSLATIONS,
  resolveGenuineProductImage,
} from './data/catalog';
import { ResilientImage } from './components/ResilientImage';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { AdminSellerDashboard } from './components/AdminSellerDashboard';
import { AiConciergeDrawer } from './components/AiConciergeDrawer';
import {
  OrdersTrackingView,
  ProductComparisonMatrix,
} from './components/OrdersAndComparisonView';
import { SecurityCenterView } from './components/SecurityCenterView';

type ActiveTab = 'catalog' | 'visual_ai' | 'compare' | 'orders' | 'admin' | 'security';

const CATEGORIES: ('All' | ProductCategory)[] = [
  'All',
  'Audio & Acoustics',
  'Architectural Living',
  'Botanical Formulation',
  'Precision Horology',
];

const PRESET_LOCATIONS = [
  { city: 'Bengaluru', pincode: '560001' },
  { city: 'Mumbai', pincode: '400001' },
  { city: 'New Delhi', pincode: '110001' },
  { city: 'Hyderabad', pincode: '500081' },
  { city: 'New York', pincode: '10001' },
];

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [activeSimMode, setActiveSimMode] = useState<string>('NORMAL');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [language, setLanguage] = useState<LanguageCode>('EN');
  const [localeMenuOpen, setLocaleMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [deliveryCity, setDeliveryCity] = useState('Bengaluru');
  const [deliveryPincode, setDeliveryPincode] = useState('560001');
  const [customPinInput, setCustomPinInput] = useState('');

  // Auth & User Profile State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [localRole, setLocalRole] = useState<UserRole>('customer');
  const [authReady, setAuthReady] = useState(false);
  const effectiveRole: UserRole = userProfile?.role || localRole;

  // Firestore & Catalog State
  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [firestoreCoupons, setFirestoreCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Shopping Cart, Wishlist, Compare & Bundle State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('aetheria_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('aetheria_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [priceAlertIds, setPriceAlertIds] = useState<string[]>([]);
  const [activeCouponCode, setActiveCouponCode] = useState<string>('AETHERIA15');
  const [bundleSelectedIds, setBundleSelectedIds] = useState<string[]>([
    'prod_flagship_phone_01',
    'prod_anc_headphones_02',
  ]);

  // Drawers & Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Clean Filter, Search & Sort State
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'featured' | 'price_asc' | 'price_desc' | 'rating' | 'discount'
  >('featured');
  const [dealsOnly, setDealsOnly] = useState(false);
  const [ecoFilterOnly, setEcoFilterOnly] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  // AI Semantic & Visual Search State
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [aiSuggestedFilter, setAiSuggestedFilter] = useState<string | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const t = TRANSLATIONS[language];

  // Combine Firestore products with INITIAL_PRODUCTS and ensure genuine studio imagery
  const products = useMemo(() => {
    if (firestoreProducts.length === 0) return INITIAL_PRODUCTS;
    const canonicalMap = new Map<string, Product>();
    INITIAL_PRODUCTS.forEach((p) => canonicalMap.set(p.id, p));

    const map = new Map<string, Product>();
    INITIAL_PRODUCTS.forEach((p) => map.set(p.id, p));
    firestoreProducts.forEach((p) => {
      const canonical = canonicalMap.get(p.id);
      map.set(p.id, {
        ...(canonical || p),
        ...p,
        title: canonical ? canonical.title : p.title,
        brand: canonical ? canonical.brand : p.brand,
        subcategory: canonical ? canonical.subcategory : p.subcategory,
        description: canonical ? canonical.description : p.description,
        specsSummary: canonical ? canonical.specsSummary : p.specsSummary,
        imageUrl: resolveGenuineProductImage(p.id, p.category, p.imageUrl),
      });
    });
    return Array.from(map.values()).filter((p) => p.isPublished);
  }, [firestoreProducts]);

  const coupons = useMemo(() => {
    if (firestoreCoupons.length === 0) return INITIAL_COUPONS;
    const map = new Map<string, Coupon>();
    INITIAL_COUPONS.forEach((c) => map.set(c.code, c));
    firestoreCoupons.forEach((c) => map.set(c.code, c));
    return Array.from(map.values());
  }, [firestoreCoupons]);

  // Persist cart & wishlist
  useEffect(() => {
    try {
      localStorage.setItem('aetheria_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('aetheria_wishlist', JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  // Deep-linking: Automatically open product modal if ?product=<productId> is in the URL
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('product');
        if (productId && products.length > 0) {
          const found = products.find((p) => p.id === productId);
          if (found) {
            setSelectedProduct(found);
          }
        }
      } catch {
        // ignore
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [products]);

  // Keep browser URL synchronized with selectedProduct
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (selectedProduct) {
        if (url.searchParams.get('product') !== selectedProduct.id) {
          url.searchParams.set('product', selectedProduct.id);
          window.history.replaceState({}, '', url.toString());
        }
      } else {
        if (url.searchParams.has('product')) {
          url.searchParams.delete('product');
          window.history.replaceState({}, '', url.toString());
        }
      }
    } catch {
      // ignore
    }
  }, [selectedProduct]);

  const showToast = (msg: string) => {
    setNotificationBanner(msg);
    setTimeout(() => {
      setNotificationBanner((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  // 2. User Profile Listener
  useEffect(() => {
    if (!authReady || !currentUser) {
      setUserProfile(null);
      return;
    }
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubProfile = onSnapshot(
      userRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setUserProfile(data);
          setLocalRole(data.role);
        } else {
          const isDefaultAdmin =
            currentUser.email === 'prasannakannaiyan45@gmail.com' ||
            currentUser.email === 'lumaboo494@gmail.com';
          const initialRole: UserRole = isDefaultAdmin ? 'admin' : 'customer';
          setLocalRole(initialRole);
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: clampString(
              currentUser.displayName || currentUser.email?.split('@')[0] || 'Prime Member',
              1,
              BLUEPRINT_CONSTRAINTS.DISPLAY_NAME_MAX,
              'Prime Member'
            ),
            role: initialRole,
            loyaltyPoints: 450,
            loyaltyTier: 'Gold',
            preferredCurrency: 'INR',
            ecoPreference: true,
          };
          try {
            await setDoc(userRef, {
              ...newProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}`);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
      }
    );
    return () => unsubProfile();
  }, [authReady, currentUser]);

  // 3. Public Catalog & Coupons Listeners (with rule-enforced where clauses)
  useEffect(() => {
    const productsQuery = query(
      collection(db, 'products'),
      where('isPublished', '==', true)
    );
    const unsubProducts = onSnapshot(
      productsQuery,
      (snap) => {
        const list: Product[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as Product);
        });
        setFirestoreProducts(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
      }
    );

    const couponsQuery = query(
      collection(db, 'coupons'),
      where('isActive', '==', true)
    );
    const unsubCoupons = onSnapshot(
      couponsQuery,
      (snap) => {
        const list: Coupon[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as Coupon);
        });
        setFirestoreCoupons(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'coupons');
      }
    );

    return () => {
      unsubProducts();
      unsubCoupons();
    };
  }, []);

  // 4. Role-Aware Orders Listener (with rule-compliant query constraints)
  useEffect(() => {
    if (!authReady || !currentUser || !userProfile) {
      setOrders([]);
      return;
    }

    const isServerBootstrappedAdmin =
      currentUser.email === 'prasannakannaiyan45@gmail.com' ||
      currentUser.email === 'lumaboo494@gmail.com';

    const ordersRef = collection(db, 'orders');
    const ordersQuery =
      userProfile.role === 'admin' && isServerBootstrappedAdmin
        ? ordersRef
        : userProfile.role === 'seller'
        ? query(ordersRef, where('sellerId', '==', currentUser.uid))
        : query(ordersRef, where('customerId', '==', currentUser.uid));

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        const list: Order[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as Order);
        });
        setOrders(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      }
    );

    return () => unsubOrders();
  }, [authReady, currentUser, userProfile]);

  // Cart, Buy Now & Wishlist Handlers
  const handleAddToCart = (product: Product, quantity = 1, variant = 'Standard Edition') => {
    fetch('/api/security/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'ADD_TO_CART' }),
    }).catch(() => {});

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(20, updated[existingIndex].quantity + quantity),
          selectedVariant: variant,
        };
        return updated;
      }
      return [...prev, { product, quantity, selectedVariant: variant }];
    });
    showToast(`Added "${product.title}" to Cart.`);
  };

  const handleBuyNow = (product: Product, quantity = 1, variant = 'Standard Edition') => {
    handleAddToCart(product, quantity, variant);
    setSelectedProduct(null);
    setCartDrawerOpen(true);
  };

  const handleAddBundleToCart = () => {
    const bundleItems = products.filter((p) => bundleSelectedIds.includes(p.id));
    if (bundleItems.length === 0) return;
    bundleItems.forEach((item) => {
      handleAddToCart(item, 1, 'Bundle Edition');
    });
    setActiveCouponCode('AETHERIA15');
    setCartDrawerOpen(true);
    showToast(`Added ${bundleItems.length} bundle items with 15% off coupon AETHERIA15.`);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleMoveToWishlist = (item: CartItem) => {
    handleRemoveFromCart(item.product.id);
    if (!wishlist.some((w) => w.id === item.product.id)) {
      setWishlist((prev) => [...prev, item.product]);
    }
    showToast(`Saved "${item.product.title}" for later.`);
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast(`Removed "${product.title}" from Wishlist.`);
        return prev.filter((p) => p.id !== product.id);
      }
      showToast(`Saved "${product.title}" to Wishlist.`);
      return [...prev, product];
    });
  };

  const handleToggleCompare = (product: Product) => {
    setComparedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        showToast('Comparison supports up to 4 products at a time.');
        return prev;
      }
      showToast(`Added "${product.title}" to Compare (${prev.length + 1}/4).`);
      return [...prev, product];
    });
  };

  const handleSubscribePriceAlert = (product: Product) => {
    setPriceAlertIds((prev) => {
      if (prev.includes(product.id)) return prev;
      showToast(`Price-drop alert enabled for "${product.title}".`);
      return [...prev, product.id];
    });
  };

  const handleRoleChange = async (newRole: UserRole) => {
    setLocalRole(newRole);
    if (userProfile) {
      setUserProfile({ ...userProfile, role: newRole });
    }

    // Ensure role-based tab visibility is strictly enforced
    if (newRole === 'customer' && (activeTab === 'security' || activeTab === 'admin')) {
      setActiveTab('catalog');
    } else if (newRole === 'seller' && activeTab === 'security') {
      setActiveTab('admin');
    } else if (newRole === 'seller') {
      setActiveTab('admin');
    }

    setAccountMenuOpen(false);
    showToast(
      newRole === 'admin'
        ? 'Switched to ADMIN role — AI Security Center & Admin Hub unlocked.'
        : `Switched active role to ${newRole.toUpperCase()}.`
    );

    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  // Voice Search
  const handleToggleVoiceSearch = () => {
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      showToast('Voice search is not supported in this browser.');
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognitionAPI as any)();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningVoice(true);
      showToast('Listening... Speak a product name or feature.');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setSearchQuery(transcript);
        setIsListeningVoice(false);
        if (transcript.trim()) {
          handleRunSemanticSearch(transcript.trim());
        }
      };

      recognition.onerror = () => setIsListeningVoice(false);
      recognition.onend = () => setIsListeningVoice(false);
      recognition.start();
    } catch {
      setIsListeningVoice(false);
    }
  };

  // AI Semantic Search
  const handleRunSemanticSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? searchQuery).trim();
    if (!q) {
      setAiMatchedIds(null);
      setAiReasoning(null);
      setAiSuggestedFilter(null);
      return;
    }

    setAiSearchLoading(true);
    try {
      const res = await fetch('/api/ai/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          catalog: products.map((p) => ({
            id: p.id,
            title: p.title,
            brand: p.brand,
            category: p.category,
            subcategory: p.subcategory,
            price: p.price,
            specsSummary: p.specsSummary,
            ecoMaterialTag: p.ecoMaterialTag,
            sustainabilityScore: p.sustainabilityScore,
          })),
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.matchedProductIds)) {
        setAiMatchedIds(data.matchedProductIds);
        setAiReasoning(data.reasoning || null);
        setAiSuggestedFilter(data.suggestedFilter || null);
      }
    } catch {
      showToast('Showing keyword matches.');
    } finally {
      setAiSearchLoading(false);
    }
  };

  // AI Photo Search
  const handleVisualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setUploadedPreviewUrl(dataUrl);
      const base64Data = dataUrl.split(',')[1];
      if (!base64Data) return;

      setAiSearchLoading(true);
      setActiveTab('visual_ai');
      try {
        const res = await fetch('/api/ai/image-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg',
            catalog: products.map((p) => ({
              id: p.id,
              title: p.title,
              brand: p.brand,
              category: p.category,
              subcategory: p.subcategory,
              specsSummary: p.specsSummary,
              ecoMaterialTag: p.ecoMaterialTag,
            })),
          }),
        });
        const data = await res.json();
        setAiMatchedIds(data.matchedProductIds || []);
        setAiReasoning(data.visualAnalysis || null);
        setAiSuggestedFilter(data.detectedStyle || 'Visual Match');
      } catch {
        showToast('Visual inspection completed.');
      } finally {
        setAiSearchLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered & Sorted Products
  const displayedProducts = useMemo(() => {
    let list = [...products];

    if (aiMatchedIds && aiMatchedIds.length > 0) {
      const idSet = new Set(aiMatchedIds);
      const matched = list.filter((p) => idSet.has(p.id));
      if (matched.length > 0) {
        list = matched;
      }
    } else if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          p.specsSummary.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (dealsOnly) {
      list = list.filter((p) => getDiscountPercent(p.price, p.originalPrice) >= 15);
    }

    if (ecoFilterOnly) {
      list = list.filter((p) => p.sustainabilityScore >= 95);
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      list.sort(
        (a, b) =>
          getDiscountPercent(b.price, b.originalPrice) -
          getDiscountPercent(a.price, a.originalPrice)
      );
    }

    return list;
  }, [products, aiMatchedIds, searchQuery, selectedCategory, dealsOnly, ecoFilterOnly, sortBy]);

  const totalCartUnits = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Curated Frequently Bought Together Bundle
  const bundleCandidates = products.slice(0, 3);
  const bundleTotalUsd = bundleCandidates
    .filter((p) => bundleSelectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.price, 0);
  const bundleOriginalUsd = bundleCandidates
    .filter((p) => bundleSelectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.originalPrice, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Hidden File Input for Camera Lens */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleVisualImageUpload}
        className="hidden"
      />

      {/* Clean Toast Notification */}
      {notificationBanner && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{notificationBanner}</span>
          </div>
          <button
            onClick={() => setNotificationBanner(null)}
            className="text-slate-400 hover:text-white font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Delivery Location Modal */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-700" />
                <span>Select Delivery Location</span>
              </h3>
              <button
                onClick={() => setLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-mono"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Choose your city or enter a 6-digit Pincode to verify Express delivery & Cash on Delivery options.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_LOCATIONS.map((loc) => (
                <button
                  key={loc.pincode}
                  onClick={() => {
                    setDeliveryCity(loc.city);
                    setDeliveryPincode(loc.pincode);
                    setLocationModalOpen(false);
                    showToast(`Delivery location set to ${loc.city} (${loc.pincode}).`);
                  }}
                  className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                    deliveryPincode === loc.pincode
                      ? 'border-slate-900 bg-slate-900 text-white font-medium'
                      : 'border-slate-200 hover:border-slate-400 text-slate-700'
                  }`}
                >
                  <div>{loc.city}</div>
                  <div className="font-mono text-[11px] opacity-75">{loc.pincode}</div>
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customPinInput.trim()) return;
                setDeliveryCity('Express Zone');
                setDeliveryPincode(customPinInput.trim());
                setLocationModalOpen(false);
                showToast(`Pincode updated to ${customPinInput.trim()}.`);
              }}
              className="flex gap-2 pt-2 border-t border-slate-100"
            >
              <input
                type="text"
                value={customPinInput}
                onChange={(e) => setCustomPinInput(e.target.value)}
                placeholder="Enter 6-digit Pincode"
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white font-medium text-xs rounded-lg hover:bg-slate-800"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE-ROW THREE-ZONE HEADER (Clean, Calm, Professional) */}
      <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto h-full px-6 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Identity & Location */}
          <div className="flex items-center gap-5 shrink-0">
            <button
              onClick={() => {
                setActiveTab('catalog');
                setSelectedCategory('All');
                setAiMatchedIds(null);
              }}
              className="text-left flex items-baseline gap-2"
            >
              <span className="text-lg font-bold tracking-tight text-slate-900">
                PrimeKart
              </span>
              <span className="hidden xl:inline text-xs text-slate-400 font-normal">
                by Aetheria
              </span>
            </button>

            <button
              onClick={() => setLocationModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
              title="Change delivery location"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {deliveryCity} · <span className="font-mono">{deliveryPincode}</span>
              </span>
            </button>
          </div>

          {/* Zone 2: Clean Navigation Links (Max 5 Items) */}
          <nav className="hidden md:flex items-center h-full space-x-7">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`h-full inline-flex items-center text-xs font-medium transition-colors border-b-2 ${
                activeTab === 'catalog'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Catalog
            </button>
            <button
              onClick={() => setActiveTab('visual_ai')}
              className={`h-full inline-flex items-center gap-1.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === 'visual_ai'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>AI Lens & Voice</span>
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`h-full inline-flex items-center gap-1 text-xs font-medium transition-colors border-b-2 ${
                activeTab === 'compare'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Compare</span>
              {comparedProducts.length > 0 && (
                <span className="font-mono text-[11px] text-slate-400">
                  ({comparedProducts.length})
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`h-full inline-flex items-center gap-1 text-xs font-medium transition-colors border-b-2 ${
                activeTab === 'orders'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Orders</span>
              {orders.length > 0 && (
                <span className="font-mono text-[11px] text-slate-400">
                  ({orders.length})
                </span>
              )}
            </button>
            {(effectiveRole === 'seller' || effectiveRole === 'admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`h-full inline-flex items-center text-xs font-medium transition-colors border-b-2 ${
                  activeTab === 'admin'
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Seller Hub
              </button>
            )}
            {effectiveRole === 'admin' && (
              <button
                onClick={() => setActiveTab('security')}
                className={`h-full inline-flex items-center gap-1.5 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === 'security'
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShieldCheck
                  className={`w-3.5 h-3.5 ${
                    activeSimMode !== 'NORMAL' ? 'text-red-600' : 'text-emerald-600'
                  }`}
                />
                <span>Security Center</span>
                {activeSimMode !== 'NORMAL' && (
                  <span className="font-mono text-[10px] font-bold text-red-600 uppercase">
                    [{activeSimMode === 'PARENT_APPROVAL' ? 'PARENTAL' : 'ALERT'}]
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Zone 3: Search, Currency, AI Concierge, Account & Cart */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Compact Integrated Search Box */}
            <div className="hidden sm:flex items-center h-9 w-56 lg:w-72 rounded-lg bg-slate-100 border border-transparent focus-within:bg-white focus-within:border-slate-300 px-3 gap-2 transition-all">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) {
                    setAiMatchedIds(null);
                    setAiReasoning(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setActiveTab('catalog');
                    handleRunSemanticSearch();
                  }
                }}
                placeholder="Search products or ask AI..."
                className="flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none min-w-0"
              />
              <button
                type="button"
                onClick={handleToggleVoiceSearch}
                className={`text-slate-400 hover:text-slate-900 ${
                  isListeningVoice ? 'text-red-600 animate-pulse' : ''
                }`}
                title="Voice search"
              >
                {isListeningVoice ? (
                  <MicOff className="w-3.5 h-3.5" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 hover:text-slate-900"
                title="Search by image"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Currency Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setLocaleMenuOpen((prev) => !prev);
                  setAccountMenuOpen(false);
                }}
                className="h-9 px-2.5 rounded-lg text-xs font-mono text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 transition-colors"
                title="Currency & Language"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{currency}</span>
              </button>

              {localeMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 space-y-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                      Currency
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['INR', 'USD', 'EUR', 'GBP'] as CurrencyCode[]).map((cur) => (
                        <button
                          key={cur}
                          onClick={() => {
                            setCurrency(cur);
                            setLocaleMenuOpen(false);
                          }}
                          className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border text-left flex items-center justify-between ${
                            currency === cur
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{cur}</span>
                          {currency === cur && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                      Language
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['EN', 'FR', 'DE', 'JA'] as LanguageCode[]).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setLanguage(lang);
                            setLocaleMenuOpen(false);
                          }}
                          className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border text-left flex items-center justify-between ${
                            language === lang
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{lang}</span>
                          {language === lang && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 40-Page Internship Report Download */}
            <a
              href="/api/report/download"
              download="PrimeKart_Internship_Report_40_Pages.pdf"
              className="h-9 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download Complete 40-Page Technical Internship Report (PDF)"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">40-Page Report (PDF)</span>
              <span className="sm:hidden">Report</span>
            </a>

            {/* AI Concierge Trigger */}
            <button
              onClick={() => setConciergeOpen(true)}
              className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden lg:inline">AI Assistant</span>
            </button>

            {/* Account & Role Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setAccountMenuOpen((prev) => !prev);
                  setLocaleMenuOpen(false);
                }}
                className="h-9 px-3 rounded-lg border border-slate-200 hover:border-slate-400 text-xs font-medium text-slate-800 flex items-center gap-1.5 bg-white transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="hidden xl:inline max-w-[90px] truncate">
                  {currentUser
                    ? userProfile?.displayName?.split(' ')[0] || 'Account'
                    : 'Role'}
                </span>
                <span className="font-mono text-[10px] uppercase text-slate-500">
                  · {effectiveRole}
                </span>
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 space-y-4">
                  {currentUser ? (
                    <div className="border-b border-slate-100 pb-3">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {userProfile?.displayName || currentUser.displayName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-mono">
                        <Award className="w-3.5 h-3.5" />
                        <span>
                          {userProfile?.loyaltyTier || 'Gold'} ·{' '}
                          {userProfile?.loyaltyPoints ?? 450} pts
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-b border-slate-100 pb-3 space-y-2">
                      <div className="text-xs font-semibold text-slate-900">
                        Sign in for Persistent Orders
                      </div>
                      <button
                        onClick={() => {
                          signInWithGoogle();
                          setAccountMenuOpen(false);
                        }}
                        className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Sign In with Google
                      </button>
                    </div>
                  )}

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                      Workspace Role
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['customer', 'seller', 'admin'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(r)}
                          className={`px-2 py-1.5 text-[11px] font-medium capitalize rounded-lg border text-center transition-colors ${
                            effectiveRole === r
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <div className="mt-1.5 text-[10px] text-slate-400 leading-snug">
                      {effectiveRole === 'admin'
                        ? 'Admin role active: AI Security Center & Seller Hub visible.'
                        : effectiveRole === 'seller'
                        ? 'Seller role active: Seller Hub visible. AI Security Center hidden.'
                        : 'Customer role active: Storefront only. AI Security Center hidden.'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <a
                      href="/api/report/download"
                      download="PrimeKart_Internship_Report_40_Pages.pdf"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-medium flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Download 40-Page Report</span>
                      </span>
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  </div>

                  {currentUser && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => {
                          setActiveTab('orders');
                          setAccountMenuOpen(false);
                        }}
                        className="text-slate-700 hover:text-slate-900 font-medium"
                      >
                        Orders & Returns
                      </button>
                      <button
                        onClick={() => {
                          signOutUser();
                          setAccountMenuOpen(false);
                        }}
                        className="text-red-600 hover:underline flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums">{totalCartUnits}</span>
            </button>
          </div>
        </div>

        {/* Mobile Compact Nav */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-100 bg-white px-2 py-2 text-[11px]">
          <button
            onClick={() => setActiveTab('catalog')}
            className={activeTab === 'catalog' ? 'font-semibold text-slate-900' : 'text-slate-500'}
          >
            Catalog
          </button>
          <button
            onClick={() => setActiveTab('visual_ai')}
            className={activeTab === 'visual_ai' ? 'font-semibold text-slate-900' : 'text-slate-500'}
          >
            AI Search
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={activeTab === 'compare' ? 'font-semibold text-slate-900' : 'text-slate-500'}
          >
            Compare ({comparedProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={activeTab === 'orders' ? 'font-semibold text-slate-900' : 'text-slate-500'}
          >
            Orders
          </button>
          {(effectiveRole === 'seller' || effectiveRole === 'admin') && (
            <button
              onClick={() => setActiveTab('admin')}
              className={activeTab === 'admin' ? 'font-semibold text-slate-900' : 'text-slate-500'}
            >
              Seller Hub
            </button>
          )}
          {effectiveRole === 'admin' && (
            <button
              onClick={() => setActiveTab('security')}
              className={activeTab === 'security' ? 'font-semibold text-slate-900' : 'text-slate-500'}
            >
              Security
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {activeTab === 'catalog' && (
          <div>
            {/* SECTION 1: CLEAN SPLIT-SCREEN CAMPAIGN HERO */}
            <section className="bg-white border-b border-slate-200/80">
              <div className="max-w-[1400px] mx-auto px-6 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">
                    Flagship Electronics, Smart Home & Personal Care · Express Delivery
                  </div>
                  <h1
                    className="font-bold text-slate-900 tracking-tight leading-[1.08]"
                    style={{ fontSize: 'clamp(2rem, 3.4vw, 3.25rem)' }}
                  >
                    {t.heroTitle}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 max-w-[58ch] leading-relaxed">
                    {t.heroSubtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href="#collection-grid"
                      className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors inline-flex items-center gap-2"
                    >
                      <span>Explore Catalog</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => {
                        setActiveCouponCode('AETHERIA15');
                        showToast('Coupon AETHERIA15 (15% Off) applied to your checkout bag.');
                      }}
                      className="px-5 py-3 border border-slate-300 hover:border-slate-900 text-slate-900 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-2 bg-white"
                    >
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {activeCouponCode === 'AETHERIA15'
                          ? '✓ Code AETHERIA15 Active (15% Off)'
                          : 'Apply 15% Off Code: AETHERIA15'}
                      </span>
                    </button>
                  </div>

                  {/* Quiet Inline Metrics */}
                  <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-6 text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">Next-Day Delivery</div>
                      <div className="text-slate-500 mt-0.5">
                        Free to {deliveryCity} ({deliveryPincode})
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Instant UPI QR & EMI</div>
                      <div className="text-slate-500 mt-0.5">
                        Zero-cost monthly installments
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Verified Authenticity</div>
                      <div className="text-slate-500 mt-0.5">
                        10-day replacement guarantee
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Featured Flagship Showcase Card */}
                <div className="lg:col-span-5">
                  <div
                    onClick={() => setSelectedProduct(products[0])}
                    className="group cursor-pointer rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 p-6 transition-all hover:border-slate-400"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                      <span className="uppercase tracking-wider font-semibold text-slate-900">
                        Featured Flagship · {products[0].brand}
                      </span>
                      <span className="font-mono text-emerald-700 font-semibold">
                        Save {getDiscountPercent(products[0].price, products[0].originalPrice)}%
                      </span>
                    </div>
                    <div className="aspect-[16/11] w-full rounded-xl overflow-hidden bg-white border border-slate-100 mb-4">
                      <ResilientImage
                        src={products[0].imageUrl}
                        alt={products[0].title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                    <div className="flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-slate-900 truncate">
                          {products[0].title}
                        </h2>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {products[0].specsSummary}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold font-mono text-slate-900">
                          {formatCurrency(products[0].price, currency)}
                        </div>
                        <div className="text-xs font-mono text-slate-400 line-through">
                          {formatCurrency(products[0].originalPrice, currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: STREAMLINED HORIZONTAL FILTER BAR & SPACIOUS 4-COLUMN PRODUCT GRID */}
            <section id="collection-grid" className="max-w-[1400px] mx-auto px-6 py-12 space-y-8">
              {/* Clean Horizontal Filter & Sort Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
                {/* Segmented Department Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setAiMatchedIds(null);
                      }}
                      className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {CATEGORY_DISPLAY_LABELS[cat].short}
                    </button>
                  ))}
                </div>

                {/* Right Filter & Sort Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setDealsOnly((prev) => !prev)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      dealsOnly
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200/80 bg-white text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    15%+ Off Deals
                  </button>

                  <button
                    onClick={() => setEcoFilterOnly((prev) => !prev)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
                      ecoFilterOnly
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200/80 bg-white text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Leaf className="w-3.5 h-3.5" />
                    <span>Eco Certified</span>
                  </button>

                  <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-lg px-3 py-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(
                          e.target.value as
                            | 'featured'
                            | 'price_asc'
                            | 'price_desc'
                            | 'rating'
                            | 'discount'
                        )
                      }
                      className="text-xs bg-transparent text-slate-800 font-medium focus:outline-none"
                    >
                      <option value="featured">Sort: Featured</option>
                      <option value="discount">Sort: Biggest Savings</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="rating">Customer Rating</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* AI Semantic Search Rationale Callout */}
              {(aiReasoning || aiSearchLoading) && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-900">
                        {aiSearchLoading
                          ? 'Analyzing catalog specifications...'
                          : `AI Search Selection ${
                              aiSuggestedFilter ? `· ${aiSuggestedFilter}` : ''
                            }`}
                      </div>
                      {aiReasoning && (
                        <p className="text-xs text-slate-600 leading-relaxed">{aiReasoning}</p>
                      )}
                    </div>
                  </div>
                  {aiMatchedIds && (
                    <button
                      onClick={() => {
                        setAiMatchedIds(null);
                        setAiReasoning(null);
                        setAiSuggestedFilter(null);
                        setSearchQuery('');
                      }}
                      className="text-xs font-medium text-slate-900 underline shrink-0"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              )}

              {/* SPACIOUS 4-COLUMN PRODUCT CATALOG GRID */}
              {displayedProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
                  <p className="text-sm font-semibold text-slate-900">
                    No products match your current filter selection.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setDealsOnly(false);
                      setEcoFilterOnly(false);
                      setSearchQuery('');
                      setAiMatchedIds(null);
                    }}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                  {displayedProducts.map((product) => {
                    const isWishlisted = wishlist.some((w) => w.id === product.id);
                    const isCompared = comparedProducts.some((c) => c.id === product.id);
                    const discountPct = getDiscountPercent(
                      product.price,
                      product.originalPrice
                    );

                    return (
                      <article
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className="group cursor-pointer bg-white rounded-2xl border border-slate-200/80 hover:border-slate-400 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between overflow-hidden"
                      >
                        <div>
                          {/* 4:5 Image Container on Neutral Surface */}
                          <div className="relative aspect-[4/4] w-full bg-slate-50 border-b border-slate-100 overflow-hidden">
                            <ResilientImage
                              src={product.imageUrl}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            />

                            {/* Subtle Top-Right Secondary Actions */}
                            <div
                              className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleToggleWishlist(product)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-xs transition-colors ${
                                  isWishlisted
                                    ? 'bg-slate-900 border-slate-900 text-white'
                                    : 'bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white'
                                }`}
                                title="Save to Wishlist"
                              >
                                <Heart className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleCompare(product)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-xs transition-colors ${
                                  isCompared
                                    ? 'bg-slate-900 border-slate-900 text-white'
                                    : 'bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white'
                                }`}
                                title="Compare Product"
                              >
                                <Scale className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Clean 3-Level Typographic Hierarchy */}
                          <div className="p-5 space-y-2">
                            <div className="text-[11px] uppercase tracking-wider text-slate-500 truncate">
                              {product.brand} · {product.subcategory}
                            </div>

                            <h2 className="text-[15px] font-semibold text-slate-900 truncate">
                              {product.title}
                            </h2>

                            <div className="flex items-baseline justify-between pt-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                                  {formatCurrency(product.price, currency)}
                                </span>
                                {discountPct > 0 && (
                                  <span className="text-xs text-slate-400 line-through font-mono">
                                    {formatCurrency(product.originalPrice, currency)}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-600 font-mono">
                                ★ {product.rating.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Clean Dual Action Footer */}
                        <div
                          className="px-5 pb-5 pt-1 grid grid-cols-2 gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleAddToCart(product, 1)}
                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs rounded-lg transition-colors"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => handleBuyNow(product, 1)}
                            className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
                          >
                            Buy Now
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* SECTION 3: CLEAN FREQUENTLY BOUGHT TOGETHER BUNDLE */}
              <div className="mt-14 pt-10 border-t border-slate-200/80">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        Curated Ecosystem Bundle
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">
                        Frequently Bought Together — Extra 15% Off with Code AETHERIA15
                      </h3>
                    </div>
                    <div className="text-xs font-mono text-emerald-700 font-semibold">
                      Direct Savings:{' '}
                      {formatCurrency(
                        Math.max(0, bundleOriginalUsd - bundleTotalUsd),
                        currency
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {bundleCandidates.map((item) => {
                        const isChecked = bundleSelectedIds.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-3 ${
                              isChecked
                                ? 'border-slate-900 bg-slate-50/60'
                                : 'border-slate-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setBundleSelectedIds((prev) =>
                                    isChecked
                                      ? prev.filter((id) => id !== item.id)
                                      : [...prev, item.id]
                                  );
                                }}
                                className="mt-1 accent-slate-900"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-slate-900 truncate">
                                  {item.title}
                                </div>
                                <div className="text-xs font-mono text-slate-600 mt-0.5">
                                  {formatCurrency(item.price, currency)}
                                </div>
                              </div>
                            </div>
                            <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-white border border-slate-100">
                              <ResilientImage
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="lg:col-span-4 p-5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                      <div className="text-xs text-slate-500">
                        Bundle Total ({bundleSelectedIds.length} items)
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 font-mono">
                          {formatCurrency(bundleTotalUsd, currency)}
                        </span>
                        <span className="text-xs text-slate-400 line-through font-mono">
                          {formatCurrency(bundleOriginalUsd, currency)}
                        </span>
                      </div>
                      <button
                        onClick={handleAddBundleToCart}
                        disabled={bundleSelectedIds.length === 0}
                        className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Selected Bundle to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* AI LENS & VOICE SEARCH STUDIO TAB */}
        {activeTab === 'visual_ai' && (
          <div className="max-w-[1280px] mx-auto px-6 py-10 space-y-8">
            <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Multimodal Gemini 2.5 Flash Discovery
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">
                  Visual Lens & Natural Language Search
                </h1>
              </div>
              <p className="text-xs text-slate-500 max-w-md">
                Upload a photo or describe what you need in natural language to find matching items from the catalog.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                    1. Search by Image (AI Lens)
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={aiSearchLoading}
                    className="w-full py-8 border border-dashed border-slate-300 hover:border-slate-900 rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-2 transition-colors"
                  >
                    <Camera className="w-6 h-6 text-slate-700" />
                    <span className="text-xs font-semibold text-slate-900">
                      Upload Reference Photo (JPEG / PNG)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Analyzed via Gemini 2.5 Flash Vision
                    </span>
                  </button>

                  {uploadedPreviewUrl && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={uploadedPreviewUrl}
                        alt="Uploaded visual query"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                    2. Natural Language Query
                  </div>
                  <textarea
                    rows={3}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., 'Best noise cancelling headphones for travel and a titanium 5G smartphone'"
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunSemanticSearch()}
                      disabled={aiSearchLoading}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {aiSearchLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Run AI Search</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleToggleVoiceSearch}
                      className="px-3.5 py-2.5 border border-slate-200 rounded-xl hover:border-slate-900 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Voice</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    AI Curation Analysis
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {aiReasoning ||
                      'Upload a photo or describe your requirements on the left to generate tailored product matches.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {displayedProducts.slice(0, 4).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="group cursor-pointer bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-slate-400 transition-colors flex flex-col justify-between"
                    >
                      <div className="aspect-[4/3] w-full bg-slate-50 overflow-hidden">
                        <ResilientImage
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 space-y-1.5">
                        <div className="text-[11px] uppercase tracking-wider text-slate-500">
                          {product.brand}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {product.title}
                        </div>
                        <div className="pt-1 flex items-center justify-between font-mono text-xs">
                          <span className="font-bold text-slate-900">
                            {formatCurrency(product.price, currency)}
                          </span>
                          <span className="text-slate-500">★ {product.rating.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPARE PRODUCTS TAB */}
        {activeTab === 'compare' && (
          <ProductComparisonMatrix
            comparedProducts={comparedProducts}
            currency={currency}
            onRemoveCompare={(id) =>
              setComparedProducts((prev) => prev.filter((p) => p.id !== id))
            }
            onAddToCart={handleAddToCart}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}

        {/* ORDERS & RETURNS TRACKING TAB */}
        {activeTab === 'orders' && (
          <OrdersTrackingView
            orders={orders}
            currency={currency}
            isSignedIn={Boolean(currentUser)}
            onSignInRequest={() => signInWithGoogle()}
          />
        )}

        {/* SELLER HUB & ADMIN DASHBOARD TAB */}
        {activeTab === 'admin' && (
          <AdminSellerDashboard
            products={products}
            orders={orders}
            coupons={coupons}
            currency={currency}
            userRole={effectiveRole}
          />
        )}

        {/* CYBERSECURITY & EXPLAINABLE AI RISK CENTER TAB (STRICTLY ADMIN ONLY) */}
        {activeTab === 'security' && effectiveRole === 'admin' && (
          <SecurityCenterView
            onSimulationModeChanged={(mode) => {
              setActiveSimMode(mode);
              if (mode === 'NORMAL') {
                showToast('Security state reset to Normal Mode (LOW Risk).');
              } else {
                showToast(`Active security simulation: ${mode.replace(/_/g, ' ')}. Try placing an order in Cart to see live interception!`);
              }
            }}
          />
        )}
      </main>

      {/* CLEAN PROFESSIONAL FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 mt-20">
        <div className="max-w-[1400px] mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-xs text-slate-500">
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-900">PrimeKart · Aetheria</div>
            <p className="leading-relaxed">
              Modern AI-powered e-commerce platform with multimodal search, instant UPI QR checkout, real-time order tracking, and role-based seller analytics.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
              Departments
            </div>
            <div>Mobiles, 5G Phones & ANC Audio</div>
            <div>Home, Kitchen & Espresso</div>
            <div>Clinical Skincare & Beauty</div>
            <div>Precision & Smart Watches</div>
          </div>
          <div className="space-y-1.5">
            <div className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
              Active Promotions
            </div>
            <div>Code AETHERIA15 — 15% Instant Discount</div>
            <div>Code ECOCARBON10 — $40 / ₹3,340 Eco Credit</div>
            <div>Code ATELIERVIP — 20% VIP Discount</div>
          </div>
          <div className="space-y-1.5">
            <div className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
              Security & Payments
            </div>
            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dynamic UPI QR, Cards, Wallets & COD</span>
            </div>
            <div>PII Vault Isolation (/users/private)</div>
            <div>Customer, Seller & Admin Access Control</div>
            <div className="pt-2 border-t border-slate-100">
              <a
                href="/api/report/download"
                download="PrimeKart_Internship_Report_40_Pages.pdf"
                className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download 40-Page Report (PDF)</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS & DRAWERS */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={
          selectedProduct ? wishlist.some((w) => w.id === selectedProduct.id) : false
        }
        onToggleCompare={handleToggleCompare}
        isCompared={
          selectedProduct
            ? comparedProducts.some((c) => c.id === selectedProduct.id)
            : false
        }
        currency={currency}
        userDisplayName={
          userProfile?.displayName || currentUser?.displayName || 'Verified Buyer'
        }
        onSubscribePriceAlert={handleSubscribePriceAlert}
        hasPriceAlert={
          selectedProduct ? priceAlertIds.includes(selectedProduct.id) : false
        }
        coupons={coupons}
        activeCouponCode={activeCouponCode}
        onApplyCoupon={(code) => {
          setActiveCouponCode(code);
          showToast(`Coupon ${code} applied to your bag.`);
        }}
        deliveryPincode={deliveryPincode}
        onUpdatePincode={(pin) => setDeliveryPincode(pin)}
      />

      <CartCheckoutDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cart={cart}
        wishlist={wishlist}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onMoveToWishlist={handleMoveToWishlist}
        onMoveWishlistToCart={(product) => {
          handleAddToCart(product, 1);
          setWishlist((prev) => prev.filter((w) => w.id !== product.id));
        }}
        onRemoveFromWishlist={(id) =>
          setWishlist((prev) => prev.filter((w) => w.id !== id))
        }
        onClearCart={() => setCart([])}
        availableCoupons={coupons}
        activeCouponCode={activeCouponCode}
        onApplyCoupon={(code) => setActiveCouponCode(code)}
        currency={currency}
        userProfile={userProfile}
        onSignInRequest={() => signInWithGoogle()}
        onOrderCompleted={(orderId) => {
          showToast(`Order ${orderId} confirmed.`);
          setCartDrawerOpen(false);
          setActiveTab('orders');
        }}
        onOpenSecurityCenter={
          effectiveRole === 'admin' ? () => setActiveTab('security') : undefined
        }
      />

      <AiConciergeDrawer
        isOpen={conciergeOpen}
        onClose={() => setConciergeOpen(false)}
        catalog={products}
        cart={cart}
        currency={currency}
        userContext={`Active currency: ${currency}, Delivery City: ${deliveryCity} (${deliveryPincode}), Role: ${
          userProfile?.role || 'guest'
        }`}
        onSelectProduct={(p) => {
          setConciergeOpen(false);
          setSelectedProduct(p);
        }}
        onApplyCoupon={(code) => {
          setActiveCouponCode(code);
          showToast(`Coupon ${code} applied to your Cart.`);
        }}
      />
    </div>
  );
}
