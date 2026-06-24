"use client";

import { useEffect, useState } from "react";
import { buildWhatsAppUrl } from "@/data/menu";
import { useCart } from "@/context/CartContext";

const NAV_LINKS = [
  { href: "#menu", label: "Menú" },
  { href: "#ubicacion", label: "Ubicación" },
] as const;

export function Header() {
  const { totalItems, openCart, cartBadgePulse } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const whatsappUrl = buildWhatsAppUrl(
    "¡Hola! Quiero ordenar en Granizados de Película 🎬",
  );

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled || menuOpen
            ? "border-b border-white/5 bg-cinema-black/90 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="#inicio" className="flex flex-col" onClick={closeMenu}>
            <span className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.2em] text-white">
              Granizados
            </span>
            <span className="text-[10px] uppercase tracking-[0.35em] text-neon neon-text">
              de Película
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-[11px] uppercase tracking-[0.2em] text-white/70 md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-neon">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCart}
              data-cart-anchor
              className="relative rounded-full border border-white/15 px-3 py-2 text-[11px] uppercase tracking-wider text-white/80 transition hover:border-neon hover:text-neon"
              aria-label="Abrir carrito"
            >
              Carrito
              {totalItems > 0 && (
                <span
                  key={cartBadgePulse}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neon text-[10px] font-bold text-white animate-cart-bump"
                >
                  {totalItems}
                </span>
              )}
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full bg-neon px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white sm:inline-flex neon-border"
            >
              WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-neon md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {menuOpen ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M4 7h16a1 1 0 0 0 0-2H4a1 1 0 0 0 0 2zm0 5h16a1 1 0 0 0 0-2H4a1 1 0 0 0 0 2zm0 5h16a1 1 0 0 0 0-2H4a1 1 0 0 0 0 2z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className="fixed inset-x-0 top-[68px] z-40 border-b border-white/10 bg-cinema-black/95 px-4 py-6 backdrop-blur-md md:hidden"
        >
          <ul className="flex flex-col gap-4 text-sm uppercase tracking-[0.2em] text-white/80">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={closeMenu}
                  className="block py-2 transition hover:text-neon"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="inline-flex rounded-full bg-neon px-5 py-2.5 text-[11px] font-semibold text-white neon-border"
              >
                WhatsApp
              </a>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}
