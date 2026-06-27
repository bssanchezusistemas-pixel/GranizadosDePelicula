export type MenuCategoryId =
  | "helados"
  | "cholaos"
  | "raspados"
  | "boom"
  | "granizados"
  | "hot-dog"
  | "patacones"
  | "picadas"
  | "desgranados"
  | "asados"
  | "tacos-birria"
  | "bebidas"
  | "limonadas"
  | "adiciones"
  | "salchipapas"
  | "hamburguesas";

export interface MenuItemSize {
  label: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price?: number;
  sizes?: MenuItemSize[];
  image?: string;
  badge?: string;
}

export interface MenuCategory {
  id: MenuCategoryId;
  label: string;
  tagline: string;
  accentColor?: string;
  items: MenuItem[];
}

export const BUSINESS = {
  name: "Granizados de Película",
  tagline: "Sabor de cine en cada bocado",
  headline: "Tu antojo en pantalla grande",
  subheadline:
    "Granizados, cholaos, hot dogs, salchipapas, hamburguesas y más — hechos con cariño familiar en Zarzal.",
  city: "Zarzal, Valle del Cauca",
  address: "Carrera 10 # 13-56, frente a Tiendas Ara",
  phones: ["573107790328", "573177729038"],
  primaryWhatsApp: "573107790328",
  hours: "Lun – Dom · 3:00 p.m. – 10:30 p.m.",
  mapsQuery: "Carrera 10 #13-56, Zarzal, Valle del Cauca, Colombia",
  mapsEmbed:
    "https://maps.google.com/maps?q=Carrera+10+%2313-56+Zarzal+Valle+del+Cauca&t=&z=17&ie=UTF8&iwloc=&output=embed",
};

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: "helados",
    label: "Boom, Raspados, Cholados y Granizados",
    tagline: "Frío, dulce y con sabor de película",
    accentColor: "#F28131",
    items: [
      {
        id: "chol-mega",
        name: "Mega Cholao",
        description: "Cholao grande con fruta, leche condensada y toppings.",
        price: 17000,
        badge: "Estrella",
      },
      {
        id: "chol-grande",
        name: "Cholao Grande",
        description: "Porción grande de cholao tradicional.",
        price: 11000,
      },
      {
        id: "chol-pequeno",
        name: "Cholao Pequeño",
        description: "Porción pequeña de cholao.",
        price: 8000,
      },
      {
        id: "chol-tradicional",
        name: "Cholao Tradicional",
        description: "Cholao clásico de la casa.",
        price: 8000,
      },
      {
        id: "rasp-con-helado",
        name: "Raspao con Helado",
        description: "Raspado con helado.",
        sizes: [
          { label: "Pequeño", price: 7000 },
          { label: "Grande", price: 9000 },
        ],
      },
      {
        id: "rasp-sencillo",
        name: "Raspao Sencillo",
        description: "Raspado sencillo.",
        sizes: [
          { label: "Pequeño", price: 4000 },
          { label: "Grande", price: 6000 },
        ],
      },
      {
        id: "boom-oreo-milo",
        name: "Boom de Oreo o Milo",
        description: "Granizado boom con Oreo o Milo.",
        price: 17000,
      },
      {
        id: "boom-caramelo",
        name: "Boom de Caramelo",
        description: "Granizado boom sabor caramelo.",
        price: 17000,
      },
      {
        id: "boom-chocolate",
        name: "Boom de Chocolate",
        description: "Granizado boom sabor chocolate.",
        price: 17000,
      },
      {
        id: "gran-oreo",
        name: "Granizado de Oreo",
        description: "Granizado sabor Oreo.",
        price: 11000,
      },
      {
        id: "gran-milo",
        name: "Granizado de Milo",
        description: "Granizado sabor Milo.",
        price: 11000,
      },
      {
        id: "gran-cafe",
        name: "Granizado de Café",
        description: "Granizado sabor café.",
        price: 11000,
      },
      {
        id: "gran-con-helado",
        name: "Granizado con Helado",
        description: "Granizado con helado.",
        price: 14000,
      },
      {
        id: "gran-mocca-caramelo",
        name: "Mocca Caramelo",
        description: "Granizado mocca caramelo.",
        price: 11000,
      },
      {
        id: "gran-frutos-rojos",
        name: "Granizado Frutos Rojos",
        description: "Granizado sabor frutos rojos.",
        price: 11000,
      },
      {
        id: "gran-sandia",
        name: "Granizado Sandía",
        description: "Granizado sabor sandía.",
        price: 11000,
      },
      {
        id: "gran-masmelo",
        name: "Granizado Masmelo",
        description: "Granizado sabor masmelo.",
        price: 11000,
      },
      {
        id: "gran-maracuya",
        name: "Granizado Maracuyá",
        description: "Granizado sabor maracuyá.",
        price: 11000,
      },
      {
        id: "gran-mango-biche",
        name: "Granizado Mango Biche",
        description: "Granizado sabor mango biche.",
        price: 11000,
      },
      {
        id: "gran-maracubiche",
        name: "Maracubiche",
        description: "Granizado maracuyá y mango biche.",
        price: 11000,
      },
      {
        id: "gran-frutos-amarillos",
        name: "Granizado Frutos Amarillos",
        description: "Granizado sabor frutos amarillos.",
        price: 11000,
      },
    ],
  },
  {
    id: "hot-dog",
    label: "Hot Dog",
    tagline: "Pan brioche y salsas de la casa",
    items: [
      {
        id: "hd-tradicional",
        name: "Tradicional",
        description:
          "Pan brioche, salchicha americana, ripio de papa, cebolla caramelizada, queso mozzarella, tocineta ahumada.",
        price: 16000,
      },
      {
        id: "hd-pollo",
        name: "Con Pollo",
        description:
          "Pan brioche, salchicha americana, ripio de papa, cebolla caramelizada, doble queso mozzarella, pollo desmechado, tocineta ahumada, huevo de codorniz.",
        price: 20000,
      },
      {
        id: "hd-mega",
        name: "Mega Hot Dog",
        description:
          "Pan brioche, queso filadelphia, doble salchicha americana, ripio de papa, cebolla caramelizada, triple queso mozzarella, pollo desmechado, maicitos, tocineta ahumada, huevo de codorniz, salsa de la casa.",
        price: 25000,
      },
      {
        id: "hd-mixto",
        name: "Mixto",
        description:
          "Pan brioche, queso filadelphia, doble salchicha americana, ripio de papa, cebolla caramelizada, triple queso mozzarella, pollo desmechado, carne desmechada en salsa criolla, maicitos, tocineta ahumada, huevo de codorniz, salsa de la casa.",
        price: 29000,
      },
      {
        id: "hd-mega-perra",
        name: "Mega Perra",
        description:
          "Pan brioche, queso filadelphia, lechuga fresca, ripio de papa, panceta de cerdo ahumado, triple queso mozzarella, tocineta ahumada, huevo de codorniz, salsa de la casa.",
        price: 29000,
      },
      {
        id: "hd-montanero",
        name: "Montañero",
        description:
          "Pan brioche, queso doble crema, queso campesino, ripio de papa, salchicha americana, salsas de La Casa, cebolla caramelizada, birria de cerdo, plátano maduro, pico de gallo y salsa verde.",
        price: 29000,
      },
    ],
  },
  {
    id: "patacones",
    label: "Patacones",
    tagline: "Plátano pintón a lo grande",
    items: [
      {
        id: "pat-solo-pollo",
        name: "Solo Pollo",
        description:
          "Plátano pintón, lechuga fresca, pollo desmechado, jamón, tocineta ahumada, queso gratinado, maicitos, huevos de codorniz, salsa de la casa.",
        price: 23000,
      },
      {
        id: "pat-pelicula",
        name: "De Película",
        description:
          "Plátano pintón, lechuga fresca, pollo desmechado, carne desmechada, jamón, tocineta ahumada, queso gratinado, salsa criolla, trozos de cerdo en salsa BBQ, chorizo santarosano, huevo de codorniz, salsa de la casa.",
        price: 29000,
        badge: "Estrella",
      },
    ],
  },
  {
    id: "picadas",
    label: "Picadas",
    tagline: "Para compartir o disfrutar solo",
    items: [
      {
        id: "picada",
        name: "Picada",
        description:
          "Trozos de cerdo en salsa BBQ, chicharrón carnudo, chorizo santarosano, costilla ahumada, papa criolla, dedos de yuca, arepa frita, monedas (plátano verde). Acompañado de salsa verde, pico de gallo y tomate.",
        sizes: [
          { label: "Personal (200gr)", price: 28000 },
          { label: "Mediana (500gr)", price: 47000 },
          { label: "Grande (1000gr)", price: 80000 },
        ],
      },
    ],
  },
  {
    id: "desgranados",
    label: "Desgranados",
    tagline: "Arroz con sabor casero",
    items: [
      {
        id: "des-solo-pollo",
        name: "Solo Pollo",
        description: "Arroz desgranado con pollo desmechado.",
        price: 22000,
      },
      {
        id: "des-mixto",
        name: "Mixto",
        description: "Pollo, cerdo y carne desmechada.",
        price: 33000,
      },
    ],
  },
  {
    id: "asados",
    label: "Asados al Carbón",
    tagline: "Humo, brasa y sabor ahumado",
    items: [
      {
        id: "asa-punta-anca",
        name: "Punta de Anca",
        description: "Corte premium a la brasa.",
        price: 29000,
      },
      {
        id: "asa-churrasco",
        name: "Churrasco",
        description: "Jugoso y marcado al carbón.",
        price: 29000,
      },
      {
        id: "asa-costilla",
        name: "Costilla Ahumada",
        description: "Costilla ahumada a la brasa.",
        price: 24000,
      },
      {
        id: "asa-filete",
        name: "Filete Pechuga",
        description: "Pechuga a la parrilla.",
        price: 24000,
      },
      {
        id: "asa-lomo",
        name: "Lomo Cerdo",
        description: "Lomo de cerdo al carbón.",
        price: 24000,
      },
      {
        id: "asa-chorizo",
        name: "Chorizo Ahumado",
        description: "Chorizo ahumado a la brasa.",
        price: 13000,
      },
    ],
  },
  {
    id: "tacos-birria",
    label: "Tacos de Birria",
    tagline: "4 tacos con caldo y nachos",
    items: [
      {
        id: "tacos-birria",
        name: "Tacos de Birria (4 tacos)",
        description:
          "Tortilla de harina, queso doble crema, salsa verde, birria de cerdo, pico de gallo, acompañados de caldo de birria y nachos.",
        price: 28000,
      },
    ],
  },
  {
    id: "bebidas",
    label: "Bebidas",
    tagline: "Refrescantes y bien frías",
    items: [
      { id: "beb-postobon", name: "Postobón Personal", description: "Gaseosa personal.", price: 4000 },
      { id: "beb-coca", name: "Coca-Cola Personal", description: "Gaseosa personal.", price: 4500 },
      { id: "beb-hit", name: "Hit Personal", description: "Jugo Hit personal.", price: 4500 },
      { id: "beb-hit-litro", name: "Hit Litro", description: "Jugo Hit litro.", price: 7000 },
      { id: "beb-econolitro", name: "Econolitro", description: "Bebida econolitro.", price: 5000 },
      { id: "beb-postobon-15", name: "Postobón 1.5 L", description: "Gaseosa 1.5 litros.", price: 8000 },
      { id: "beb-coca-15", name: "Coca-Cola 1.5 L", description: "Gaseosa 1.5 litros.", price: 9000 },
      { id: "beb-agua", name: "Agua", description: "Agua embotellada.", price: 3000 },
      { id: "beb-soda", name: "Soda Pequeña", description: "Soda pequeña.", price: 3000 },
      { id: "beb-aguila", name: "Águila Light", description: "Cerveza Águila Light.", price: 4000 },
      { id: "beb-corona", name: "Corona", description: "Cerveza Corona.", price: 8000 },
      { id: "beb-club", name: "Club Colombia", description: "Cerveza Club Colombia.", price: 5000 },
      { id: "beb-poker", name: "Poker", description: "Cerveza Poker.", price: 4000 },
      { id: "beb-michelada", name: "Michelada", description: "Michelada preparada.", price: 8000 },
    ],
  },
  {
    id: "limonadas",
    label: "Limonadas y Jugos",
    tagline: "Naturales y saborizadas",
    items: [
      {
        id: "lim-natural",
        name: "Limonada Natural",
        description: "Limonada natural.",
        price: 5000,
      },
      {
        id: "jug-natural",
        name: "Jugos Naturales",
        description: "Jugo de fruta natural.",
        sizes: [
          { label: "Pequeño", price: 5000 },
          { label: "Grande", price: 6000 },
        ],
      },
      { id: "lim-cereza", name: "Limonada Cereza", description: "Limonada sabor cereza.", price: 10000 },
      { id: "lim-coco", name: "Limonada Coco", description: "Limonada sabor coco.", price: 10000 },
      { id: "lim-hierba", name: "Limonada Hierba Buena", description: "Limonada con hierba buena.", price: 10000 },
      { id: "lim-coco-cereza", name: "Limonada Coco Cereza", description: "Limonada coco y cereza.", price: 10000 },
      { id: "lim-coco-maracuya", name: "Limonada Coco Maracuyá", description: "Limonada coco y maracuyá.", price: 10000 },
      { id: "lim-pina", name: "Limonada Piña Colada", description: "Limonada piña colada.", price: 10000 },
    ],
  },
  {
    id: "adiciones",
    label: "Adiciones",
    tagline: "Personaliza tu pedido",
    items: [
      { id: "add-tocineta", name: "Tocineta", description: "Porción extra de tocineta.", price: 3000 },
      { id: "add-carne-res", name: "Carne de Res", description: "Porción extra de carne de res.", price: 8000 },
      { id: "add-queso", name: "Loncha de Queso", description: "Loncha de queso extra.", price: 1200 },
      { id: "add-pollo", name: "Pollo Desmechado", description: "Porción extra de pollo desmechado.", price: 8000 },
      { id: "add-carne-hamb", name: "Carne de Hamburguesa", description: "Porción extra de carne.", price: 8000 },
      { id: "add-chorizo", name: "Chorizo", description: "Porción extra de chorizo.", price: 8000 },
      { id: "add-maiz", name: "Maíz", description: "Porción extra de maíz.", price: 3000 },
      { id: "add-salsas", name: "Salsas", description: "Porción extra de salsas.", price: 2000 },
      { id: "add-cerdo", name: "Cerdo", description: "Porción extra de cerdo.", price: 8000 },
      { id: "add-costilla", name: "Costilla", description: "Porción extra de costilla.", price: 8000 },
      { id: "add-chicharron", name: "Chicharrón", description: "Porción extra de chicharrón.", price: 8000 },
      { id: "add-papa", name: "Papa", description: "Porción extra de papa.", price: 7000 },
      { id: "add-cheddar", name: "Cama de Queso Cheddar", description: "Cama de queso cheddar.", price: 10000 },
      { id: "add-codorniz", name: "Huevos de Codorniz", description: "Huevos de codorniz extra.", price: 3000 },
      { id: "add-plantano", name: "Plátano", description: "Porción extra de plátano.", price: 3000 },
    ],
  },
  {
    id: "salchipapas",
    label: "Salchipapas",
    tagline: "Crujiente, abundante, irresistible",
    accentColor: "#F28131",
    items: [
      {
        id: "sal-tradicional",
        name: "Tradicional",
        description:
          "Papa a la francesa o criolla, salchicha, salsas de la casa, huevos de codorniz.",
        sizes: [
          { label: "Personal", price: 14000 },
          { label: "Mediana", price: 23000 },
        ],
      },
      {
        id: "sal-gratinada",
        name: "Salchigratinada",
        description:
          "Papa a la francesa o criolla, salchicha, salsas de la casa, queso gratinado y huevos de codorniz.",
        sizes: [
          { label: "Personal", price: 18000 },
          { label: "Mediana", price: 28000 },
        ],
      },
      {
        id: "sal-pollo",
        name: "Salchipollo",
        description:
          "Papa a la francesa o criolla, salchicha, salsas de la casa, queso gratinado, pollo desmechado, maíz tierno, trozos de tocineta y huevos de codorniz.",
        sizes: [
          { label: "Personal", price: 22000 },
          { label: "Mediana", price: 33000 },
          { label: "Grande", price: 50000 },
          { label: "Familiar", price: 65000 },
        ],
      },
      {
        id: "sal-costilla",
        name: "Salchicostilla",
        description:
          "Papa a la francesa o criolla, salchicha, salsas de la casa, queso gratinado, costilla en salsa BBQ, maduro y huevos de codorniz.",
        sizes: [
          { label: "Personal", price: 22000 },
          { label: "Mediana", price: 33000 },
          { label: "Grande", price: 50000 },
          { label: "Familiar", price: 65000 },
        ],
      },
      {
        id: "sal-cerdo",
        name: "Salchicerdo",
        description:
          "Papa a la francesa o criolla, salchicha, salsas de la casa, queso gratinado, chorizo antioqueño, cerdo en trozos en salsa BBQ, maduro, chicharrón carnudo y huevos de codorniz.",
        sizes: [
          { label: "Personal", price: 22000 },
          { label: "Mediana", price: 33000 },
          { label: "Grande", price: 50000 },
          { label: "Familiar", price: 65000 },
        ],
      },
      {
        id: "sal-carnes",
        name: "Salchicarnes",
        description:
          "Papa a la francesa o criolla, salchicha, salsas de la casa, queso gratinado, carne de res desmechada, maduro, cerdo en salsa BBQ, maíz tierno y huevos de codorniz.",
        sizes: [
          { label: "Personal", price: 22000 },
          { label: "Mediana", price: 33000 },
          { label: "Grande", price: 50000 },
          { label: "Familiar", price: 65000 },
        ],
      },
      {
        id: "sal-mixta",
        name: "Salchimixta",
        description:
          "Papa a la francesa o criolla, salchicha, salsas de la casa, queso gratinado, carne de res desmechada, maduro, maíz tierno, pollo desmechado y huevos de codorniz.",
        sizes: [
          { label: "Personal", price: 22000 },
          { label: "Mediana", price: 33000 },
          { label: "Grande", price: 50000 },
          { label: "Familiar", price: 65000 },
        ],
      },
      {
        id: "sal-montanera",
        name: "Montañera",
        description:
          "Papa a la francesa o criolla, salchicha, salsas de la casa, queso gratinado, chorizo ahumado, costilla en salsa BBQ, chicharrón carnudo, monedas plátano verde, pico de gallo y huevos de codorniz.",
        sizes: [
          { label: "Personal", price: 22000 },
          { label: "Mediana", price: 33000 },
          { label: "Grande", price: 50000 },
          { label: "Familiar", price: 65000 },
        ],
      },
      {
        id: "sal-chori-costilla",
        name: "Chori | Costilla",
        description:
          "Papa a la francesa o criolla, salchicha, salsas de la casa, queso gratinado, chorizo ahumado, maíz tierno, costilla en salsa BBQ, maduro, chorizo antioqueño.",
        sizes: [
          { label: "Personal", price: 22000 },
          { label: "Mediana", price: 33000 },
          { label: "Grande", price: 50000 },
          { label: "Familiar", price: 65000 },
        ],
      },
      {
        id: "sal-pelicula",
        name: "Salchi | Película",
        description:
          "Papa a la francesa o criolla, salchicha, salsas de la casa, queso gratinado, carne de res desmechada, pollo desmechado, maduro, cerdo a la plancha, chorizo antioqueño, costilla en salsa BBQ, maíz tierno y huevos de codorniz.",
        sizes: [
          { label: "Personal", price: 27000 },
          { label: "Mediana", price: 39000 },
          { label: "Grande", price: 60000 },
          { label: "Familiar", price: 75000 },
        ],
        badge: "De la casa",
      },
      {
        id: "sal-lazana",
        name: "Salchilazaña",
        description:
          "Papa a la francesa o criolla, salchicha ahumada, salsas de la casa, queso doble crema, carne desmechada, crema bechamel, pollo desmechado, queso parmesano, mermelada, tocineta, peperoni y orégano.",
        sizes: [
          { label: "Personal", price: 22000 },
          { label: "Mediana", price: 35000 },
        ],
      },
    ],
  },
  {
    id: "hamburguesas",
    label: "Hamburguesas",
    tagline: "Capa a capa, como en el cine",
    items: [
      {
        id: "ham-clasica",
        name: "La Clásica",
        description:
          "Pan brioche, carne angus o filete de pollo, queso cheddar, cebolla caramelizada, tocineta, vegetales frescos, salsa de la casa.",
        price: 20000,
      },
      {
        id: "ham-glotona",
        name: "La Glotona",
        description:
          "Pan brioche, vegetales frescos, doble carne angus, doble queso cheddar, cebolla caramelizada, doble tocineta ahumada, salsas de la casa (papa fresca o criolla).",
        price: 26000,
      },
      {
        id: "ham-chingona",
        name: "La Chingona",
        description:
          "Pan brioche, vegetales frescos, carne angus, queso cheddar, cebolla caramelizada, tocineta ahumada, salsa chipotle, aguacate, nachos, queso, salsas de la casa, queso cheddar gratinado.",
        price: 26000,
      },
      {
        id: "ham-coqueta",
        name: "La Coqueta",
        description:
          "Pan brioche, vegetales frescos, carne angus, queso cheddar, cebolla caramelizada, tocineta ahumada, carne desmechada, salsas criolla, salsa de la casa.",
        price: 26000,
      },
      {
        id: "ham-criminal",
        name: "La Criminal",
        description:
          "Pan brioche, vegetales frescos, carne angus, queso cheddar, cebolla caramelizada, tocineta ahumada, chorizo santarosano, salsas de la casa.",
        price: 26000,
      },
      {
        id: "ham-presumida",
        name: "La Presumida",
        description:
          "Pan brioche, vegetales frescos, carne angus, queso cheddar, cebolla caramelizada, tocineta ahumada, filete de pollo, salsas de la casa.",
        price: 26000,
      },
      {
        id: "ham-hawaina",
        name: "La Hawaina",
        description:
          "Pan brioche, vegetales frescos, carne angus, queso cheddar, tocineta ahumada, piña caramelizada con pollo desmechado en salsa dulce y maicitos, salsa de la casa.",
        price: 26000,
      },
      {
        id: "ham-kentuck",
        name: "La Kentuck",
        description:
          "Pan brioche, vegetales frescos, carne angus, queso cheddar, tocineta ahumada, pollo crispy kentucky, salsa de la casa.",
        price: 26000,
      },
      {
        id: "ham-gratinada",
        name: "Hamburguesa Gratinada",
        description:
          "Pan brioche, carne angus, queso cheddar, cebolla caramelizada, tocineta, vegetales frescos y queso fundido.",
        price: 26000,
      },
      {
        id: "ham-beicon",
        name: "La Beicon",
        description:
          "Pan brioche, carne angus, queso cheddar, cebolla caramelizada, tocineta, panceta de cerdo, mermelada de tocineta, vegetales frescos, acompañada de papas francesas.",
        price: 26000,
      },
      {
        id: "ham-campeche",
        name: "Campeche",
        description:
          "Pan brioche, carne angus, cebolla caramelizada, tocineta, birria de res, queso asado, loncha de plátano maduro, salsas de La Casa.",
        price: 29000,
      },
    ],
  },
];

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCartLineId(
  item: MenuItem,
  selectedSize?: MenuItemSize,
): string {
  return selectedSize ? `${item.id}::${selectedSize.label}` : item.id;
}

export function getLinePrice(
  item: MenuItem,
  selectedSize?: MenuItemSize,
): number {
  if (selectedSize) return selectedSize.price;
  if (item.price !== undefined) return item.price;
  return item.sizes?.[0]?.price ?? 0;
}

export function formatCartLineName(
  item: MenuItem,
  selectedSize?: MenuItemSize,
): string {
  if (selectedSize) return `${item.name} (${selectedSize.label})`;
  return item.name;
}

export function buildWhatsAppUrl(message: string, phone = BUSINESS.primaryWhatsApp) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export interface MenuProductRef {
  id: string;
  name: string;
  categoriaId: MenuCategoryId;
}

/** Lista plana de productos para buscadores y filtros. */
export function getAllMenuProducts(): MenuProductRef[] {
  return MENU_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => ({
      id: item.id,
      name: item.name,
      categoriaId: cat.id,
    })),
  );
}
