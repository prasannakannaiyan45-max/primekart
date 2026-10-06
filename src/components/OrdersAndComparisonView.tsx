import React, { useState } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  ShoppingBag,
  Leaf,
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Order, Product, CurrencyCode, OrderStatusType } from '../types';
import { formatCurrency } from '../data/catalog';
import { ResilientImage } from './ResilientImage';

interface OrdersViewProps {
  orders: Order[];
  currency: CurrencyCode;
  isSignedIn: boolean;
  onSignInRequest: () => void;
}

export const OrdersTrackingView: React.FC<OrdersViewProps> = ({
  orders,
  currency,
  isSignedIn,
  onSignInRequest,
}) => {
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleCustomerOrderAction = async (order: Order, targetStatus: OrderStatusType) => {
    try {
      const payload: Record<string, unknown> = {
        status: targetStatus,
        updatedAt: serverTimestamp(),
      };
      if (targetStatus === 'Cancelled') {
        payload.paymentStatus = order.paymentStatus === 'Paid' ? 'Refunded' : 'Pending_COD';
      }
      await updateDoc(doc(db, 'orders', order.id), payload);
      setActionMessage(
        targetStatus === 'Cancelled'
          ? `Order ${order.id} has been cancelled and refund initiated.`
          : `Return & White-Glove Collection requested for Order ${order.id}.`
      );
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
      } catch (formatted) {
        setActionMessage(formatted instanceof Error ? formatted.message : 'Action failed.');
      }
    }
  };

  const steps: OrderStatusType[] = [
    'Confirmed',
    'Processing',
    'Shipped',
    'Out_For_Delivery',
    'Delivered',
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
      <div className="border-b border-[#E5E2DC] pb-6">
        <div className="text-xs text-[#6E6B64]">
          <span>Post-Purchase Concierge</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>Real-Time Logistics & Carbon Ledger</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-[#141413] mt-1">
          Order History & Live Shipment Tracking
        </h1>
      </div>

      {actionMessage && (
        <div className="p-4 bg-white border border-[#D4A373] rounded-lg text-xs text-[#141413] flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-[#6E6B64] hover:text-[#141413] font-mono cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {!isSignedIn ? (
        <div className="p-12 bg-white border border-[#E5E2DC] rounded-lg text-center space-y-4">
          <Package className="w-10 h-10 stroke-[1.25] mx-auto text-[#8C887F]" />
          <div className="space-y-1">
            <h2 className="text-lg font-display font-semibold text-[#141413]">
              Sign In to View Your Authenticated Orders
            </h2>
            <p className="text-xs text-[#6E6B64] max-w-md mx-auto">
              Your order ledger and shipping coordinates are protected by zero-trust Firestore isolation rules.
            </p>
          </div>
          <button
            type="button"
            onClick={onSignInRequest}
            className="px-5 py-2.5 bg-[#141413] text-white text-xs font-medium rounded-lg hover:bg-[#292826] cursor-pointer"
          >
            Sign In with Google
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 bg-white border border-[#E5E2DC] rounded-lg text-center space-y-3">
          <Truck className="w-10 h-10 stroke-[1.25] mx-auto text-[#8C887F]" />
          <h2 className="text-lg font-display font-semibold text-[#141413]">
            No Orders Recorded Yet
          </h2>
          <p className="text-xs text-[#6E6B64] max-w-sm mx-auto">
            Add architectural pieces to your shopping bag and complete checkout to track live shipment milestones here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((ord) => {
            const currentStepIdx = steps.indexOf(ord.status);
            const canCancel = ord.status === 'Confirmed' || ord.status === 'Processing';
            const canReturn = ord.status === 'Delivered';

            return (
              <div
                key={ord.id}
                className="p-6 bg-white border border-[#E5E2DC] rounded-lg space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E2DC] pb-4">
                  <div className="space-y-1">
                    <div className="text-xs text-[#6E6B64] font-mono">
                      <span>Order #{ord.id}</span>
                      <span className="mx-2" aria-hidden="true">·</span>
                      <span>Tracking: {ord.trackingNumber}</span>
                      <span className="mx-2" aria-hidden="true">·</span>
                      <span>{ord.deliveryOption.replace(/_/g, ' ')}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[#141413]">
                      {ord.itemsSummary}
                    </h3>
                    <div className="text-xs text-[#57554E]">
                      <span>Destination: {ord.shippingRegion}</span>
                      <span className="mx-2" aria-hidden="true">·</span>
                      <span>Payment: {ord.paymentMethod} ({ord.paymentStatus})</span>
                      <span className="mx-2" aria-hidden="true">·</span>
                      <span className="text-[#166534] inline-flex items-center gap-1">
                        <Leaf className="w-3 h-3" />
                        {ord.carbonOffsetKg} kg CO₂e Offset
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    <div className="text-lg font-mono font-semibold tabular-nums text-[#141413]">
                      {formatCurrency(ord.totalAmount, currency)}
                    </div>
                    <div className="flex items-center gap-2">
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => handleCustomerOrderAction(ord, 'Cancelled')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer whitespace-nowrap"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel Order
                        </button>
                      )}
                      {canReturn && (
                        <button
                          type="button"
                          onClick={() => handleCustomerOrderAction(ord, 'Return_Requested')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#141413] bg-[#F3F1EC] border border-[#E5E2DC] rounded-lg hover:bg-[#E5E2DC] cursor-pointer whitespace-nowrap"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Request Return / Refund
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Milestone Progress Pipeline */}
                {ord.status === 'Cancelled' ||
                ord.status === 'Return_Requested' ||
                ord.status === 'Refunded' ? (
                  <div className="p-3.5 bg-[#F3F1EC] rounded-lg text-xs font-medium text-[#141413]">
                    Order Lifecycle Status: {ord.status.replace(/_/g, ' ')} ({ord.paymentStatus})
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {steps.map((step, idx) => {
                      const reached = currentStepIdx >= idx;
                      return (
                        <div
                          key={step}
                          className={`p-3 rounded-lg border text-xs ${
                            reached
                              ? 'border-[#141413] bg-[#141413] text-white'
                              : 'border-[#E5E2DC] bg-[#FBFBF9] text-[#8C887F]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono">0{idx + 1}</span>
                            {reached && <CheckCircle2 className="w-3.5 h-3.5 text-[#D4A373]" />}
                          </div>
                          <div className="font-medium truncate">{step.replace(/_/g, ' ')}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ComparisonMatrixProps {
  comparedProducts: Product[];
  currency: CurrencyCode;
  onRemoveCompare: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number, variant: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  comparedProducts,
  currency,
  onRemoveCompare,
  onAddToCart,
  onSelectProduct,
}) => {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 space-y-8">
      <div className="border-b border-[#E5E2DC] pb-6">
        <div className="text-xs text-[#6E6B64]">
          <span>Technical Specification Matrix</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>Side-by-Side Architectural & Acoustic Evaluation</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-[#141413] mt-1">
          Product Comparison Matrix ({comparedProducts.length}/4)
        </h1>
      </div>

      {comparedProducts.length === 0 ? (
        <div className="p-12 bg-white border border-[#E5E2DC] rounded-lg text-center space-y-3">
          <p className="text-sm font-medium text-[#141413]">
            No Objects Selected for Technical Comparison
          </p>
          <p className="text-xs text-[#6E6B64]">
            Click the scale icon on any product card in the catalog to compare dimensions, sustainability scores, and acoustic/material specifications side-by-side.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E2DC] rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-[#E5E2DC]">
                <th className="p-5 w-48 text-xs font-semibold text-[#6E6B64] bg-[#FBFBF9]">
                  Specification Dimension
                </th>
                {comparedProducts.map((prod) => (
                  <th key={prod.id} className="p-5 border-l border-[#E5E2DC] align-top w-64">
                    <div className="space-y-3">
                      <div
                        onClick={() => onSelectProduct(prod)}
                        className="aspect-[4/3] w-full rounded overflow-hidden bg-[#F3F1EC] cursor-pointer"
                      >
                        <ResilientImage
                          src={prod.imageUrl}
                          alt={prod.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-[#6E6B64] font-normal">{prod.brand}</div>
                        <div className="text-sm font-semibold text-[#141413]">{prod.title}</div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => onAddToCart(prod, 1, 'Standard Atelier Finish')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141413] text-white text-xs font-medium rounded-lg hover:bg-[#292826] cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Add to Bag
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveCompare(prod.id)}
                          className="p-1.5 text-[#8C887F] hover:text-red-600 cursor-pointer"
                          aria-label="Remove from comparison"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DC] text-xs">
              <tr>
                <td className="p-4 font-medium text-[#57554E] bg-[#FBFBF9]">Collector Price</td>
                {comparedProducts.map((p) => (
                  <td
                    key={p.id}
                    className="p-4 border-l border-[#E5E2DC] font-mono tabular-nums font-semibold text-sm text-[#141413]"
                  >
                    {formatCurrency(p.price, currency)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-[#57554E] bg-[#FBFBF9]">Category & Taxonomy</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#E5E2DC] text-[#3F3E3A]">
                    {p.category} · {p.subcategory}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-[#57554E] bg-[#FBFBF9]">
                  Verified Collector Rating
                </td>
                {comparedProducts.map((p) => (
                  <td
                    key={p.id}
                    className="p-4 border-l border-[#E5E2DC] font-mono tabular-nums text-[#141413]"
                  >
                    ★ {p.rating} ({p.reviewCount} evaluations)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-[#57554E] bg-[#FBFBF9]">
                  Sustainability & Carbon Footprint
                </td>
                {comparedProducts.map((p) => (
                  <td
                    key={p.id}
                    className="p-4 border-l border-[#E5E2DC] font-mono tabular-nums text-[#166534]"
                  >
                    Eco Score {p.sustainabilityScore}/100 · {p.carbonFootprintKg} kg CO₂e
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-[#57554E] bg-[#FBFBF9]">
                  Material Provenance
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#E5E2DC] text-[#3F3E3A]">
                    {p.ecoMaterialTag}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-[#57554E] bg-[#FBFBF9]">
                  Technical Specifications
                </td>
                {comparedProducts.map((p) => (
                  <td
                    key={p.id}
                    className="p-4 border-l border-[#E5E2DC] text-[#3F3E3A] leading-relaxed"
                  >
                    {p.specsSummary}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-[#57554E] bg-[#FBFBF9]">
                  Atelier Availability
                </td>
                {comparedProducts.map((p) => (
                  <td
                    key={p.id}
                    className="p-4 border-l border-[#E5E2DC] font-mono tabular-nums text-[#141413]"
                  >
                    {p.stock} units in vault ({p.sellerName})
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
