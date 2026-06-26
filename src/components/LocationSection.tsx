"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { BUSINESS } from "@/data/menu";
import {
  createDebouncedScrollRefresh,
  registerGsapPlugins,
} from "@/lib/gsap-client";
import { prefersReducedMotion } from "@/lib/cart-anchor";

export function LocationSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    registerGsapPlugins();

    if (prefersReducedMotion()) return;

    const debouncedRefresh = createDebouncedScrollRefresh(200);
    const section = sectionRef.current;
    if (!section) return;

    const reveals = gsap.utils.toArray<HTMLElement>(
      ".location-reveal",
      section,
    );
    if (reveals.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(reveals, { autoAlpha: 0, y: 50 });

      gsap.to(reveals, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "clamp(top 85%)",
          once: true,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    requestAnimationFrame(() => debouncedRefresh());

    return () => ctx.revert();
  }, []);

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.mapsQuery)}`;

  return (
    <section
      ref={sectionRef}
      id="ubicacion"
      className="relative bg-cinema-black py-20"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="location-reveal mb-10">
          <p className="text-[11px] uppercase tracking-[0.35em] text-neon">
            Encuéntranos
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,7vw,3.5rem)] uppercase leading-none text-white">
            Frente a Tiendas Ara
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="location-reveal overflow-hidden rounded-2xl border border-white/10 neon-border">
            <iframe
              title="Ubicación Granizados de Película"
              src={BUSINESS.mapsEmbed}
              className="h-[280px] w-full grayscale contrast-125 sm:h-[360px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="location-reveal flex flex-col justify-center rounded-2xl border border-white/10 bg-cinema-gray p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">
              {BUSINESS.city}
            </p>
            <p className="mt-4 text-xl font-semibold leading-snug text-white">
              {BUSINESS.address}
            </p>
            <p className="mt-4 text-sm text-white/55">{BUSINESS.hours}</p>

            <div className="mt-6 space-y-2 text-sm text-white/70">
              <p>
                WhatsApp:{" "}
                <a
                  href="https://wa.me/573107790328"
                  className="text-neon hover:underline"
                >
                  310 779 0328
                </a>
                {" · "}
                <a
                  href="https://wa.me/573177729038"
                  className="text-neon hover:underline"
                >
                  317 772 9038
                </a>
              </p>
            </div>

            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex w-fit items-center rounded-full border border-neon px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-white transition hover:bg-neon"
            >
              Abrir en Google Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
