import React, { useState } from 'react';
import { X, Sparkles, Send, ArrowUpRight, Tag } from 'lucide-react';
import { Product, CartItem, CurrencyCode } from '../types';
import { formatCurrency } from '../data/catalog';
import { ResilientImage } from './ResilientImage';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  recommendedProductIds?: string[];
  suggestedCoupon?: string;
}

interface AiConciergeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: Product[];
  cart: CartItem[];
  currency: CurrencyCode;
  userContext: string;
  onSelectProduct: (product: Product) => void;
  onApplyCoupon: (code: string) => void;
}

export const AiConciergeDrawer: React.FC<AiConciergeDrawerProps> = ({
  isOpen,
  onClose,
  catalog,
  cart,
  currency,
  userContext,
  onSelectProduct,
  onApplyCoupon,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Hi! I am your PrimeKart AI Shopping Assistant (like Amazon Rufus & Flipkart Flippi). Ask me to compare 5G smartphones, ANC headphones, espresso machines, or find the best coupon & EMI deals for your cart!',
      recommendedProductIds: ['prod_flagship_phone_01', 'prod_anc_headphones_02'],
      suggestedCoupon: 'AETHERIA15',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const cartSummary =
    cart.length > 0
      ? cart.map((c) => `${c.quantity}x ${c.product.title} ($${c.product.price})`).join(', ')
      : 'Empty bag';

  const handleSend = async (promptText?: string) => {
    const textToSend = (promptText ?? input).trim();
    if (!textToSend || loading) return;

    const nextHistory: ChatMessage[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(nextHistory);
    if (!promptText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: nextHistory.slice(-6),
          catalog,
          cartSummary,
          userContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Concierge temporarily unavailable');
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: data.reply || 'Here are my curated recommendations from the current collection.',
          recommendedProductIds: data.recommendedProductIds || [],
          suggestedCoupon: data.suggestedCoupon || '',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text:
            err instanceof Error
              ? `Concierge notice: ${err.message}`
              : 'Unable to reach AI Concierge right now.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="AI Shopping Concierge"
    >
      <div className="w-full max-w-md bg-[#FBFBF9] h-full flex flex-col border-l border-[#E5E2DC] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E5E2DC]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8A5A36]" />
            <span className="text-sm font-semibold text-[#141413]">
              Aetheria AI Shopping Concierge
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#57554E] hover:text-[#141413] rounded-lg cursor-pointer"
            aria-label="Close Concierge"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Curated Prompts */}
        <div className="px-6 py-3 bg-[#F3F1EC] border-b border-[#E5E2DC] flex items-center gap-2 overflow-x-auto">
          {[
            'Pair audio & seating for a sunlit loft',
            'Most sustainable carbon-negative gift',
            'Which coupon gives the highest discount?',
          ].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              className="px-3 py-1 text-xs bg-white border border-[#E5E2DC] rounded-md text-[#3F3E3A] hover:border-[#141413] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => {
            const recProducts = (msg.recommendedProductIds || [])
              .map((id) => catalog.find((p) => p.id === id))
              .filter((p): p is Product => Boolean(p));

            return (
              <div
                key={i}
                className={`space-y-2 ${
                  msg.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] p-4 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#141413] text-white'
                      : 'bg-white border border-[#E5E2DC] text-[#141413]'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.suggestedCoupon && (
                  <button
                    type="button"
                    onClick={() => onApplyCoupon(msg.suggestedCoupon!)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#F3F1EC] border border-[#D4A373] text-[#141413] rounded-lg hover:bg-[#E5E2DC] cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-[#8A5A36]" />
                    Apply Privilege Code: {msg.suggestedCoupon}
                  </button>
                )}

                {recProducts.length > 0 && (
                  <div className="w-full space-y-2 pt-1">
                    {recProducts.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => onSelectProduct(prod)}
                        className="flex items-center gap-3 p-2.5 bg-white border border-[#E5E2DC] rounded-lg hover:border-[#141413] transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded overflow-hidden bg-[#F3F1EC] shrink-0">
                          <ResilientImage
                            src={prod.imageUrl}
                            alt={prod.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-[#141413] truncate">
                            {prod.title}
                          </div>
                          <div className="text-xs font-mono tabular-nums text-[#6E6B64]">
                            {formatCurrency(prod.price, currency)} · Eco {prod.sustainabilityScore}/100
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#6E6B64] shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="p-3 bg-white border border-[#E5E2DC] rounded-lg text-xs text-[#6E6B64] w-fit">
              Consulting Atelier catalog & specifications...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-white border-t border-[#E5E2DC] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for spatial pairings, specs, or gift advice..."
            className="flex-1 px-3.5 py-2.5 text-xs border border-[#E5E2DC] rounded-lg focus:outline-none focus:border-[#141413]"
          />
          <button
            type="submit"
            disabled={loading}
            className="p-2.5 bg-[#141413] text-white rounded-lg hover:bg-[#292826] disabled:opacity-50 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
