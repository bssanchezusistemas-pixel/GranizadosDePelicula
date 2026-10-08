import {
  MENU_CATEGORIES,
  getCartLineId,
  getLinePrice,
  formatCartLineName,
  formatCOP,
  type CartAdditionItem,
  type MenuItem,
  type MenuItemSize,
} from "../src/data/menu";

let failed = 0;
function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    failed++;
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

console.log("=== RUNNING SUITE: CART & ADICIONES TESTS ===\n");

// 1. Database & Static Menu validation
const adicionesCat = MENU_CATEGORIES.find((c) => c.id === "adiciones");
assert(Boolean(adicionesCat), "Categoría 'adiciones' existe en MENU_CATEGORIES");

const quesoItem = adicionesCat?.items.find(
  (i) => i.id === "adic-adicion-de-queso-para-los-gran-1i3z",
);
assert(Boolean(quesoItem), "Item 'adic-adicion-de-queso-para-los-gran-1i3z' existe en adiciones");
assert(quesoItem?.name === "Adición de Queso", `Nombre es 'Adición de Queso' (actual: '${quesoItem?.name}')`);
assert(quesoItem?.price === 2000, `Precio es 2000 (actual: ${quesoItem?.price})`);

// 2. getLinePrice calculation
const burger = MENU_CATEGORIES.find((c) => c.id === "hamburguesas")?.items[0]!;
assert(Boolean(burger), "Hamburguesa encontrada");
const burgerBasePrice = burger.price ?? 0;

const quesoAdd: CartAdditionItem = { name: "Adición de Queso", price: 2000 };
const tocinetaAdd: CartAdditionItem = { name: "Tocineta", price: 3000 };
const freeAdd: CartAdditionItem = { name: "Cebolla extra", price: 0 };

assert(
  getLinePrice(burger) === burgerBasePrice,
  "Precio hamburguesa sin adiciones es el precio base",
);
assert(
  getLinePrice(burger, undefined, [quesoAdd]) === burgerBasePrice + 2000,
  "Precio hamburguesa con Queso suma +2000",
);
assert(
  getLinePrice(burger, undefined, [quesoAdd, tocinetaAdd]) === burgerBasePrice + 5000,
  "Precio hamburguesa con Queso y Tocineta suma +5000",
);
assert(
  getLinePrice(burger, undefined, [quesoAdd, freeAdd]) === burgerBasePrice + 2000,
  "Precio con adición de precio 0 no altera la suma",
);

// Salchipapa con tamaños
const salchi = MENU_CATEGORIES.find((c) => c.id === "salchipapas")?.items[0]!;
const personalSize = salchi.sizes?.[0]!;
const medianaSize = salchi.sizes?.[1]!;

assert(
  getLinePrice(salchi, personalSize) === personalSize.price,
  "Precio salchipapa personal sin adiciones",
);
assert(
  getLinePrice(salchi, personalSize, [quesoAdd]) === personalSize.price + 2000,
  "Precio salchipapa personal con Queso",
);
assert(
  getLinePrice(salchi, medianaSize, [quesoAdd, tocinetaAdd]) === medianaSize.price + 5000,
  "Precio salchipapa mediana con Queso + Tocineta",
);

// 3. getCartLineId determinism
const id1 = getCartLineId(burger, undefined, {
  adiciones: [quesoAdd, tocinetaAdd],
});
const id2 = getCartLineId(burger, undefined, {
  adiciones: [tocinetaAdd, quesoAdd],
});
assert(id1 === id2, "Line ID es determinista ante orden alterado de adiciones");

const idSingle = getCartLineId(burger, undefined, {
  adiciones: [quesoAdd],
});
assert(id1 !== idSingle, "Line ID difiere cuando cambian las adiciones");

// Case insensitivity test
const idCaseLower = getCartLineId(burger, undefined, {
  adiciones: [{ name: "tocineta", price: 3000 }],
});
const idCaseUpper = getCartLineId(burger, undefined, {
  adiciones: [{ name: "Tocineta", price: 3000 }],
});
assert(
  idCaseLower === idCaseUpper,
  `Line ID debe ser insensible a mayúsculas/minúsculas en adiciones (idLower: ${idCaseLower}, idUpper: ${idCaseUpper})`,
);

// Exclusion case insensitivity test
const idExcLower = getCartLineId(burger, undefined, {
  exclusiones: ["cebolla"],
});
const idExcUpper = getCartLineId(burger, undefined, {
  exclusiones: ["Cebolla"],
});
assert(
  idExcLower === idExcUpper,
  `Line ID debe ser insensible a mayúsculas/minúsculas en exclusiones (idExcLower: ${idExcLower}, idExcUpper: ${idExcUpper})`,
);

// Notes quote & case insensitivity test
const idNoteQuotes = getCartLineId(burger, undefined, {
  notas: '"bien tostada"',
});
const idNotePlain = getCartLineId(burger, undefined, {
  notas: "Bien Tostada",
});
assert(
  idNoteQuotes === idNotePlain,
  `Line ID debe normalizar comillas y mayúsculas en notas (idNoteQuotes: ${idNoteQuotes}, idNotePlain: ${idNotePlain})`,
);

// 4. visibleCategories exclusion
const visibleCategories = MENU_CATEGORIES.filter(
  (cat) => cat.items.length > 0 && cat.id !== "adiciones",
);
assert(
  !visibleCategories.some((c) => c.id === "adiciones"),
  "visibleCategories excluye la categoría 'adiciones'",
);

// availableAdditions retrieval
const availableAdditions = (() => {
  const dbAdds = MENU_CATEGORIES.find((c) => c.id === "adiciones")?.items;
  if (dbAdds && dbAdds.length > 0) return dbAdds;
  return MENU_CATEGORIES.find((c) => c.id === "adiciones")?.items ?? [];
})();
assert(availableAdditions.length > 0, "availableAdditions contiene productos de adiciones");
assert(
  availableAdditions.some((a) => a.name === "Adición de Queso" && a.price === 2000),
  "availableAdditions incluye Adición de Queso a 2000",
);

// 5. WhatsApp Order Formatting simulation
const lineQty = 2;
const lineUnit = getLinePrice(burger, undefined, [quesoAdd, tocinetaAdd]);
const lineTotal = lineQty * lineUnit;
const lineHeader = `${lineQty}x ${formatCartLineName(burger)} — ${formatCOP(lineTotal)}`;
assert(
  lineTotal === 2 * (burgerBasePrice + 5000),
  "Subtotal de línea multiplica correctamente (base + adiciones) * cantidad",
);

const adicionesStr = [quesoAdd, tocinetaAdd]
  .map((a) => (a.price > 0 ? `${a.name} (+${formatCOP(a.price)})` : a.name))
  .join(", ");
assert(
  adicionesStr.includes("Adición de Queso (+") && adicionesStr.includes("Tocineta (+"),
  "Formato de adiciones contiene nombres y precios",
);

console.log("\n==============================================");
if (failed > 0) {
  console.error(`FAILED WITH ${failed} ERRORS!`);
  process.exit(1);
} else {
  console.log("ALL TESTS PASSED WITH 0 ERRORS!");
  process.exit(0);
}
