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
  {
    id: "fresh",
    brand: "Royal Bakery",
    headline: "Baked before sunrise. Ready when you are.",
    support:
      "Handcrafted cakes, pastries, and bread — ordered online, finished fresh for pickup or delivery in Harispaththuwa.",
    ctaLabel: "Explore the menu",
    ctaHref: "/products",
    imageSrc: "/images/slide-1.jpg",
    imageAlt: "Fresh pastries and baked goods on a bakery counter",
  },
  {
    id: "cakes",
    brand: "Royal Bakery",
    headline: "Celebration cakes, made to order.",
    support:
      "From birthday layers to wedding centrepieces — finished with real butter, real chocolate, and quiet attention.",
    ctaLabel: "Discover cakes",
    ctaHref: "/products",
    imageSrc: "/images/slide-2.jpg",
    imageAlt: "Decorated layer cake with frosting",
  },
  {
    id: "daily",
    brand: "Royal Bakery",
    headline: "Warm from the oven to your door.",
    support:
      "Reserve ahead, skip the counter, and collect your order at its freshest — or have it delivered.",
    ctaLabel: "Order ahead",
    ctaHref: "/products",
    imageSrc: "/images/slide-3.jpg",
    imageAlt: "Artisan bread loaves fresh from the oven",
  },
];

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    listCategories().catch(() => []),
    listProducts().catch(() => []),
  ]);

  const featured = products.slice(0, 8);
  const bestsellers = products.slice(0, 12).reverse().slice(0, 8);
  const newArrivals = [...products]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 8);

  return (
    <>
      <HomeHeroStage slides={heroSlides} />
      <CategoryShowcase categories={categories} />
      <ProductCarousel
        products={featured}
        eyebrow="This week"
        title="Featured selections"
        description="A considered edit of cakes, pastries, and breads our Harispaththuwa regulars return for."
        linkLabel="View all"
      />
      <PromoBanner />
      <ProductCarousel
        products={bestsellers.length > 0 ? bestsellers : featured}
        eyebrow="Most ordered"
        title="Bestsellers"
        description="The pieces that leave the counter first — tried, trusted, ordered again."
        tone="soft"
        linkLabel="Shop bestsellers"
      />
      <HowItWorks />
      <ProductCarousel
        products={newArrivals.length > 0 ? newArrivals : featured}
        eyebrow="Just baked"
        title="New arrivals"
        description="Fresh additions to the menu — catch them while the batch lasts."
        linkLabel="See what's new"
      />
      <Testimonials />
      <AboutTeaser />
      <NewsletterCta />
    </>
  );
}
