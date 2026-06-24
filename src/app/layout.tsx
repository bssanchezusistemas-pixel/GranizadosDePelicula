import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Granizados de Película | Zarzal, Valle del Cauca",
  description:
    "Granizados, asados, hamburguesas y salchipapas en Zarzal. Frente a Tiendas Ara. Pide por WhatsApp.",
  keywords: [
    "granizados",
    "hamburguesas",
    "salchipapas",
    "asados",
    "Zarzal",
    "comida rápida",
  ],
  openGraph: {
    title: "Granizados de Película",
    description: "Sabor de cine en Zarzal. Ordena por WhatsApp.",
    locale: "es_CO",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="grain antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
