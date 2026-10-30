import Image from "next/image";
import type { Messages } from "@/i18n/messages";
import { assets } from "@/modules/landing/assets";
import { Icon } from "./icon";
import { PageMotion } from "@/modules/landing/motion/page-motion";
import type { Locale } from "@/i18n/config";
import { contact, founderLinks, socialLinks } from "./contact-config";
import { BrushArtwork } from "./brush-artwork";
export function SiteFooter({ messages: m, locale }: { messages: Messages; locale: Locale }) {
  return (
    <footer className="site-footer">
      <div className="footer-atmosphere" aria-hidden="true">
        <span className="atmosphere-light" data-ambient="footer" />
        <BrushArtwork id="footer-brush" gesture reverse />
      </div>
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand" data-reveal="footer">
            <a href="#home" className="brand-logo" aria-label={m.common.homeLabel}>
              <Image
                draggable={false}
                {...assets.logo.light}
                alt="ONYX"
                sizes="(max-width: 767px) 144px, (max-width: 1199px) 160px, 176px"
              />
            </a>
            <div className="footer-brand-copy">
              <h2>{m.footer.headline}</h2>
              <p>{m.footer.tagline}</p>
            </div>
          </div>
          <div className="footer-grid">
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
            <section
              className="footer-founders"
              aria-labelledby="footer-founders-title"
              data-reveal="footer"
              data-delay="250"
            >
              <h2 id="footer-founders-title">{m.footer.founders.title}</h2>
              <ul className="footer-founders-list">
                {(["mz", "tala"] as const).map((founder) => (
                  <li key={founder}>
                    <strong>
                      <a href={founderLinks[founder]} target="_blank" rel="noopener noreferrer">
                        <bdi>{m.footer.founders[founder]}</bdi>
                      </a>
                    </strong>
                    <span>{m.footer.founders.role}</span>
                  </li>
                ))}
              </ul>
            </section>
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
            </div>
          </div>
        </div>
        <section className="footer-social" aria-labelledby="footer-social-title">
          <div className="footer-social-copy">
            <h2 id="footer-social-title">{m.footer.follow}</h2>
            <p id="social-notice">{m.footer.socialNotice}</p>
          </div>
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
          <a href="#home" className="back-to-top">
            {m.footer.top}
            <Icon name="arrow" />
          </a>
        </section>
        <div className="footer-bottom">
          <PageMotion key={locale} pause={m.common.pause} play={m.common.play} locale={locale} />
          <p className="footer-copyright">© {m.footer.copyright}</p>
          <p className="footer-signature">{m.footer.signature}</p>
        </div>
      </div>
    </footer>
  );
}
