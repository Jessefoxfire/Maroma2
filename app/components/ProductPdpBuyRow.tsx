"use client";

import { useState } from "react";

export function ProductPdpBuyRow() {
  const [qty, setQty] = useState(1);

  return (
    <div className="product-pdp-buy-row">
      <label className="product-pdp-qty">
        <span className="sr-only">Quantity</span>
        <input
          type="number"
          min={1}
          max={99}
          value={qty}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next) && next >= 1 && next <= 99) {
              setQty(next);
            }
          }}
        />
      </label>
      <div className="product-pdp-cta-group">
        <button type="button" className="button primary button-success product-pdp-cta-main">
          Add to cart
        </button>
        <button type="button" className="button primary button-success product-pdp-cta-main">
          Buy now
        </button>
        <button type="button" className="product-pdp-wish" aria-label="Add to wishlist">
          ♡
        </button>
      </div>
    </div>
  );
}
