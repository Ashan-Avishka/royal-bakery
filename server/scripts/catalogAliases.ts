const PRODUCT_ALIASES = {
  "cream bun": "Cream Buns",
  "sweet buns": "Tea Buns",
  rolls: "Fish Rolls",
  "chocolate truffle cake": "Chocolate Cake",
} as const;

export { PRODUCT_ALIASES };

export function normalizeCatalogProductName(name: string): string {
  return name.trim().toLocaleLowerCase("en");
}

export function canonicalCatalogProductName(name: string): string {
  const normalized = normalizeCatalogProductName(name);
  return normalizeCatalogProductName(PRODUCT_ALIASES[normalized as keyof typeof PRODUCT_ALIASES] ?? name);
}
