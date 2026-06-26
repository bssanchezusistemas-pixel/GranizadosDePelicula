"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { BUSINESS, buildWhatsAppUrl } from "@/data/menu";
import {
  buildFrameSequence,
  getFrameUrl,
  getMobileFrameUrl,
  HERO_BG,
  TOTAL_MOBILE_FRAMES,
  TOTAL_SOURCE_FRAMES,
} from "@/data/heroFrames";
import {
  clampedScrollRange,
  createDebouncedScrollRefresh,
  createRafScheduler,
  getHeroScrollConfig,
  registerGsapPlugins,
} from "@/lib/gsap-client";

type FrameSource = "desktop" | "mobile";

function getCanvasDpr(isMobile: boolean): number {
  const raw = window.devicePixelRatio || 1;
  return isMobile ? Math.min(raw, 1.5) : Math.min(raw, 2);
}

function fitCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  dpr: number,
  mode: "cover" | "contain" = "cover",
  focalY = 0.5,
  fitScale = 1,
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
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, maxW, maxH);

  const scaleX = maxW / img.naturalWidth;
  const scaleY = maxH / img.naturalHeight;
  const baseScale =
    mode === "contain"
      ? Math.min(scaleX, scaleY)
      : Math.max(scaleX, scaleY);
  const scale = baseScale * fitScale;

  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = (maxW - w) / 2;
  const y =
    mode === "cover"
      ? focalY * (maxH - h)
      : (maxH - h) / 2;

  ctx.drawImage(img, x, y, w, h);
}

function preloadFrame(
  frameNumber: number,
  getUrl: (n: number) => string,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`No se pudo cargar frame ${frameNumber}`));
    img.src = getUrl(frameNumber);
  });
}

function getFrameSource(isMobile: boolean): FrameSource {
  return isMobile ? "mobile" : "desktop";
}

function getSourceConfig(source: FrameSource) {
  return source === "mobile"
    ? {
        total: TOTAL_MOBILE_FRAMES,
        getUrl: getMobileFrameUrl,
      }
    : {
        total: TOTAL_SOURCE_FRAMES,
        getUrl: getFrameUrl,
      };
}

function buildHeroTimeline(
  section: HTMLElement,
  pin: HTMLDivElement,
  headline: HTMLDivElement | null,
  config: ReturnType<typeof getHeroScrollConfig>,
  progressRef: React.RefObject<HTMLDivElement | null>,
) {
  const scrollRange = clampedScrollRange(config.scrollVh);
  const headlineFadePortion = 0.35 / (config.scrollVh / 100);

  const heroWords = gsap.utils.toArray<HTMLElement>(".hero-word", section);

  gsap.set(heroWords, { autoAlpha: 0, y: 60 });
  gsap.to(heroWords, {
    autoAlpha: 1,
    y: 0,
    duration: 1,
    stagger: 0.1,
    ease: "power4.out",
    delay: 0.15,
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      ...scrollRange,
      pin,
      pinSpacing: true,
      scrub: config.scrub,
      anticipatePin: 1,
      fastScrollEnd: config.isMobile,
      invalidateOnRefresh: true,
      ...(config.pinType ? { pinType: config.pinType } : {}),
      onUpdate: (self) => {
        if (progressRef.current) {
          progressRef.current.style.transform = `scale3d(${self.progress}, 1, 1)`;
        }
      },
    },
  });

  if (headline) {
    tl.to(
      headline,
      {
        autoAlpha: 0,
        y: -36,
        ease: "power2.out",
        duration: headlineFadePortion,
      },
      0,
    );
  }

  return tl;
}

export function HeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameIndexRef = useRef(0);
  const configRef = useRef(getHeroScrollConfig());
  const [ready, setReady] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const [staticHero, setStaticHero] = useState(false);

  useEffect(() => {
    registerGsapPlugins();

    let cancelled = false;
    let gsapCtx: gsap.Context | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let onResize: (() => void) | null = null;
    const debouncedRefresh = createDebouncedScrollRefresh(200);

    const initFramesHero = async (
      config: ReturnType<typeof getHeroScrollConfig>,
      saveData: boolean,
      source: FrameSource,
    ) => {
      const { total, getUrl } = getSourceConfig(source);
      const sequence = buildFrameSequence(config.frameStep, total, getUrl);

      const first = await preloadFrame(sequence[0], getUrl);
      if (cancelled) return;

      imagesRef.current = [first];
      setLoadPct(Math.round((1 / sequence.length) * 100));

      const canvas = canvasRef.current;
      if (canvas) {
        fitCanvas(
          canvas,
          first,
          getCanvasDpr(config.isMobile),
          config.fitMode,
          config.focalY,
          config.fitScale,
        );
      }

      setReady(true);

      const draw = (index: number) => {
        const frameNum = sequence[index];
        const canvasEl = canvasRef.current;
        if (frameNum === undefined || !canvasEl) return;

        let img = imagesRef.current[index];
        if (!img?.complete) {
          void preloadFrame(frameNum, getUrl)
            .then((loaded) => {
              if (cancelled) return;
              imagesRef.current[index] = loaded;
              if (frameIndexRef.current === index) {
                const cfg = configRef.current;
                fitCanvas(
                  canvasEl,
                  loaded,
                  getCanvasDpr(cfg.isMobile),
                  cfg.fitMode,
                  cfg.focalY,
                  cfg.fitScale,
                );
              }
            })
            .catch(() => {});
          img = imagesRef.current[frameIndexRef.current] ?? imagesRef.current[0];
        }

        if (!img?.complete) return;

        const cfg = configRef.current;
        fitCanvas(
          canvasEl,
          img,
          getCanvasDpr(cfg.isMobile),
          cfg.fitMode,
          cfg.focalY,
          cfg.fitScale,
        );
      };

      const scheduleDraw = createRafScheduler((index: number) => {
        frameIndexRef.current = index;
        draw(index);
      });

      const rest = sequence.slice(1);
      const priority = rest.slice(0, 20);
      const background = rest.slice(20);

      await Promise.all(
        priority.map(async (frameNum, idx) => {
          const img = await preloadFrame(frameNum, getUrl);
          if (cancelled) return;
          imagesRef.current[idx + 1] = img;
        }),
      ).catch(() => {});

      if (!cancelled) {
        setLoadPct(Math.round(((Math.min(21, sequence.length)) / sequence.length) * 100));
      }

      background.forEach((frameNum, idx) => {
        preloadFrame(frameNum, getUrl)
          .then((img) => {
            if (cancelled) return;
            imagesRef.current[idx + 21] = img;
            const loaded = imagesRef.current.filter(Boolean).length;
            setLoadPct(Math.round((loaded / sequence.length) * 100));
          })
          .catch(() => {});
      });

      onResize = () => {
        configRef.current = getHeroScrollConfig(window.innerWidth, saveData);
        draw(frameIndexRef.current);
        debouncedRefresh();
      };

      window.addEventListener("resize", onResize, { passive: true });

      const canvasParent = canvasRef.current?.parentElement;
      if (canvasParent && typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          draw(frameIndexRef.current);
        });
        resizeObserver.observe(canvasParent);
      }

      if (cancelled) return;

      gsapCtx = gsap.context(() => {
        const section = sectionRef.current;
        const pin = pinRef.current;
        const headline = headlineRef.current;
        if (!section || !pin) return;

        const state = { frame: 0 };

        const tl = buildHeroTimeline(
          section,
          pin,
          headline,
          config,
          progressRef,
        );

        tl.to(
          state,
          {
            frame: sequence.length - 1,
            ease: "none",
            duration: 1,
            onUpdate: () => {
              const index = Math.round(state.frame);
              if (index !== frameIndexRef.current) {
                scheduleDraw(index);
              }
            },
          },
          0,
        );
      }, sectionRef);

      requestAnimationFrame(() => debouncedRefresh());
    };

    const init = async () => {
      const saveData =
        typeof navigator !== "undefined" &&
        "connection" in navigator &&
        (navigator as Navigator & { connection?: { saveData?: boolean } })
          .connection?.saveData === true;

      const config = getHeroScrollConfig(window.innerWidth, saveData);
      configRef.current = config;
      const source = getFrameSource(config.isMobile);
      const { total, getUrl } = getSourceConfig(source);

      if (config.reducedMotion) {
        setStaticHero(true);
        const lastFrame = await preloadFrame(total, getUrl);
        if (cancelled) return;

        imagesRef.current = [lastFrame];
        const canvas = canvasRef.current;
        if (canvas) {
          fitCanvas(
            canvas,
            lastFrame,
            getCanvasDpr(config.isMobile),
            config.fitMode,
            config.focalY,
            config.fitScale,
          );
        }
        setReady(true);
        return;
      }

      await initFramesHero(config, saveData, source);
    };

    init();

    return () => {
      cancelled = true;
      if (onResize) window.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();
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
      className={`relative bg-cinema-black ${staticHero ? "min-h-[100svh] supports-[height:100dvh]:min-h-[100dvh]" : ""}`}
    >
      <div
        ref={pinRef}
        className="hero-pin relative h-[100svh] w-full overflow-hidden supports-[height:100dvh]:h-[100dvh]"
      >
        <div
          className="pointer-events-none absolute inset-0 hidden bg-cover bg-center opacity-30 md:block"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,51,0.12)_0%,transparent_60%)]" />

        <div className="absolute inset-0 z-10 overflow-hidden">
          <canvas
            ref={canvasRef}
            className={`hero-canvas block h-full w-full transition-opacity duration-500 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Animación de hamburguesa armándose al hacer scroll"
          />
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
            className="hero-word mt-4 hidden w-fit items-center rounded-full border border-neon bg-neon/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white neon-border transition hover:bg-neon md:mt-6 md:inline-flex md:px-6 md:py-3 md:text-sm"
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
                  className="hero-progress h-full origin-left bg-neon shadow-[0_0_12px_#ff0033]"
                  style={{ transform: "scale3d(0, 1, 1)" }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
