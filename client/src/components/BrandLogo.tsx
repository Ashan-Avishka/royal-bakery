import Image from "next/image";
import Link from "next/link";

const sizes = {
  sm: { box: "h-9 w-9 sm:h-10 sm:w-10", px: 40 },
  md: { box: "h-14 w-14 sm:h-16 sm:w-16", px: 64 },
  lg: { box: "h-20 w-20 sm:h-24 sm:w-24", px: 96 },
  xl: { box: "h-28 w-28 sm:h-32 sm:w-32", px: 128 },
} as const;

interface BrandLogoProps {
  size?: keyof typeof sizes;
  href?: string | null;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  size = "sm",
  href = "/",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const { box, px } = sizes[size];

  const image = (
    <Image
      src="/images/logo.png"
      alt="Royal Bakery"
      width={px}
      height={px}
      priority={priority}
      className={`object-contain ${box} ${className}`}
    />
  );

  if (href === null) {
    return image;
  }

  return (
    <Link
      href={href}
      aria-label="Royal Bakery home"
      className="inline-flex shrink-0"
    >
      {image}
    </Link>
  );
}
