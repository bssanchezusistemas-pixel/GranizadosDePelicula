"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BUSINESS, buildWhatsAppUrl } from "@/data/menu";
import {
  buildFrameSequence,
  getFrameStep,
  getFrameUrl,
  HERO_BG,
  TOTAL_SOURCE_FRAMES,
} from "@/data/heroFrames";
import { prefersReducedMotion } from "@/lib/cart-anchor";

function getCanvasDpr(isMobile: boolean): number {
  const raw = window.devicePixelRatio || 1;
  return isMobile ? Math.min(raw, 1.5) : Math.min(raw, 2);
}

function fitCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  dpr: number,
  mode: "cover" | "contain" = "cover",
) {
  const parent = canvas.parentElement;
  if (!parent) return;

  const maxW = parent.clientWidth;
  const maxH = parent.clientHeight;
  if (maxW <= 0 || maxH <= 0) return;

  canvas.width = maxW * dpr;
  canvas.height = maxH * dpr;
  canvas.style.width = `${maxW}px`;
  canvas.style.height = `${maxH}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, maxW, maxH);

  const scaleX = maxW / img.naturalWidth;
  const scaleY = maxH / img.naturalHeight;
  const scale =
    mode === "contain"
      ? Math.min(scaleX, scaleY)
      : Math.max(scaleX, scaleY);

  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = (maxW - w) / 2;
  const y = (maxH - h) / 2;

  ctx.drawImage(img, x, y, w, h);
  return ctx;
}

function preloadFrame(frameNumber: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`No se pudo cargar frame ${frameNumber}`));
    img.src = getFrameUrl(frameNumber);
  });
}

export function HeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameIndexRef = useRef(0);
  const isMobileRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const [staticHero, setStaticHero] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    let cancelled = false;
    let resizeHandler: (() => void) | null = null;
    let gsapCtx: gsap.Context | null = null;

    const init = async () => {
      const saveData =
        typeof navigator !== "undefined" &&
        "connection" in navigator &&
        (navigator as Navigator & { connection?: { saveData?: boolean } })
          .connection?.saveData === true;

      const isMobile =
        typeof window !== "undefined" && window.innerWidth < 768;
      isMobileRef.current = isMobile;
      const reducedMotion = prefersReducedMotion();
      const canvasDpr = getCanvasDpr(isMobile);
      const fitMode = isMobile ? "contain" : "cover";

      if (reducedMotion) {
        setStaticHero(true);
        const lastFrame = await preloadFrame(TOTAL_SOURCE_FRAMES);
        if (cancelled) return;

        imagesRef.current = [lastFrame];
        const canvas = canvasRef.current;
        if (canvas) {
          fitCanvas(canvas, lastFrame, canvasDpr, fitMode);
        }
        setReady(true);
        return;
      }

      const step = getFrameStep(isMobile, saveData);
      const sequence = buildFrameSequence(step);

      const first = await preloadFrame(sequence[0]);
      if (cancelled) return;

      imagesRef.current = [first];
      setLoadPct(Math.round((1 / sequence.length) * 100));

      const canvas = canvasRef.current;
      if (canvas) {
        fitCanvas(canvas, first, canvasDpr, fitMode);
      }

      setReady(true);
      requestAnimationFrame(() => ScrollTrigger.refresh());

      const rest = sequence.slice(1);
      rest.forEach((frameNum, idx) => {
        preloadFrame(frameNum)
          .then((img) => {
            if (cancelled) return;
            imagesRef.current[idx + 1] = img;
            setLoadPct(
              Math.round(((idx + 2) / sequence.length) * 100),
            );
          })
          .catch(() => {});
      });

      const draw = (index: number) => {
        const img = imagesRef.current[index];
        const canvasEl = canvasRef.current;
        if (!img?.complete || !canvasEl) return;
        const mode = isMobileRef.current ? "contain" : "cover";
        const dpr = getCanvasDpr(isMobileRef.current);
        fitCanvas(canvasEl, img, dpr, mode);
      };

      resizeHandler = () => {
        isMobileRef.current = window.innerWidth < 768;
        draw(frameIndexRef.current);
      };
      window.addEventListener("resize", resizeHandler);

      gsapCtx = gsap.context(() => {
        const state = { frame: 0 };
        const scrollEnd = isMobile ? "+=150%" : "+=180%";

        gsap.to(state, {
          frame: sequence.length - 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: scrollEnd,
            pin: pinRef.current,
            scrub: isMobile ? 1 : 0.6,
            anticipatePin: 1,
            fastScrollEnd: isMobile,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (progressRef.current) {
                progressRef.current.style.transform = `scaleX(${self.progress})`;
              }
            },
          },
          onUpdate: () => {
            const index = Math.round(state.frame);
            if (index !== frameIndexRef.current) {
              frameIndexRef.current = index;
              draw(index);
            }
          },
        });

        gsap.to(headlineRef.current, {
          opacity: 0,
          y: -36,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=35%",
            scrub: true,
          },
        });

        gsap.from(".hero-word", {
          y: 60,
          opacity: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power4.out",
          delay: 0.15,
        });
      }, sectionRef);
    };

    init();

    return () => {
      cancelled = true;
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      gsapCtx?.revert();
    };
  }, []);

  const whatsappUrl = buildWhatsAppUrl(
    "¡Hola! Quiero ordenar en Granizados de Película 🎬",
  );

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className={`relative bg-cinema-black ${staticHero ? "min-h-0" : "min-h-[280vh]"}`}
    >
      <div
        ref={pinRef}
        className="relative h-[100dvh] min-h-[100svh] w-full overflow-hidden"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,51,0.12)_0%,transparent_60%)]" />

        <div className="absolute inset-0 z-10">
          <div className="absolute inset-x-0 top-[clamp(6.75rem,21vh,9.5rem)] bottom-[clamp(5.25rem,15vh,7.5rem)] md:inset-0">
            <canvas
              ref={canvasRef}
              className={`block h-full w-full transition-opacity duration-500 ${
                ready ? "opacity-100" : "opacity-0"
              }`}
              aria-label="Animación de hamburguesa armándose al hacer scroll"
            />
          </div>
          {!ready && (
            <p className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.3em] text-white/40">
              Cargando escena… {loadPct}%
            </p>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(to_bottom,rgba(10,10,10,0.75)_0%,transparent_28%,transparent_62%,rgba(10,10,10,0.9)_100%)]" />

        <div
          ref={headlineRef}
          className="absolute inset-x-0 top-0 z-30 px-5 pt-20 sm:px-6 sm:pt-24"
        >
          <p className="hero-word mb-2 text-[10px] uppercase tracking-[0.35em] text-neon-soft sm:text-[11px]">
            {BUSINESS.city}
          </p>
          <h1 className="hero-word max-w-[14ch] font-[family-name:var(--font-display)] text-[clamp(1.75rem,7vw,3.5rem)] uppercase leading-[0.92] tracking-tight text-white">
            {BUSINESS.headline}
          </h1>
          <p className="hero-word mt-2 max-w-xs text-xs leading-relaxed text-white/65 sm:mt-3 sm:max-w-sm sm:text-sm">
            {BUSINESS.subheadline}
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hero-word mt-4 inline-flex w-fit items-center rounded-full border border-neon bg-neon/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white neon-border transition hover:bg-neon sm:mt-6 sm:px-6 sm:py-3 sm:text-sm"
          >
            Ordenar por WhatsApp
          </a>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:px-6">
          {!staticHero && (
            <>
              <p className="mb-3 text-center text-[10px] uppercase tracking-[0.3em] text-white/40">
                Desliza para armar la burger
              </p>
              <div className="mb-2 flex justify-between text-[10px] uppercase tracking-widest text-white/40">
                <span>Escena 01</span>
                <span>Armando</span>
              </div>
              <div className="h-[2px] overflow-hidden rounded-full bg-white/10">
                <div
                  ref={progressRef}
                  className="h-full origin-left bg-neon shadow-[0_0_12px_#ff0033]"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
