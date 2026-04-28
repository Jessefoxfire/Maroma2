"use client";

import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';

export default function CheckoutClient() {
  const { cart, subtotal, discount, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    pincode: '',
    state: '',
    notifications: { email: true, whatsapp: true }
  });

  const discountAmount = subtotal * discount;
  const discountedSubtotal = subtotal - discountAmount;
  const SHIPPING_COST = discountedSubtotal >= 500 ? 0 : 50;
  const TOTAL = discountedSubtotal + SHIPPING_COST;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleNotification = (type: 'email' | 'whatsapp') => {
    setFormData(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [type]: !prev.notifications[type] }
    }));
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <main className="checkout-empty">
        <h1 className="empty-title">Your bag is empty</h1>
        <Link href="/rituals" className="text-link">← Return to Rituals</Link>
        <style jsx>{`
          .checkout-empty { text-align: center; padding: 100px 24px; }
          .empty-title { font-family: var(--font-serif); font-size: 2rem; margin-bottom: 24px; }
          .text-link { color: #d4a373; font-weight: 600; text-decoration: underline; }
        `}</style>
      </main>
    );
  }

  return (
    <main className="checkout-container">
      <div className="checkout-layout">
        {/* Left Side: Form */}
        <div className="checkout-main">
          {step === 1 && (
            <section className="checkout-step">
              <header className="step-header">
                <span className="step-num">1</span>
                <h2 className="step-title">Contact & Shipping</h2>
                <div className="guest-badge">Guest Checkout</div>
              </header>

              <div className="form-grid">
                <div className="form-group full">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="Enter email for order updates" 
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="notification-options">
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={formData.notifications.email} 
                      onChange={() => toggleNotification('email')}
                    />
                    <span className="checkmark"></span>
                    Get updates via Email
                  </label>
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={formData.notifications.whatsapp} 
                      onChange={() => toggleNotification('whatsapp')}
                    />
                    <span className="checkmark"></span>
                    Get updates via WhatsApp
                  </label>
                </div>

                <div className="form-group half">
                  <label>First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                </div>
                <div className="form-group half">
                  <label>Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                </div>
                <div className="form-group full">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" placeholder="+91" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="form-group full">
                  <label>Shipping Address</label>
                  <input type="text" name="address" placeholder="Flat, Floor, Street" value={formData.address} onChange={handleInputChange} />
                </div>
                <div className="form-group half">
                  <label>Pincode</label>
                  <input type="text" name="pincode" placeholder="605101" value={formData.pincode} onChange={handleInputChange} />
                </div>
                <div className="form-group half">
                  <label>City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} />
                </div>
              </div>

              <button className="primary-action" onClick={() => setStep(2)}>Continue to Payment</button>
            </section>
          )}

          {step === 2 && (
            <section className="checkout-step">
              <header className="step-header">
                <span className="step-num">2</span>
                <h2 className="step-title">Payment Method</h2>
              </header>

              <div className="payment-options">
                <div className="payment-choice active">
                  <div className="choice-header">
                    <input type="radio" checked readOnly />
                    <label>UPI (Google Pay, PhonePe, Paytm)</label>
                    <span className="india-badge">Recommended</span>
                  </div>
                  <div className="choice-content">
                    <p>You will be redirected to your UPI app to complete payment securely.</p>
                  </div>
                </div>

                <div className="payment-choice">
                  <div className="choice-header">
                    <input type="radio" disabled />
                    <label>Credit / Debit Card</label>
                  </div>
                </div>

                <div className="payment-choice">
                  <div className="choice-header">
                    <input type="radio" disabled />
                    <label>Net Banking</label>
                  </div>
                </div>
              </div>

              <div className="trust-boosters">
                <div className="trust-item">
                  <span className="icon">🔒</span>
                  <span>Secure 256-bit SSL Encrypted Payment</span>
                </div>
                <div className="trust-item">
                  <span className="icon">🚚</span>
                  <span>Arrives in 3–5 Business Days</span>
                </div>
              </div>

              <div className="action-row">
                <button className="secondary-action" onClick={() => setStep(1)}>Back</button>
                <button className="primary-action" onClick={() => { clearCart(); setStep(3); }}>Pay ₹{TOTAL}</button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="order-success">
              <div className="success-icon">✓</div>
              <h2 className="success-title">Order Placed Successfully!</h2>
              <p className="success-msg">Thank you for choosing Maroma. A confirmation has been sent to {formData.email} and {formData.phone} via WhatsApp.</p>
              <div className="order-details">
                <div className="detail-row">
                  <span>Order Number</span>
                  <span>#MRM-{Math.floor(Math.random() * 90000) + 10000}</span>
                </div>
                <div className="detail-row">
                  <span>Shipping to</span>
                  <span>{formData.firstName} {formData.lastName}, {formData.city}</span>
                </div>
              </div>
              <Link href="/rituals" className="primary-action">Return to Home</Link>
            </section>
          )}
        </div>

        {/* Right Side: Summary */}
        {step !== 3 && (
          <aside className="checkout-summary">
            <h3 className="summary-title">Order Summary</h3>
            <div className="summary-items">
              {cart.map(item => (
                <div key={item.id} className="summary-item">
                  <div className="summary-img" style={{ backgroundImage: `url(${item.image})` }} />
                  <div className="summary-info">
                    <div className="summary-name">{item.name}</div>
                    <div className="summary-qty">Qty: {item.quantity}</div>
                  </div>
                  <div className="summary-price">₹{item.price * item.quantity}</div>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="total-row discount">
                  <span>Ritual Discount (10%)</span>
                  <span>−₹{Math.round(discountAmount)}</span>
                </div>
              )}
              <div className="total-row">
                <span>Shipping</span>
                <span>{SHIPPING_COST === 0 ? <span className="free">FREE</span> : `₹${SHIPPING_COST}`}</span>
              </div>
              <div className="total-row grand">
                <span>Total</span>
                <span>₹{TOTAL}</span>
              </div>
            </div>

            <div className="brand-reassurance">
              <div className="brand-item">✓ 100% Vegan & Cruelty Free</div>
              <div className="brand-item">✓ Fair Trade Certified</div>
              <div className="brand-item">✓ Made in Auroville</div>
            </div>
          </aside>
        )}
      </div>

      <style jsx>{`
        .checkout-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 120px 40px 100px;
          min-height: 100vh;
        }

        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 80px;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
          position: relative;
        }

        .step-num {
          width: 32px;
          height: 32px;
          background: #1a1816;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .step-title {
          font-family: var(--font-serif);
          font-size: 1.75rem;
          color: #1a1816;
        }

        .guest-badge {
          font-size: 0.7rem;
          background: #f0f0f0;
          padding: 4px 10px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
          color: #8c8882;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }

        .form-group.full { grid-column: span 2; }
        
        .form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #8c8882;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group input {
          width: 100%;
          padding: 14px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus {
          border-color: #d4a373;
          outline: none;
        }

        .notification-options {
          grid-column: span 2;
          display: flex;
          gap: 40px;
          margin-bottom: 10px;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
          cursor: pointer;
          color: #1a1816;
        }

        .primary-action {
          background: #1a1816;
          color: #fff;
          padding: 18px 40px;
          border: none;
          border-radius: 100px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          cursor: pointer;
          width: 100%;
          transition: transform 0.2s ease;
        }

        .primary-action:hover { transform: translateY(-2px); }

        .payment-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }

        .payment-choice {
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
        }

        .payment-choice.active {
          border-color: #d4a373;
          background: rgba(212, 163, 115, 0.02);
        }

        .choice-header {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
        }

        .india-badge {
          background: #e8f5e9;
          color: #2e7d32;
          font-size: 0.65rem;
          padding: 2px 8px;
          border-radius: 4px;
          margin-left: auto;
        }

        .choice-content {
          margin-top: 12px;
          padding-left: 28px;
          font-size: 0.85rem;
          color: #8c8882;
        }

        .trust-boosters {
          display: flex;
          gap: 32px;
          margin-bottom: 40px;
          padding: 20px;
          background: #fbfbfb;
          border-radius: 12px;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #6b6661;
        }

        .action-row {
          display: flex;
          gap: 20px;
        }

        .secondary-action {
          background: none;
          border: 1px solid #e0e0e0;
          padding: 18px 32px;
          border-radius: 100px;
          font-weight: 600;
          cursor: pointer;
        }

        .checkout-summary {
          background: #fbfbfb;
          border-radius: 20px;
          padding: 40px;
          height: fit-content;
          position: sticky;
          top: 100px;
        }

        .summary-title {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          margin-bottom: 32px;
        }

        .summary-items {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 32px;
          border-bottom: 1px solid #eee;
          padding-bottom: 32px;
        }

        .summary-item {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .summary-img {
          width: 50px;
          height: 64px;
          background-size: cover;
          background-position: center;
          border-radius: 4px;
          background-color: #fff;
        }

        .summary-info { flex: 1; }
        .summary-name { font-size: 0.9rem; font-weight: 600; color: #1a1816; }
        .summary-qty { font-size: 0.8rem; color: #8c8882; }
        .summary-price { font-weight: 600; }

        .summary-totals {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 40px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
          color: #6b6661;
        }

        .total-row.discount {
          color: #7d9b8a;
          font-weight: 600;
        }

        .total-row.grand {
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 8px;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1816;
        }

        .free { color: #2e7d32; font-weight: 700; }

        .brand-reassurance {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .brand-item {
          font-size: 0.75rem;
          color: #b0aca5;
          font-weight: 600;
        }

        .order-success {
          text-align: center;
          padding: 40px 0;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: #7d9b8a;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          margin: 0 auto 32px;
        }

        .success-title {
          font-family: var(--font-serif);
          font-size: 2.5rem;
          margin-bottom: 16px;
        }

        .success-msg {
          color: #6b6661;
          margin-bottom: 40px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .order-details {
          background: #fbfbfb;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          margin: 0 auto 40px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
          font-size: 0.9rem;
        }

        .detail-row:last-child { border: none; }

        @media (max-width: 1024px) {
          .checkout-layout { grid-template-columns: 1fr; }
          .checkout-summary { position: static; }
        }

        @media (max-width: 768px) {
          .checkout-container { padding: 100px 20px 60px; }
          .form-grid { grid-template-columns: 1fr; }
          .form-group.full { grid-column: auto; }
          .notification-options { flex-direction: column; gap: 12px; }
        }
      `}</style>
    </main>
  );
}
