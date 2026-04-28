"use client";

import React, { useEffect, useState } from 'react';
import { useCart } from '../../../context/CartContext';
import Link from 'next/link';

export function CartDrawer() {
  const { isDrawerOpen, setIsDrawerOpen, cart, updateQuantity, removeFromCart, subtotal } = useCart();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setIsClosing(false);
    }, 400);
  };

  const FREE_SHIPPING_THRESHOLD = 500;
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  if (!isDrawerOpen && !isClosing) return null;

  return (
    <div className={`cart-drawer-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`cart-drawer-content ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
        <header className="drawer-header">
          <h2 className="drawer-title">Your Bag ({cart.length})</h2>
          <button className="close-drawer" onClick={handleClose}>✕</button>
        </header>

        {subtotal > 0 && (
          <div className="shipping-progress-container">
            <div className="shipping-text">
              {remaining > 0 
                ? `You're ₹${remaining} away from free shipping` 
                : "You've unlocked free shipping!"}
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="drawer-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Your bag is empty.</p>
              <Link href="/rituals" className="cta-link" onClick={handleClose}>Explore Rituals</Link>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img" style={{ backgroundImage: `url(${item.image})` }} />
                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.name}</h3>
                  {item.variant && <span className="cart-item-variant">{item.variant}</span>}
                  <div className="cart-item-price">₹{item.price}</div>
                  <div className="cart-item-actions">
                    <div className="qty-control">
                      <button onClick={() => updateQuantity(item.id, -1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                    </div>
                    <button className="remove-item" onClick={() => removeFromCart(item.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <footer className="drawer-footer">
            <div className="footer-row">
              <span>Subtotal</span>
              <span className="footer-price">₹{subtotal}</span>
            </div>
            <p className="footer-note">Shipping and taxes calculated at checkout.</p>
            <Link href="/checkout" className="checkout-btn" onClick={handleClose}>
              Checkout — ₹{subtotal}
            </Link>
            <Link href="/cart" className="view-bag-link" onClick={handleClose}>View Bag</Link>
            
            <div className="payment-trust">
              <span className="secure-badge">Secure Checkout</span>
              <div className="payment-icons">
                <span title="UPI">UPI</span>
                <span title="Cards">Cards</span>
                <span title="Wallets">Wallets</span>
              </div>
            </div>
          </footer>
        )}
      </div>

      <style jsx>{`
        .cart-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          backdrop-filter: blur(4px);
          animation: fade-in 0.4s ease forwards;
        }

        .cart-drawer-overlay.closing {
          animation: fade-out 0.4s ease forwards;
        }

        .cart-drawer-content {
          width: 100%;
          max-width: 420px;
          background: #fff;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 30px rgba(0,0,0,0.1);
          animation: slide-in 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }

        .cart-drawer-content.closing {
          animation: slide-out 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }

        .drawer-header {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f0f0f0;
        }

        .drawer-title {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          color: #1a1816;
        }

        .close-drawer {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #8c8882;
        }

        .shipping-progress-container {
          padding: 20px 24px;
          background: #fbfbfb;
          border-bottom: 1px solid #f0f0f0;
        }

        .shipping-text {
          font-size: 0.85rem;
          color: #1a1816;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .progress-bar-bg {
          height: 4px;
          background: #eee;
          border-radius: 100px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: #d4a373;
          transition: width 0.6s ease;
        }

        .drawer-items {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .empty-cart {
          text-align: center;
          padding-top: 60px;
          color: #8c8882;
        }

        .cta-link {
          display: inline-block;
          margin-top: 16px;
          color: #d4a373;
          font-weight: 600;
          text-decoration: underline;
        }

        .cart-item {
          display: flex;
          gap: 16px;
        }

        .cart-item-img {
          width: 80px;
          height: 100px;
          background-size: cover;
          background-position: center;
          border-radius: 4px;
          background-color: #f9f9f9;
        }

        .cart-item-info {
          flex: 1;
        }

        .cart-item-name {
          font-weight: 600;
          font-size: 1rem;
          color: #1a1816;
          margin-bottom: 4px;
        }

        .cart-item-variant {
          display: block;
          font-size: 0.8rem;
          color: #8c8882;
          margin-bottom: 4px;
        }

        .cart-item-price {
          font-weight: 500;
          color: #1a1816;
          margin-bottom: 12px;
        }

        .cart-item-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .qty-control {
          display: flex;
          align-items: center;
          background: #f5f5f5;
          border-radius: 100px;
          padding: 4px;
        }

        .qty-control button {
          width: 24px;
          height: 24px;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a1816;
          font-weight: 600;
        }

        .qty-control span {
          width: 32px;
          text-align: center;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .remove-item {
          background: none;
          border: none;
          font-size: 0.75rem;
          color: #8c8882;
          text-decoration: underline;
          cursor: pointer;
        }

        .drawer-footer {
          padding: 24px;
          border-top: 1px solid #f0f0f0;
          background: #fff;
        }

        .footer-row {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 8px;
          color: #1a1816;
        }

        .footer-note {
          font-size: 0.8rem;
          color: #8c8882;
          margin-bottom: 24px;
        }

        .checkout-btn {
          display: block;
          width: 100%;
          background: #1a1816;
          color: #fff;
          text-align: center;
          padding: 16px;
          border-radius: 100px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-decoration: none;
          margin-bottom: 16px;
          transition: transform 0.2s ease;
        }

        .checkout-btn:hover {
          transform: scale(1.02);
        }

        .view-bag-link {
          display: block;
          text-align: center;
          color: #8c8882;
          font-size: 0.85rem;
          text-decoration: underline;
          margin-bottom: 24px;
        }

        .payment-trust {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #f9f9f9;
          padding-top: 16px;
        }

        .secure-badge {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #b0aca5;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .payment-icons {
          display: flex;
          gap: 12px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #b0aca5;
        }

        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @keyframes slide-out {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
