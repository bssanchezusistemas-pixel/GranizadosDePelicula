"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import {
  formatCOP,
  getLinePrice,
  type CartAdditionItem,
  type MenuItem,
  type MenuItemSize,
} from "@/data/menu";

const DEFAULT_EXCLUSION_PRESETS = [
  "Cebolla",
  "Ripio de papa",
  "Salsas de la casa",
  "Tomate",
  "Lechuga",
  "Queso",
  "Huevos de codorniz",
  "Piña",
  "Maíz",
  "Picante",
];

const EXCLUSION_SEPARATOR_REGEX = /[,;\n]|\s+(?:y|e|ni|o|u)\s+/i;

function stripAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ñ/g, "n");
}

function normalizeExclusion(raw: string): string {
  const trimmed = raw.trim();
  const withoutSin = trimmed
    .replace(/^(?:sin|no)\b[\s:,-]*/i, "")
    .replace(/^[\s:,-.]+/, "")
    .replace(/[\s:,-.]+$/, "")
    .trim();
  if (!withoutSin) return "";

  const cleanLower = withoutSin.toLowerCase();
  const stripped = stripAccents(withoutSin);

  // Exact or diacritic-free match against presets
  const presetMatch = DEFAULT_EXCLUSION_PRESETS.find(
    (p) => stripAccents(p) === stripped,
  );
  if (presetMatch) return presetMatch;

  // Common colloquial shorthand, plurals & synonyms for presets
  if (cleanLower === "cebollas") return "Cebolla";
  if (cleanLower === "tomates") return "Tomate";
  if (cleanLower === "quesos") return "Queso";
  if (cleanLower === "lechugas") return "Lechuga";
  if (cleanLower.includes("ripio")) return "Ripio de papa";
  if (
    cleanLower === "salsa" ||
    cleanLower === "salsas" ||
    cleanLower === "salsa de la casa" ||
    cleanLower === "salsas de la casa"
  ) {
    return "Salsas de la casa";
  }
  if (
    cleanLower === "huevo" ||
    cleanLower === "huevos" ||
    cleanLower.includes("codorniz")
  ) {
    return "Huevos de codorniz";
  }
  if (
    cleanLower === "maicito" ||
    cleanLower === "maicitos" ||
    cleanLower === "choclo"
  ) {
    return "Maíz";
  }
  if (
    cleanLower === "aji" ||
    cleanLower === "ají" ||
    cleanLower === "chile" ||
    cleanLower === "pique"
  ) {
    return "Picante";
  }

  return withoutSin.charAt(0).toUpperCase() + withoutSin.slice(1).toLowerCase();
}

interface ProductCustomizationModalProps {
  item: MenuItem;
  initialSize?: MenuItemSize;
  availableAdditions?: MenuItem[];
  accentColor?: string;
  onClose: () => void;
  onConfirm: (customization: {
    selectedSize?: MenuItemSize;
    adiciones: CartAdditionItem[];
    exclusiones: string[];
    notas?: string;
    flyFrom?: DOMRect;
  }) => void;
}

export function ProductCustomizationModal({
  item,
  initialSize,
  availableAdditions = [],
  accentColor = "#ff0033",
  onClose,
  onConfirm,
}: ProductCustomizationModalProps) {
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | undefined>(
    initialSize ?? item.sizes?.[0],
  );
  const [selectedAdditions, setSelectedAdditions] = useState<CartAdditionItem[]>([]);
  const [selectedExclusions, setSelectedExclusions] = useState<string[]>([]);
  const [customExclusionInput, setCustomExclusionInput] = useState("");
  const [notes, setNotes] = useState("");
  const [imgError, setImgError] = useState(false);

  // Lock background scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const hasSizes = Boolean(item.sizes && item.sizes.length > 1);
  const displayPrice = getLinePrice(item, selectedSize, selectedAdditions);
  const hasValidImage = Boolean(item.image && item.image.trim().length > 0 && !imgError);

  // Filter out the item itself if it happens to be in the additions category, deduplicating names
  const additionsList = availableAdditions
    .filter(
      (add) =>
        add.id !== item.id &&
        add.name.trim().toLowerCase() !== item.name.trim().toLowerCase(),
    )
    .filter(
      (add, index, self) =>
        index ===
        self.findIndex(
          (other) =>
            other.name.trim().toLowerCase() === add.name.trim().toLowerCase(),
        ),
    );

  function toggleAddition(addition: MenuItem) {
    setSelectedAdditions((prev) => {
      const exists = prev.some(
        (a) => a.name.toLowerCase() === addition.name.trim().toLowerCase(),
      );
      if (exists) {
        return prev.filter(
          (a) => a.name.toLowerCase() !== addition.name.trim().toLowerCase(),
        );
      }
      return [
        ...prev,
        {
          name: addition.name.trim(),
          price: addition.price ?? addition.sizes?.[0]?.price ?? 0,
        },
      ];
    });
  }

  function toggleExclusion(rawName: string) {
    const name = normalizeExclusion(rawName);
    if (!name) return;
    setSelectedExclusions((prev) => {
      const exists = prev.some((e) => e.toLowerCase() === name.toLowerCase());
      if (exists) {
        return prev.filter((e) => e.toLowerCase() !== name.toLowerCase());
      }
      return [...prev, name];
    });
  }

  function addCustomExclusion() {
    const raw = customExclusionInput.trim();
    if (!raw) return;
    const tokens = raw
      .split(EXCLUSION_SEPARATOR_REGEX)
      .map((t) => normalizeExclusion(t))
      .filter(Boolean);
    setCustomExclusionInput("");
    if (tokens.length === 0) return;
    setSelectedExclusions((prev) => {
      const next = [...prev];
      for (const token of tokens) {
        if (!next.some((e) => e.toLowerCase() === token.toLowerCase())) {
          next.push(token);
        }
      }
      return next;
    });
  }

  function handleConfirm(e: React.MouseEvent<HTMLButtonElement>) {
    // If user typed something in custom exclusion without pressing '+', add it
    let finalExclusions = [...selectedExclusions];
    const pending = customExclusionInput.trim();
    if (pending) {
      const tokens = pending
        .split(EXCLUSION_SEPARATOR_REGEX)
        .map((t) => normalizeExclusion(t))
        .filter(Boolean);
      for (const token of tokens) {
        if (!finalExclusions.some((e) => e.toLowerCase() === token.toLowerCase())) {
          finalExclusions.push(token);
        }
      }
    }

    onConfirm({
      selectedSize,
      adiciones: selectedAdditions,
      exclusiones: finalExclusions,
      notas: notes.trim() || undefined,
      flyFrom: e.currentTarget?.getBoundingClientRect?.() ?? undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customization-modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar modal"
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card */}
      <div
        className="relative z-10 flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-cinema-dark shadow-2xl sm:max-h-[88vh] sm:rounded-3xl"
        style={
          {
            "--item-accent": accentColor,
          } as CSSProperties
        }
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-cinema-black">
              {hasValidImage ? (
                <Image
                  src={item.image!}
                  alt={item.name}
                  fill
                  className="object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">
                  🎬
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3
                id="customization-modal-title"
                className="font-[family-name:var(--font-display)] text-base uppercase leading-tight text-white truncate sm:text-lg"
              >
                {item.name}
              </h3>
              <p className="mt-0.5 text-xs font-semibold text-neon">
                {formatCOP(displayPrice)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white"
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 space-y-6 overflow-y-auto px-5 py-5 scrollbar-hide">
          {item.description && (
            <p className="text-xs leading-relaxed text-white/60">
              {item.description}
            </p>
          )}

          {/* 1. Selector de tamaño */}
          {hasSizes && item.sizes && (
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                  1. Selecciona el tamaño
                </label>
                <span className="text-[10px] text-neon uppercase font-medium">
                  Obligatorio
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {item.sizes.map((size) => {
                  const isActive = selectedSize?.label === size.label;
                  return (
                    <button
                      key={size.label}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={isActive}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                        isActive
                          ? "border-neon bg-neon/15 shadow-sm"
                          : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/30 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wide text-white">
                        {size.label}
                      </span>
                      <span
                        className={`text-[11px] ${
                          isActive ? "font-bold text-neon" : "text-white/50"
                        }`}
                      >
                        {formatCOP(size.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Adiciones opcionales */}
          {additionsList.length > 0 && (
            <div>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                  {hasSizes ? "2." : "1."} Adiciones opcionales
                </label>
                <span className="text-[10px] text-white/40">
                  Selección múltiple
                </span>
              </div>
              <p className="mb-2.5 text-[11px] text-white/45">
                Suma adiciones a tu preparación con su valor adicional:
              </p>
              <div className="flex flex-wrap gap-2">
                {additionsList.map((addition) => {
                  const isSelected = selectedAdditions.some(
                    (a) =>
                      a.name.toLowerCase() === addition.name.trim().toLowerCase(),
                  );
                  const addPrice =
                    addition.price ?? addition.sizes?.[0]?.price ?? 0;
                  return (
                    <button
                      key={addition.id}
                      type="button"
                      onClick={() => toggleAddition(addition)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                        isSelected
                          ? "border-neon bg-neon/20 font-medium text-white shadow-sm"
                          : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      <span
                        className={
                          isSelected ? "text-neon font-bold" : "text-white/40"
                        }
                      >
                        {isSelected ? "✓" : "+"}
                      </span>
                      <span>{addition.name}</span>
                      {addPrice > 0 && (
                        <span
                          className={`text-[11px] ${
                            isSelected ? "text-neon font-semibold" : "text-white/45"
                          }`}
                        >
                          (+{formatCOP(addPrice)})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Ingredientes a excluir ("Sin...") */}
          <div>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                {hasSizes && additionsList.length > 0
                  ? "3."
                  : hasSizes || additionsList.length > 0
                  ? "2."
                  : "1."}{" "}
                Ingredientes a quitar (&ldquo;Sin...&rdquo;)
              </label>
              <span className="text-[10px] text-white/40">Opcional</span>
            </div>
            <p className="mb-2.5 text-[11px] text-white/45">
              Marca los ingredientes que prefieres que tu preparación NO lleve:
            </p>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {DEFAULT_EXCLUSION_PRESETS.map((preset) => {
                const isExcluded = selectedExclusions.some(
                  (e) => e.toLowerCase() === preset.toLowerCase(),
                );
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => toggleExclusion(preset)}
                    aria-pressed={isExcluded}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                      isExcluded
                        ? "border-amber-500/60 bg-amber-500/20 font-semibold text-amber-200"
                        : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <span
                      className={
                        isExcluded
                          ? "text-amber-400 font-bold"
                          : "text-white/40"
                      }
                    >
                      {isExcluded ? "✕" : "−"}
                    </span>
                    Sin {preset}
                  </button>
                );
              })}
            </div>

            {/* Custom exclusion input */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={customExclusionInput}
                onChange={(e) => setCustomExclusionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomExclusion();
                  }
                }}
                autoComplete="off"
                placeholder="Otro ingrediente a quitar (ej. pepinillo, mayonesa...)"
                className="flex-1 rounded-xl border border-white/10 bg-cinema-black px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:border-neon focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustomExclusion}
                disabled={!customExclusionInput.trim()}
                className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 transition hover:border-neon hover:text-neon disabled:cursor-not-allowed disabled:opacity-30"
              >
                + Quitar
              </button>
            </div>

            {/* Active custom exclusions */}
            {selectedExclusions.filter(
              (exc) =>
                !DEFAULT_EXCLUSION_PRESETS.some(
                  (p) => p.toLowerCase() === exc.toLowerCase(),
                ),
            ).length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {selectedExclusions
                  .filter(
                    (exc) =>
                      !DEFAULT_EXCLUSION_PRESETS.some(
                        (p) => p.toLowerCase() === exc.toLowerCase(),
                      ),
                  )
                  .map((custom) => (
                    <button
                      key={custom}
                      type="button"
                      onClick={() => toggleExclusion(custom)}
                      className="flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/30"
                      title="Eliminar exclusión"
                    >
                      <span>Sin {custom}</span>
                      <span className="text-amber-400 font-bold ml-0.5">✕</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* 4. Cuadro de texto libre (Notas) */}
          <div>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                Instrucciones especiales / Notas
              </label>
              {notes.length > 0 && (
                <span className="text-[10px] text-white/40">
                  {notes.length}/250
                </span>
              )}
            </div>
            <p className="mb-2 text-[11px] text-white/45">
              ¿Alguna indicación adicional para la preparación de tu pedido?
            </p>
            <textarea
              rows={2}
              maxLength={250}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Salsas aparte, tocineta bien tostada, poco dulce, etc."
              className="w-full resize-none rounded-xl border border-white/10 bg-cinema-black px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-neon focus:outline-none"
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center gap-3 border-t border-white/10 bg-cinema-dark/95 p-4 backdrop-blur sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white/60 transition hover:border-white/30 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={hasSizes && !selectedSize}
            className="flex-1 rounded-full bg-neon py-3.5 text-xs font-black uppercase tracking-[0.15em] text-white shadow-lg neon-border transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Agregar al pedido · {formatCOP(displayPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}
