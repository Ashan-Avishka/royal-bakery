import { AboutTeaser } from "@/components/home/AboutTeaser";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { type HeroSlide } from "@/components/home/HeroCarousel";
import { HomeHeroStage } from "@/components/home/HomeHeroStage";
import { HowItWorks } from "@/components/home/HowItWorks";
import { NewsletterCta } from "@/components/home/NewsletterCta";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { PromoBanner } from "@/components/home/PromoBanner";
import { Testimonials } from "@/components/home/Testimonials";
import { listCategories, listProducts } from "@/lib/catalog";

const heroSlides: HeroSlide[] = [
  { id: "menu", brand: "Royal Bakery", headline: "Discover the Royal Bakery menu.", support: "Browse cakes, pastries, breads, and sweets, then place your order online.", ctaLabel: "Explore the menu", ctaHref: "/products", imageSrc: "/images/slide-1.jpg", imageAlt: "Pastries and bakery products on a counter" },
  { id: "cakes", brand: "Royal Bakery", headline: "Celebration cakes and bakery favourites.", support: "Browse cakes and other menu items available online.", ctaLabel: "Discover cakes", ctaHref: "/products", imageSrc: "/images/slide-2.jpg", imageAlt: "Decorated layer cake with frosting" },
  { id: "order", brand: "Royal Bakery", headline: "Plan your order online.", support: "Use the menu to select products and review available fulfilment details at checkout.", ctaLabel: "Order online", ctaHref: "/products", imageSrc: "/images/slide-3.jpg", imageAlt: "Bread loaves on a bakery counter" },
];

export default async function HomePage() {
  const [categories, products] = await Promise.all([listCategories().catch(() => []), listProducts().catch(() => [])]);
  const featured = products.slice(0, 8);
  const menuItems = products.slice(0, 12).reverse().slice(0, 8);
  const moreMenuItems = [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  return (
    <>
      <HomeHeroStage slides={heroSlides} />
      <CategoryShowcase categories={categories} />
      <ProductCarousel products={featured} eyebrow="The menu" title="Featured selections" description="A selection of cakes, pastries, and breads from the current menu." linkLabel="View all" />
      <PromoBanner />
      <ProductCarousel products={menuItems.length > 0 ? menuItems : featured} eyebrow="Explore more" title="More to explore" description="More cakes, pastries, breads, and sweets from the menu." tone="soft" linkLabel="View menu" />
      <HowItWorks />
      <ProductCarousel products={moreMenuItems.length > 0 ? moreMenuItems : featured} eyebrow="Explore more" title="More menu items" description="See more products from the current menu." linkLabel="View menu" />
      <Testimonials />
      <AboutTeaser />
      <NewsletterCta />
    </>
  );
}
