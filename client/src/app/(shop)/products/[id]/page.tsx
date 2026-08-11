import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addToCart } from "@/app/actions/cart";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice, getProduct } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export default async function ProductDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const product = await getProduct(id);
  if (!product) notFound();
  const outOfStock = product.stockQuantity <= 0 || !product.isAvailable;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <section className="relative overflow-x-hidden">
      <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-honey/25 blur-3xl" aria-hidden />
      <div className="page-container page-section relative min-w-0">
        <Link href="/products" className="group inline-flex min-h-11 items-center gap-2 text-[12px] tracking-[0.08em] text-caramel-hover transition-colors hover:text-cocoa"><span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-0.5">←</span>Back to all products</Link>
        <div className="mt-8 grid min-w-0 items-start gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-honey-light/60 shadow-[0_24px_50px_-28px_rgba(58,26,19,0.35)] ring-1 ring-border-warm/70 lg:col-span-6">
            {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(min-width: 1024px) 40vw, calc(100vw - 2rem)" className="object-cover" preload /> : <div className="flex h-full items-center justify-center text-text-muted">Photo coming soon</div>}
          </div>
          <div className="flex min-w-0 flex-col lg:col-span-6 lg:pt-4">
            <div className="mb-4 flex items-center gap-3"><span className="h-px w-8 bg-caramel/60" aria-hidden /><p className="font-display text-[11px] uppercase tracking-[0.28em] text-caramel-hover">From the bakery</p></div>
            <h1 className="break-words font-display text-[2rem] font-medium leading-[1.15] tracking-tight text-cocoa sm:text-4xl">{product.name}</h1>
            <p className="mt-4 font-display text-2xl font-medium text-cocoa">{formatPrice(product.price)}</p>
            <div className="mt-5">{outOfStock ? <Badge tone="warning">Out of stock</Badge> : <Badge tone="success">In stock</Badge>}</div>
            {product.description && <p className="mt-6 max-w-md break-words text-[15px] leading-relaxed text-text-muted sm:text-base">{product.description}</p>}
            {error && <p role="alert" className="mt-6 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <div className="mt-8">
              {user ? (outOfStock ? <Button disabled className="w-full px-7 py-3 text-[13px] tracking-[0.06em] sm:w-auto">Out of stock</Button> : <form action={addToCart} className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center"><input type="hidden" name="productId" value={product.id} /><label className="sr-only" htmlFor="quantity">Quantity</label><input id="quantity" type="number" name="quantity" min={1} max={product.stockQuantity} defaultValue={1} className="min-h-11 w-full rounded-full border border-border-warm bg-cream-alt px-3 py-2.5 text-center text-base text-cocoa focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel/30 sm:w-20 sm:text-sm" /><Button type="submit" className="w-full px-7 py-3 text-[13px] tracking-[0.06em] sm:w-auto">Add to cart</Button></form>) : <Link href="/login" className="group inline-flex min-h-11 items-center gap-2 border-b border-caramel/30 pb-0.5 text-sm tracking-wide text-caramel-hover transition-colors hover:border-caramel hover:text-cocoa">Sign in to add to cart<span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">→</span></Link>}
            </div>
            <ul className="mt-8 flex flex-col gap-2 text-sm text-text-muted"><li>Current availability shown online</li><li>Order ahead through your account</li><li>Pickup or delivery selection at checkout</li></ul>
          </div>
        </div>
      </div>
    </section>
  );
}
