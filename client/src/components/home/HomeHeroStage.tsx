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
    <div className="flex h-dvh flex-col">
      <div className="min-h-80 flex-1">
        <HeroCarousel slides={slides} compact />
      </div>
      <TrustBar />
    </div>
  );
}
