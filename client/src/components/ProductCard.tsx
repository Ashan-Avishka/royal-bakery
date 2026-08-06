"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { StaggerItem } from "@/components/motion/StaggerGrid";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatPrice, type Product } from "@/lib/catalog";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const outOfStock = product.stockQuantity <= 0 || !product.isAvailable;
  const surfaceMotion = reducedMotion ? {} : { y: -2 };
  const imageMotion = reducedMotion ? {} : { scale: 1.025 };

  return (
    <StaggerItem className="h-full">
      <Link
        href={`/products/${product.id}`}
        className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
      >
        <motion.div
          className="h-full"
          whileHover={surfaceMotion}
          whileTap={reducedMotion ? {} : { scale: 0.995 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
            <div className="relative aspect-[4/5] overflow-hidden bg-honey-light">
              {product.imageUrl ? (
                <motion.div
                  className="absolute inset-0"
                  whileHover={imageMotion}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    priority={priority}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                </motion.div>
              ) : (
                <div className="flex h-full items-center justify-center bg-honey-light px-6 text-center font-display text-lg text-cocoa">
                  Royal Bakery
                </div>
              )}
              {outOfStock && (
                <Badge tone="warning" className="absolute right-3 top-3">
                  Out of stock
                </Badge>
              )}
            </div>
            <div className="flex min-h-24 flex-col justify-between gap-2 p-4">
              <h3 className="font-display text-lg leading-snug text-cocoa">{product.name}</h3>
              <p className="text-sm font-semibold text-caramel-hover">
                {formatPrice(product.price)}
              </p>
            </div>
          </Card>
        </motion.div>
      </Link>
    </StaggerItem>
  );
}
