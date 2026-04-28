"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProductRecord } from '../lib/product-types';

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: ProductRecord, variant?: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discount: number;
  setDiscount: (amount: number) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load cart from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('maroma-cart');
    const savedDiscount = localStorage.getItem('maroma-discount');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
    if (savedDiscount) {
      setDiscount(Number(savedDiscount));
    }
  }, []);

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('maroma-cart', JSON.stringify(cart));
    localStorage.setItem('maroma-discount', discount.toString());
  }, [cart, discount]);

  const addToCart = (product: ProductRecord, variant?: string) => {
    setCart(prev => {
      const price = typeof product.price === 'number' ? product.price : Number(product.price) || 0;
      const existing = prev.find(item => item.productId === product.id && item.variant === variant);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id && item.variant === variant
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: `${product.id}-${variant || 'default'}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price,
        image: product.imageUrl,
        quantity: 1,
        variant
      }];
    });
    setIsDrawerOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      totalItems,
      subtotal,
      discount,
      setDiscount,
      isDrawerOpen,
      setIsDrawerOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
