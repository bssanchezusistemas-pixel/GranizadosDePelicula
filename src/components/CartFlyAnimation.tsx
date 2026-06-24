"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/context/CartContext";
import { getCartAnchorRect } from "@/lib/cart-anchor";

export function CartFlyAnimation() {
  const { flyAnimation, completeFlyAnimation } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!flyAnimation) return;

    const timer = window.setTimeout(() => {
      completeFlyAnimation();
    }, 580);

    return () => window.clearTimeout(timer);
  }, [flyAnimation, completeFlyAnimation]);

  if (!mounted || !flyAnimation) return null;

  const target = getCartAnchorRect();
  if (!target) return null;

  const from = flyAnimation.from;
  const startX = from.left + from.width / 2;
  const startY = from.top + from.height / 2;
  const endX = target.left + target.width / 2;
  const endY = target.top + target.height / 2;
  const deltaX = endX - startX;
  const deltaY = endY - startY;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[80]"
      aria-hidden
    >
      <div
        key={flyAnimation.key}
        className="cart-fly-particle absolute flex h-9 w-9 items-center justify-center rounded-full bg-neon text-[11px] font-bold text-white shadow-[0_0_20px_rgba(255,0,51,0.65)]"
        style={
          {
            left: startX,
            top: startY,
            marginLeft: -18,
            marginTop: -18,
            "--fly-x": `${deltaX}px`,
            "--fly-y": `${deltaY}px`,
          } as CSSProperties
        }
      >
        +1
      </div>
    </div>,
    document.body,
  );
}
