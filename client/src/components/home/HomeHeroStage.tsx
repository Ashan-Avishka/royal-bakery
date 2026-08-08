import {
  HeroCarousel,
  type HeroSlide,
} from "@/components/home/HeroCarousel";
import { TrustBar } from "@/components/home/TrustBar";

interface HomeHeroStageProps {
  slides: HeroSlide[];
}

export function HomeHeroStage({ slides }: HomeHeroStageProps) {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      <div className="min-h-0 flex-1">
        <HeroCarousel slides={slides} compact />
      </div>
      <TrustBar />
    </div>
  );
}
