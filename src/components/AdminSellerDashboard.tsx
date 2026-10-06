import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  PackageCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import {
  Product,
  Order,
  Coupon,
  ProductCategory,
  OrderStatusType,
  CurrencyCode,
  BLUEPRINT_CONSTRAINTS,
  clampString,
  sanitizeId,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  formatCurrency,
  CATEGORY_DEFAULT_IMAGES,
} from '../data/catalog';
import { SecurityCenterView } from './SecurityCenterView';

interface AdminSellerDashboardProps {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  currency: CurrencyCode;
  userRole: string;
}

interface RestockPrediction {
  productId: string;
  title: string;
  predictedDaysLeft: number;
  recommendedReorderUnits: number;
  riskLevel: string;
  rationale: string;
}

interface SellerInsightsResponse {
  restockPredictions: RestockPrediction[];
  merchandisingBrief: string;
  sustainabilityHighlight: string;
}

export const AdminSellerDashboard: React.FC<AdminSellerDashboardProps> = ({
  products,
  orders,
  coupons,
  currency,
  userRole,
}) => {
  const [activeSection, setActiveSection] = useState<
    'security' | 'analytics' | 'inventory' | 'orders' | 'promotions'
  >('inventory');

  const [aiInsights, setAiInsights] = useState<SellerInsightsResponse | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newBrand, setNewBrand] = useState('Aetheria Studio');
  const [newCategory, setNewCategory] = useState<ProductCategory>('Architectural Living');
  const [newPrice, setNewPrice] = useState(680);
  const [newStock, setNewStock] = useState(15);
  const [newSpecs, setNewSpecs] = useState(
    'Solid FSC White Oak & Brushed Brass · Hand-Finished in Copenhagen'
  );
  const [newDesc, setNewDesc] = useState(
    'Architectural edition crafted from sustainably harvested European timber and precision-machined brass.'
  );
  const [newEcoTag, setNewEcoTag] = useState('100% FSC Certified · Zero-VOC Finish');

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponVal, setNewCouponVal] = useState(15);
  const [newCouponMin, setNewCouponMin] = useState(200);

  const activeOrders = orders.filter((o) => o.status !== 'Cancelled' && o.status !== 'Refunded');
  const totalRevenue = activeOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const avgOrderValue = activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0;
  const totalCarbonOffset = Number(
    activeOrders.reduce((acc, o) => acc + (o.carbonOffsetKg || 0), 0).toFixed(1)
  );
  const lowStockCount = products.filter((p) => p.stock <= 8).length;

  const handleRunAiForecast = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch('/api/ai/seller-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: products.map((p) => ({
            id: p.id,
            title: p.title,
            stock: p.stock,
            price: p.price,
            rating: p.rating,
            reviewCount: p.reviewCount,
            sustainabilityScore: p.sustainabilityScore,
          })),
          ordersSummary: {
            totalOrders: orders.length,
            totalRevenue,
            avgOrderValue,
            totalCarbonOffset,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) setAiInsights(data);
    } catch (err) {
      console.error('Forecast error:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSeedFirestoreCatalog = async () => {
    if (!auth.currentUser) {
      setStatusBanner('Please sign in with Google first to write catalog records to Firestore.');
      return;
    }
    setStatusBanner('Synchronizing flagship products and coupons to Firestore...');
    try {
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), {
          ...prod,
          sellerId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const c of INITIAL_COUPONS) {
        await setDoc(doc(db, 'coupons', c.code), {
          ...c,
          createdBy: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setStatusBanner('Successfully synchronized 6 flagship products and 3 coupons to Firestore.');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'products');
      } catch (formatted) {
        setStatusBanner(formatted instanceof Error ? formatted.message : 'Sync error');
      }
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setStatusBanner('Sign in with Google to publish a product to Firestore.');
      return;
    }
    const prodId = sanitizeId(`prod_${Date.now()}`);
    try {
      await setDoc(doc(db, 'products', prodId), {
        id: prodId,
        title: clampString(newTitle, 2, BLUEPRINT_CONSTRAINTS.PRODUCT_TITLE_MAX, 'Atelier Object'),
        brand: clampString(newBrand, 2, BLUEPRINT_CONSTRAINTS.PRODUCT_BRAND_MAX, 'Aetheria'),
        category: newCategory,
        subcategory: 'Limited Edition',
        price: Math.max(1, Number(newPrice)),
        originalPrice: Math.max(1, Math.round(Number(newPrice) * 1.12)),
        stock: Math.max(0, Number(newStock)),
        rating: 4.9,
        reviewCount: 1,
        imageUrl: CATEGORY_DEFAULT_IMAGES[newCategory],
        description: clampString(
          newDesc,
          5,
          BLUEPRINT_CONSTRAINTS.PRODUCT_DESC_MAX,
          'Architectural object.'
        ),
        specsSummary: clampString(
          newSpecs,
          2,
          BLUEPRINT_CONSTRAINTS.PRODUCT_SPECS_MAX,
          'Precision specifications.'
        ),
        sustainabilityScore: 95,
        carbonFootprintKg: 11.4,
        ecoMaterialTag: clampString(
          newEcoTag,
          2,
          BLUEPRINT_CONSTRAINTS.PRODUCT_ECO_TAG_MAX,
          'Certified Sustainable'
        ),
        sellerId: auth.currentUser.uid,
        sellerName: clampString(
          auth.currentUser.displayName || 'Aetheria Partner Atelier',
          2,
          100,
          'Aetheria Partner Atelier'
        ),
        isPublished: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewTitle('');
      setStatusBanner(`Published new catalog item "${newTitle}" (${prodId}).`);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, `products/${prodId}`);
      } catch (formatted) {
        setStatusBanner(formatted instanceof Error ? formatted.message : 'Failed to create product.');
      }
    }
  };

  const handleAdjustStock = async (prod: Product, delta: number) => {
    if (!auth.currentUser) {
      setStatusBanner('Sign in with Google to update inventory stock.');
      return;
    }
    const nextStock = Math.max(0, prod.stock + delta);
    try {
      await updateDoc(doc(db, 'products', prod.id), {
        stock: nextStock,
        rating: prod.rating,
        reviewCount: prod.reviewCount,
        updatedAt: serverTimestamp(),
      });
      setStatusBanner(`Updated stock for ${prod.title} to ${nextStock} units.`);
    } catch {
      try {
        await setDoc(doc(db, 'products', prod.id), {
          ...prod,
          stock: nextStock,
          sellerId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setStatusBanner(`Initialized & updated stock for ${prod.title} to ${nextStock} units.`);
      } catch (err2) {
        try {
          handleFirestoreError(err2, OperationType.UPDATE, `products/${prod.id}`);
        } catch (f) {
          setStatusBanner(f instanceof Error ? f.message : 'Stock update failed.');
        }
      }
    }
  };

  const handleUpdateOrderStatus = async (order: Order, nextStatus: OrderStatusType) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: nextStatus,
        trackingNumber: order.trackingNumber,
        paymentStatus: nextStatus === 'Refunded' ? 'Refunded' : order.paymentStatus,
        updatedAt: serverTimestamp(),
      });
      setStatusBanner(`Order ${order.id} transitioned to ${nextStatus}.`);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
      } catch (formatted) {
        setStatusBanner(formatted instanceof Error ? formatted.message : 'Order update failed.');
      }
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setStatusBanner('Sign in with Google to create a promotional coupon.');
      return;
    }
    const cleanCode = sanitizeId(newCouponCode.toUpperCase()).slice(
      0,
      BLUEPRINT_CONSTRAINTS.COUPON_CODE_MAX
    );
    try {
      await setDoc(doc(db, 'coupons', cleanCode), {
        code: cleanCode,
        description: clampString(
          newCouponDesc,
          3,
          BLUEPRINT_CONSTRAINTS.COUPON_DESC_MAX,
          'Patron Promotional Privilege'
        ),
        discountType: newCouponType,
        discountValue: Math.max(1, Number(newCouponVal)),
        minOrderAmount: Math.max(0, Number(newCouponMin)),
        isActive: true,
        ecoBonus: true,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewCouponCode('');
      setNewCouponDesc('');
      setStatusBanner(`Created live promotional coupon code ${cleanCode}.`);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, `coupons/${cleanCode}`);
      } catch (formatted) {
        setStatusBanner(formatted instanceof Error ? formatted.message : 'Failed to create coupon.');
      }
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E2DC]">
        <div>
          <div className="text-xs text-[#6E6B64]">
            <span>Atelier Operations Console</span>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-[#141413] font-medium capitalize">Role: {userRole}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-[#141413] mt-1">
            Merchant & Supply Chain Intelligence
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSeedFirestoreCatalog}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-[#E5E2DC] bg-white text-[#141413] rounded-lg hover:bg-[#F3F1EC] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Database className="w-3.5 h-3.5" />
            Sync Default Catalog to Firestore
          </button>
          <button
            type="button"
            onClick={handleRunAiForecast}
            disabled={loadingInsights}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#141413] text-white rounded-lg hover:bg-[#292826] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
            {loadingInsights ? 'Running Demand Model...' : 'Run AI Stock & Revenue Forecast'}
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-[#D4A373] rounded-lg text-xs text-[#141413]">
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-[#6E6B64] hover:text-[#141413] font-mono cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-[#E5E2DC] rounded-lg space-y-1">
          <span className="text-xs text-[#6E6B64]">Gross Merchandise Value (GMV)</span>
          <div className="text-2xl font-mono font-semibold tabular-nums text-[#141413]">
            {formatCurrency(totalRevenue, currency)}
          </div>
          <span className="text-xs text-[#166534] inline-flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {activeOrders.length} active orders · AOV {formatCurrency(avgOrderValue, currency)}
          </span>
        </div>

        <div className="p-5 bg-white border border-[#E5E2DC] rounded-lg space-y-1">
          <span className="text-xs text-[#6E6B64]">Active SKU Inventory</span>
          <div className="text-2xl font-mono font-semibold tabular-nums text-[#141413]">
            {products.reduce((acc, p) => acc + p.stock, 0)} units
          </div>
          <span className="text-xs text-[#57554E]">
            Across {products.length} published architectural SKUs
          </span>
        </div>

        <div className="p-5 bg-white border border-[#E5E2DC] rounded-lg space-y-1">
          <span className="text-xs text-[#6E6B64]">Low-Stock Depletion Alerts</span>
          <div className="text-2xl font-mono font-semibold tabular-nums text-[#D97706]">
            {lowStockCount} SKUs
          </div>
          <span className="text-xs text-[#D97706] inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Threshold ≤ 8 units remaining
          </span>
        </div>

        <div className="p-5 bg-white border border-[#E5E2DC] rounded-lg space-y-1">
          <span className="text-xs text-[#6E6B64]">Verified Carbon Offset Ledger</span>
          <div className="text-2xl font-mono font-semibold tabular-nums text-[#166534]">
            {totalCarbonOffset} kg CO₂e
          </div>
          <span className="text-xs text-[#166534] inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Avg Sustainability Index 93.8/100
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3F1EC] rounded-lg w-fit">
        {(
          [
            ...(userRole === 'admin'
              ? ([{ id: 'security', label: '🛡️ Security Center (SOC)' }] as const)
              : []),
            { id: 'inventory', label: `Catalog & Inventory (${products.length})` },
            { id: 'orders', label: `Order Fulfillment (${orders.length})` },
            { id: 'promotions', label: `Coupons & Rules (${coupons.length})` },
            { id: 'analytics', label: 'AI Forecast & Revenue' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === tab.id
                ? 'bg-white text-[#141413] shadow-xs'
                : 'text-[#57554E] hover:text-[#141413]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'analytics' && (
        <div className="space-y-6">
          {aiInsights ? (
            <div className="p-6 bg-white border border-[#D4A373] rounded-lg space-y-6">
              <div className="border-b border-[#E5E2DC] pb-4">
                <h3 className="text-lg font-display font-semibold text-[#141413]">
                  Supply Chain & Merchandising Forecast
                </h3>
                <p className="text-xs text-[#6E6B64]">
                  Real-time depletion velocity and reorder quantities computed from live catalog state
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#FBFBF9] border border-[#E5E2DC] rounded-lg space-y-1.5">
                  <span className="text-xs font-semibold text-[#141413]">
                    Merchandising & Conversion Strategy
                  </span>
                  <p className="text-xs text-[#3F3E3A] leading-relaxed">
                    {aiInsights.merchandisingBrief}
                  </p>
                </div>
                <div className="p-4 bg-[#FBFBF9] border border-[#E5E2DC] rounded-lg space-y-1.5">
                  <span className="text-xs font-semibold text-[#166534]">
                    Sustainability & Eco-Material Resonance
                  </span>
                  <p className="text-xs text-[#3F3E3A] leading-relaxed">
                    {aiInsights.sustainabilityHighlight}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E2DC] text-xs text-[#6E6B64]">
                      <th className="py-2.5 px-3 font-medium">SKU / Product</th>
                      <th className="py-2.5 px-3 font-medium">Risk Level</th>
                      <th className="py-2.5 px-3 font-medium text-right">Est. Days Until Stockout</th>
                      <th className="py-2.5 px-3 font-medium text-right">Recommended Reorder</th>
                      <th className="py-2.5 px-3 font-medium">Analyst Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DC] text-xs">
                    {aiInsights.restockPredictions.map((pred) => (
                      <tr key={pred.productId} className="hover:bg-[#FBFBF9]">
                        <td className="py-3 px-3 font-medium text-[#141413]">{pred.title}</td>
                        <td className="py-3 px-3 font-mono text-[#9A3412]">{pred.riskLevel}</td>
                        <td className="py-3 px-3 font-mono tabular-nums text-right">
                          {pred.predictedDaysLeft} days
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-right font-semibold text-[#141413]">
                          +{pred.recommendedReorderUnits} units
                        </td>
                        <td className="py-3 px-3 text-[#57554E]">{pred.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-white border border-[#E5E2DC] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#141413]">
                  AI Low-Stock & Demand Prediction Ready
                </h3>
                <p className="text-xs text-[#6E6B64]">
                  Click "Run AI Stock & Revenue Forecast" to analyze SKU depletion velocity and generate reorder recommendations.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunAiForecast}
                disabled={loadingInsights}
                className="px-4 py-2 text-xs font-medium bg-[#141413] text-white rounded-lg cursor-pointer whitespace-nowrap"
              >
                {loadingInsights ? 'Analyzing...' : 'Generate AI Forecast'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeSection === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white border border-[#E5E2DC] rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E2DC] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#141413]">
                Live SKU Inventory & Stock Controls
              </h3>
              <span className="text-xs text-[#6E6B64]">Real-time Firestore sync</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E2DC] text-xs text-[#6E6B64] bg-[#FBFBF9]">
                    <th className="py-3 px-4 font-medium">Product</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium text-right">Unit Price</th>
                    <th className="py-3 px-4 font-medium text-right">Vault Stock</th>
                    <th className="py-3 px-4 font-medium text-right">Replenish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC] text-xs">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#FBFBF9]">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#141413]">{prod.title}</div>
                        <div className="text-[#6E6B64]">{prod.brand}</div>
                      </td>
                      <td className="py-3 px-4 text-[#57554E]">{prod.category}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right">
                        {formatCurrency(prod.price, currency)}
                      </td>
                      <td
                        className={`py-3 px-4 font-mono tabular-nums text-right font-semibold ${
                          prod.stock <= 8 ? 'text-[#D97706]' : 'text-[#141413]'
                        }`}
                      >
                        {prod.stock} units
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(prod, -1)}
                            className="px-2 py-1 border border-[#E5E2DC] rounded hover:bg-[#F3F1EC] font-mono cursor-pointer"
                          >
                            −1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(prod, 5)}
                            className="px-2 py-1 border border-[#E5E2DC] rounded hover:bg-[#F3F1EC] font-mono cursor-pointer"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form
            onSubmit={handleCreateProduct}
            className="lg:col-span-4 p-6 bg-white border border-[#E5E2DC] rounded-lg space-y-4"
          >
            <h3 className="text-sm font-semibold text-[#141413] flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Publish New Atelier SKU
            </h3>
            <div className="space-y-1">
              <label className="block text-xs text-[#57554E]">Product Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Monolith Travertine Side Table"
                className="w-full px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs text-[#57554E]">Atelier Brand</label>
                <input
                  type="text"
                  required
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-[#57554E]">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                  className="w-full px-2.5 py-2 text-xs border border-[#E5E2DC] rounded-lg bg-white"
                >
                  <option value="Architectural Living">Architectural Living</option>
                  <option value="Audio & Acoustics">Audio & Acoustics</option>
                  <option value="Botanical Formulation">Botanical Formulation</option>
                  <option value="Precision Horology">Precision Horology</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs text-[#57554E]">Price (USD)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#E5E2DC] rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-[#57554E]">Initial Stock</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#E5E2DC] rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-[#57554E]">Technical Specs Summary</label>
              <input
                type="text"
                required
                value={newSpecs}
                onChange={(e) => setNewSpecs(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-[#57554E]">Eco Material Certification</label>
              <input
                type="text"
                required
                value={newEcoTag}
                onChange={(e) => setNewEcoTag(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-[#57554E]">Editorial Description</label>
              <textarea
                rows={2}
                required
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#141413] text-white text-xs font-medium rounded-lg hover:bg-[#292826] cursor-pointer"
            >
              Publish to Firestore Catalog
            </button>
          </form>
        </div>
      )}

      {activeSection === 'orders' && (
        <div className="bg-white border border-[#E5E2DC] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E2DC] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#141413]">
              Order Fulfillment & Logistics Dispatch
            </h3>
            <span className="text-xs text-[#6E6B64]">
              Terminal states (Cancelled / Refunded) are locked
            </span>
          </div>
          {orders.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <PackageCheck className="w-8 h-8 stroke-[1.25] mx-auto text-[#8C887F]" />
              <p className="text-xs text-[#6E6B64]">
                No customer orders recorded yet. Place a test order from the storefront bag to manage fulfillment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E2DC] text-xs text-[#6E6B64] bg-[#FBFBF9]">
                    <th className="py-3 px-4 font-medium">Order ID / Tracking</th>
                    <th className="py-3 px-4 font-medium">Customer & Region</th>
                    <th className="py-3 px-4 font-medium">Items</th>
                    <th className="py-3 px-4 font-medium text-right">Total</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Advance Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC] text-xs">
                  {orders.map((ord) => {
                    const isTerminal = ord.status === 'Cancelled' || ord.status === 'Refunded';
                    return (
                      <tr key={ord.id} className="hover:bg-[#FBFBF9]">
                        <td className="py-3.5 px-4 font-mono">
                          <div className="text-[#141413] font-medium">{ord.id.slice(0, 16)}</div>
                          <div className="text-[#6E6B64]">{ord.trackingNumber}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#141413]">{ord.customerName}</div>
                          <div className="text-[#6E6B64]">{ord.shippingRegion}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-[#3F3E3A]">
                          {ord.itemsSummary}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-right font-medium text-[#141413]">
                          {formatCurrency(ord.totalAmount, currency)}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#141413]">
                          {ord.status.replace(/_/g, ' ')} · {ord.paymentStatus}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isTerminal ? (
                            <span className="text-[#8C887F] font-mono">Terminal Locked</span>
                          ) : (
                            <select
                              value={ord.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(ord, e.target.value as OrderStatusType)
                              }
                              className="px-2.5 py-1.5 text-xs border border-[#E5E2DC] rounded bg-white cursor-pointer"
                            >
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Out_For_Delivery">Out For Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Return_Requested">Return Requested</option>
                              <option value="Refunded">Refunded (Terminal)</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSection === 'promotions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white border border-[#E5E2DC] rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E2DC]">
              <h3 className="text-sm font-semibold text-[#141413]">Active Promotional Codes</h3>
            </div>
            <div className="divide-y divide-[#E5E2DC]">
              {coupons.map((c) => (
                <div key={c.code} className="p-4 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="font-mono font-semibold text-sm text-[#141413]">{c.code}</div>
                    <p className="text-[#57554E]">{c.description}</p>
                  </div>
                  <div className="text-right font-mono tabular-nums text-[#141413]">
                    <div>
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}% OFF`
                        : `$${c.discountValue} OFF`}
                    </div>
                    <div className="text-[#6E6B64]">Min ${c.minOrderAmount}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleCreateCoupon}
            className="lg:col-span-5 p-6 bg-white border border-[#E5E2DC] rounded-lg space-y-4"
          >
            <h3 className="text-sm font-semibold text-[#141413]">Create Promotional Code</h3>
            <div className="space-y-1">
              <label className="block text-xs text-[#57554E]">Coupon Code (Alphanumeric)</label>
              <input
                type="text"
                required
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g., AUTUMN25"
                className="w-full px-3 py-2 text-xs font-mono border border-[#E5E2DC] rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-[#57554E]">Description</label>
              <input
                type="text"
                required
                value={newCouponDesc}
                onChange={(e) => setNewCouponDesc(e.target.value)}
                placeholder="e.g., 25% Patron Preview Privilege"
                className="w-full px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-[#57554E] mb-1">Type</label>
                <select
                  value={newCouponType}
                  onChange={(e) => setNewCouponType(e.target.value as 'percentage' | 'fixed')}
                  className="w-full px-2 py-2 text-xs border border-[#E5E2DC] rounded-lg bg-white"
                >
                  <option value="percentage">% Off</option>
                  <option value="fixed">$ Fixed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#57554E] mb-1">Value</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newCouponVal}
                  onChange={(e) => setNewCouponVal(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs font-mono border border-[#E5E2DC] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-[#57554E] mb-1">Min Order ($)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newCouponMin}
                  onChange={(e) => setNewCouponMin(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs font-mono border border-[#E5E2DC] rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#141413] text-white text-xs font-medium rounded-lg hover:bg-[#292826] cursor-pointer"
            >
              Activate Coupon in Firestore
            </button>
          </form>
        </div>
      )}

      {activeSection === 'security' && userRole === 'admin' && <SecurityCenterView />}
    </div>
  );
};
