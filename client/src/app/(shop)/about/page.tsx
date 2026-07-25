export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-display text-sm uppercase tracking-[0.2em] text-caramel">
        Our story
      </p>
      <h1 className="mt-3 font-display text-4xl text-cocoa">
        About Royal Bakery
      </h1>

      <div className="mt-8 flex flex-col gap-5 leading-relaxed text-text-muted">
        <p>
          Royal Bakery has spent years perfecting the everyday craft of good
          baking — cakes made to order, pastries baked fresh each morning,
          and bread that never sees a shortcut. What started as a small
          neighbourhood counter in Colombo has grown into a bakery people
          plan celebrations around.
        </p>
        <p>
          Everything on our menu is made in-house, in small batches, using
          real butter, real chocolate, and no artificial shortcuts. Our team
          of bakers starts before sunrise so that whatever you order is as
          fresh as it can possibly be.
        </p>
        <p>
          This website is how we&apos;re bringing that same bakery counter
          online — browse the full menu, see what&apos;s in stock, and order
          ahead instead of calling in.
        </p>
      </div>
    </div>
  );
}
