"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { AddToBagButton } from "./cart/AddToBagButton";

interface ScrollerItem {
  id?: string;
  label: string;
  description: string;
  image: string;
  color?: string;
  href?: string;
  product?: any; // Using any for now to avoid circular deps or complex imports, but will be ProductRecord
}

interface ProductScrollerProps {
  title?: string;
  subtitle?: string;
  items: ScrollerItem[];
  className?: string;
}

export const ProductScroller: React.FC<ProductScrollerProps> = ({ title, subtitle, items, className = "" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const atStart = el.scrollLeft <= 2;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;

    setIsAtStart(atStart);
    setIsAtEnd(atEnd);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [items]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;

    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeft(el.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;

    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    el.scrollLeft = scrollLeft - walk;
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  return (
    <section className={`scroller-section ${className}`}>
      {(title || subtitle) && (
        <div className="scroller-header">
          {title && <h2 className="scroller-title scroll-zoom">{title}</h2>}
          {subtitle && <p className="scroller-subtitle scroll-zoom">{subtitle}</p>}
        </div>
      )}

      <div className={`carousel-fade-wrapper ${isAtStart ? "at-start" : ""} ${isAtEnd ? "at-end" : ""}`}>
        <div className="carousel-edge-fade carousel-edge-fade-left" />
        <div className="carousel-edge-fade carousel-edge-fade-right" />
        <div className="scroller-viewport-container">
          <div 
            className="scroller-viewport" 
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            <div className="scroller-track">
              {items.map((item, index) => (
                <div key={index} className="scroller-card scroll-zoom">
                  <Link href={item.href || "#"} className="scroller-card-inner">
                    <div className="scroller-card-media" style={{ backgroundColor: item.color || "#f8f8f8" }}>
                      <img src={item.image} alt={item.label} loading="lazy" />
                    </div>
                    <div className="scroller-card-content">
                      <h3 className="scroller-card-label">{item.label}</h3>
                      <p className="scroller-card-desc">{item.description}</p>
                    </div>
                  </Link>
                  {item.product && (
                    <div className="scroller-card-actions" style={{ marginTop: "12px", padding: "0 4px" }}>
                      <AddToBagButton product={item.product} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
