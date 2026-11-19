import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { assets } from "@/modules/landing/assets";
import { Icon } from "./icon";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNavigation } from "./mobile-navigation";
import { navigation, navigationIcons } from "./navigation";
import { NavigationMotion } from "./navigation-motion";
export function SiteHeader({ locale, messages: m }: { locale: Locale; messages: Messages }) {
  return (
    <header className="site-header">
      <NavigationMotion locale={locale} />
      <div className="container header-inner">
        <a href="#home" aria-label={m.common.homeLabel} className="brand-logo">
          <Image
            draggable={false}
            {...assets.logo.light}
            alt="ONYX"
            sizes="100px"
            loading="eager"
            fetchPriority="high"
          />
        </a>
        <nav className="desktop-navigation" aria-label={m.nav.label}>
          {navigation.map(([key, href]) => (
            <a key={key} href={href} data-section-link>
              <Icon name={navigationIcons[key]} />
              {m.nav[key]}
            </a>
          ))}
          <span className="nav-indicator" aria-hidden="true" />
        </nav>
        <div className="header-actions">
          <LanguageSwitcher locale={locale} label={m.nav.language} />
          <a href="#design-studio" className="button button-primary design-cta header-cta">
            {m.common.start}
            <Icon name="arrow" className="directional" />
          </a>
          <MobileNavigation
            key={locale}
            nav={m.nav}
            start={m.common.start}
            studioHref="#design-studio"
          />
        </div>
      </div>
    </header>
  );
}
