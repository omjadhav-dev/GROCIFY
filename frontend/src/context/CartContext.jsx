import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('grocifyCart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('grocifyCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Each cart item shape:
  // { productId, variantId, name, image, price, unit, packSize,
  //   wholesalerId, wholesalerName, quantity, stock, minOrderQty }

  const addToCart = (product, variantId = null) => {
    const variant = variantId ? product.variants?.find((v) => v.id === variantId) : null;
    const price = variant ? variant.price : product.price;
    const stock = variant ? variant.stock : product.stock;
    const minOrderQty = variant ? variant.minOrderQty : product.minOrderQty || 1;
    const key = `${product.id}_${variantId ?? 'base'}`;

    setCartItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        // Increment by minOrderQty, cap at stock
        return prev.map((i) =>
          i.key === key
            ? { ...i, quantity: Math.min(i.quantity + minOrderQty, stock) }
            : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          variantId: variantId || null,
          name: product.name,
          variantLabel: variant?.label || null,
          image: product.image || '',
          price,
          unit: product.unit,
          packSize: product.packSize || '',
          wholesalerId: product.wholesaler?.id || product.wholesalerId,
          wholesalerName: product.wholesalerName || product.wholesaler?.name || '',
          quantity: minOrderQty,
          stock,
          minOrderQty,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (key, quantity) => {
    setCartItems((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        const clamped = Math.max(i.minOrderQty, Math.min(quantity, i.stock));
        return { ...i, quantity: clamped };
      })
    );
  };

  const removeFromCart = (key) => {
    setCartItems((prev) => prev.filter((i) => i.key !== key));
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const totalPrice = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Group items by wholesaler for split checkout
  const groupedByWholesaler = cartItems.reduce((acc, item) => {
    const key = item.wholesalerId;
    if (!acc[key]) acc[key] = { wholesalerId: item.wholesalerId, wholesalerName: item.wholesalerName, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalItems,
      totalPrice,
      groupedByWholesaler,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
};