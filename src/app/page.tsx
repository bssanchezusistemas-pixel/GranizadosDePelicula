import { Header } from "@/components/Header";
import { HeroScroll } from "@/components/HeroScroll";
import { MenuSectionLoader } from "@/components/MenuSectionLoader";
import { LocationSection } from "@/components/LocationSection";
import { CartDrawer } from "@/components/CartDrawer";
import { CartFlyAnimation } from "@/components/CartFlyAnimation";
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
        <MenuSectionLoader />
        <LocationSection />
      </main>
      <Footer />
      <CartDrawer />
      <CartFlyAnimation />
      <FloatingActions />
    </>
  );
}
