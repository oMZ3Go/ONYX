import Image from "next/image";
import type { Messages } from "@/i18n/messages";
import { assets } from "@/modules/landing/assets";
import { Icon } from "./icon";
import { PageMotion } from "@/modules/landing/motion/page-motion";
import type { Locale } from "@/i18n/config";
export function SiteFooter({ messages: m, locale }: { messages: Messages; locale: Locale }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#home" aria-label={m.common.homeLabel}>
              <Image {...assets.logo.light} alt="ONYX" sizes="100px" />
            </a>
            <p>{m.footer.tagline}</p>
            <PageMotion key={locale} pause={m.common.pause} play={m.common.play} locale={locale} />
          </div>
          <nav aria-label={m.footer.explore}>
            <h2>{m.footer.explore}</h2>
            <a href="#collection">{m.nav.shop}</a>
            <a href="#categories">{m.nav.templates}</a>
            <a href="#offers">{m.nav.offers}</a>
          </nav>
          <nav aria-label={m.footer.brand}>
            <h2>{m.footer.brand}</h2>
            <a href="#about">{m.nav.about}</a>
            <a href="#how-it-works">{m.process.title}</a>
            <a href="#design-studio">{m.common.start}</a>
          </nav>
          <div id="contact" className="footer-contact" tabIndex={-1}>
            <h2>{m.footer.contact}</h2>
            <p>{m.footer.contactNotice}</p>
            <a href="#home" className="back-to-top">
              {m.footer.top}
              <Icon name="arrow" />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {m.footer.copyright}</p>
          <p>{m.footer.signature}</p>
        </div>
      </div>
    </footer>
  );
}
