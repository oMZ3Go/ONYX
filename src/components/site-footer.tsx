import Image from "next/image";
import type { Messages } from "@/i18n/messages";
import { assets } from "@/modules/landing/assets";
import { Icon } from "./icon";
import { PageMotion } from "@/modules/landing/motion/page-motion";
import type { Locale } from "@/i18n/config";
import { contact, socialLinks } from "./contact-config";
import { BrushArtwork } from "./brush-artwork";
export function SiteFooter({ messages: m, locale }: { messages: Messages; locale: Locale }) {
  return (
    <footer className="site-footer">
      <div className="footer-atmosphere" aria-hidden="true">
        <span className="atmosphere-light" data-ambient="footer" />
        <BrushArtwork id="footer-brush" gesture reverse />
      </div>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand" data-reveal="footer">
            <a href="#home" className="brand-logo" aria-label={m.common.homeLabel}>
              <Image draggable={false} {...assets.logo.light} alt="ONYX" sizes="100px" />
            </a>
            <p>{m.footer.tagline}</p>
            <PageMotion key={locale} pause={m.common.pause} play={m.common.play} locale={locale} />
          </div>
          <nav aria-label={m.footer.explore} data-reveal="footer" data-delay="100">
            <h2>{m.footer.explore}</h2>
            <a href="#collection">{m.nav.shop}</a>
            <a href="#categories">{m.nav.templates}</a>
            <a href="#offers">{m.nav.offers}</a>
          </nav>
          <nav aria-label={m.footer.brand} data-reveal="footer" data-delay="200">
            <h2>{m.footer.brand}</h2>
            <a href="#about">{m.nav.about}</a>
            <a href="#how-it-works">{m.process.title}</a>
            <a href="#design-studio">{m.common.start}</a>
          </nav>
          <div
            id="contact"
            className="footer-contact"
            tabIndex={-1}
            data-reveal="footer"
            data-delay="300"
          >
            <h2>{m.footer.contact}</h2>
            <a className="contact-line" href={`mailto:${contact.email}`}>
              <Icon name="mail" />
              <bdi>{contact.email}</bdi>
            </a>
            <p className="contact-line">
              <Icon name="pin" />
              {m.footer.location}
            </p>
            <p className="contact-line">
              <Icon name="message" />
              {m.footer.contactNotice}
            </p>
            <div className="footer-social">
              <h2>{m.footer.follow}</h2>
              <div className="social-links">
                {(Object.keys(socialLinks) as (keyof typeof socialLinks)[]).map((key) => {
                  const href = socialLinks[key];
                  const content = (
                    <>
                      <Icon name={key} />
                      <span>{m.footer.social[key]}</span>
                    </>
                  );
                  return href ? (
                    <a key={key} href={href} aria-label={m.footer.social[key]}>
                      {content}
                    </a>
                  ) : (
                    <span
                      key={key}
                      role="link"
                      aria-disabled="true"
                      tabIndex={0}
                      aria-describedby="social-notice"
                    >
                      {content}
                    </span>
                  );
                })}
              </div>
              <p id="social-notice">{m.footer.socialNotice}</p>
            </div>
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
