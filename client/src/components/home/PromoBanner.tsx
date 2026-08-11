import Image from "next/image";
import Link from "next/link";

const promos = [
  { title: "Celebration cakes", copy: "Browse cake options from the menu.", href: "/products", cta: "Browse cakes", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1400&q=80", alt: "Decorated celebration cake" },
  { title: "Breads and rolls", copy: "Browse bread and roll options from the menu.", href: "/products", cta: "Shop bread", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1400&q=80", alt: "Artisan bread loaves" },
];

export function PromoBanner() {
  return <section className="bg-cocoa-dark"><div className="grid lg:grid-cols-2">{promos.map((promo, index) => <Link key={promo.title} href={promo.href} className="group relative isolate min-h-[300px] overflow-hidden border-b border-cocoa/40 sm:min-h-[420px] lg:border-b-0 lg:border-r lg:last:border-r-0 lg:border-cocoa/40"><Image src={promo.image} alt={promo.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-[1.04]" /><div className="absolute inset-0 bg-gradient-to-t from-cocoa-dark/92 via-cocoa-dark/45 to-cocoa-dark/15" aria-hidden /><div className={`relative z-10 flex h-full flex-col justify-end p-4 sm:p-11 ${index === 0 ? "lg:pl-[max(2.75rem,calc((100vw-72rem)/2+1.5rem))]" : ""}`}><p className="font-display text-[10px] uppercase tracking-[0.28em] text-honey/70">Featured</p><h3 className="mt-3 font-display text-3xl font-medium tracking-tight text-cream sm:text-[2.35rem]">{promo.title}</h3><p className="mt-3 max-w-sm text-[14px] leading-relaxed text-honey-light/80 sm:text-[15px]">{promo.copy}</p><span className="mt-7 inline-flex items-center gap-2 self-start border-b border-honey/35 pb-0.5 text-[12px] tracking-[0.1em] text-honey transition-colors duration-300 group-hover:border-honey">{promo.cta}<span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">→</span></span></div></Link>)}</div></section>;
}
