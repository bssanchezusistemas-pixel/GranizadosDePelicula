import { Header } from "@/components/Header";
import { HeroScroll } from "@/components/HeroScroll";
import { MenuSection } from "@/components/MenuSection";
import { LocationSection } from "@/components/LocationSection";
import { CartDrawer } from "@/components/CartDrawer";
import { FloatingActions } from "@/components/FloatingActions";
import { Footer } from "@/components/Footer";
import { MarqueeStrip } from "@/components/MarqueeStrip";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroScroll />
        <MarqueeStrip />
        <MenuSection />
        <LocationSection />
      </main>
      <Footer />
      <CartDrawer />
      <FloatingActions />
    </>
  );
}
