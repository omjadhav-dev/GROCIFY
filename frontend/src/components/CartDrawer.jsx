import React, { useState } from 'react';
import { X, Trash2, ShoppingCart, CheckCircle2, AlertTriangle, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const CartDrawer = () => {
  const { isCartOpen, setIsCartOpen, cartItems, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice, groupedByWholesaler } = useCart();
  const { user } = useAuth();

  const [address, setAddress] = useState(user?.address || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (!address.trim()) return setError('Delivery address is required');
    setLoading(true);
    setError('');
    try {
      // Place one order per wholesaler
      const groups = Object.values(groupedByWholesaler);
      await Promise.all(
        groups.map((group) =>
          API.post('/orders', {
            wholesalerId: group.wholesalerId,
            deliveryAddress: address,
            note,
            items: group.items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId || undefined,
              quantity: i.quantity,
            })),
          })
        )
      );
      setSuccess(true);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    if (success) {
      setSuccess(false);
      setNote('');
    }
    setError('');
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-harvest-600" />
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Your Cart
              {totalItems > 0 && (
                <span className="ml-2 rounded-full bg-harvest-100 px-2 py-0.5 text-sm text-harvest-700">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
              )}
            </h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <CheckCircle2 size={56} className="text-leaf-600" />
            <h3 className="font-display text-xl font-semibold text-slate-900">Orders Placed!</h3>
            <p className="text-sm text-slate-500">
              Your orders have been sent to {Object.keys(groupedByWholesaler).length > 1 ? 'each wholesaler' : 'the wholesaler'} successfully.
            </p>
            <button className="btn-primary mt-2" onClick={handleClose}>Done</button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-400">
            <ShoppingCart size={48} strokeWidth={1.5} />
            <p className="font-medium">Your cart is empty</p>
            <p className="text-sm">Add products from the Browse Products page</p>
            <button className="btn-outline mt-2" onClick={handleClose}>Browse Products</button>
          </div>
        ) : (
          <>
            {/* Cart Items — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {Object.values(groupedByWholesaler).map((group) => (
                <div key={group.wholesalerId} className="mb-6">
                  {/* Wholesaler group header */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-semibold text-leaf-700">
                      {group.wholesalerName}
                    </span>
                    <span className="text-xs text-slate-400">
                      ₹{group.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Items in this group */}
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div key={item.key} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                        {/* Image */}
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-leaf-50 text-leaf-400 text-xs font-bold">
                            {item.name.charAt(0)}
                          </div>
                        )}

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-900">{item.name}</div>
                          {item.variantLabel && (
                            <div className="text-xs text-slate-400">{item.variantLabel}</div>
                          )}
                          {item.packSize && (
                            <div className="text-xs text-slate-400">{item.packSize}</div>
                          )}
                          <div className="mt-0.5 text-sm font-bold text-harvest-600">
                            ₹{(item.price * item.quantity).toFixed(2)}
                            <span className="ml-1 text-xs font-normal text-slate-400">
                              (₹{item.price}/{item.unit})
                            </span>
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            disabled={item.quantity <= item.minOrderQty}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            defaultValue={item.quantity}
                            key={item.quantity}
                            min={item.minOrderQty}
                            max={item.stock}
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (!val || val < item.minOrderQty) {
                                e.target.value = item.minOrderQty;
                                updateQuantity(item.key, item.minOrderQty);
                              } else {
                                updateQuantity(item.key, val);
                              }
                            }}
                            className="w-12 rounded-lg border border-slate-200 px-1 py-0.5 text-center text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-harvest-400"
                          />
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.key)}
                            className="ml-1 text-slate-300 hover:text-red-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Section */}
            <div className="border-t border-slate-100 px-6 py-4 space-y-3">
              {error && (
                <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  <AlertTriangle size={14} /> {error}
                </p>
              )}

              <div>
                <label className="form-label">Delivery Address *</label>
                <input
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter delivery address"
                />
              </div>
              <div>
                <label className="form-label">Note (optional)</label>
                <input
                  className="form-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any special instructions?"
                />
              </div>

              {/* Order summary */}
              <div className="rounded-xl bg-cream-100 px-4 py-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Total items</span>
                  <span>{totalItems}</span>
                </div>
                <div className="mt-1 flex justify-between text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                {Object.keys(groupedByWholesaler).length > 1 && (
                  <p className="mt-1 text-xs text-slate-400">
                    Will be split into {Object.keys(groupedByWholesaler).length} orders by wholesaler
                  </p>
                )}
              </div>

              <button
                className="btn-primary w-full"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Placing Orders...' : `Place Order${Object.keys(groupedByWholesaler).length > 1 ? 's' : ''} · ₹${totalPrice.toFixed(2)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;