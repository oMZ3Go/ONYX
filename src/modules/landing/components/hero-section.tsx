import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { assets } from "../assets";
import { HandwrittenNote } from "./handwritten-note";
import { AnimatedHeroHeadline } from "../motion/animated-hero-headline";
export function HeroSection({ locale, messages: m }: { locale: Locale; messages: Messages }) {
  return (
    <section id="home" className="hero" aria-labelledby="hero-title" data-motion-section>
      <div className="hero-environment">
        <Image
          src={assets.hero.background.src}
          alt=""
          fill
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <div className="container hero-layout">
        <AnimatedHeroHeadline key={locale} locale={locale} copy={m.hero} common={m.common} />
        <div className="hero-artwork">
          <div className="hero-glow" />
          <div className="hero-entrance">
            <div className="hero-float" data-float="hero">
              <div className="hero-hover">
                <Image
                  {...assets.hero.hoodies}
                  alt={m.hero.image}
                  sizes="(max-width: 767px) 100vw, (max-width: 1100px) 60vw, 62vw"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            </div>
          </div>
          <HandwrittenNote
            asset={assets.hero.note}
            className="hero-note"
            sizes="(max-width: 767px) 70px, 110px"
            delay={250}
          />
        </div>
      </div>
    </section>
  );
}
