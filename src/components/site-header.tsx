import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { assets } from "@/modules/landing/assets";
import { Icon } from "./icon";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNavigation } from "./mobile-navigation";
import { navigation } from "./navigation";
export function SiteHeader({ locale, messages: m }: { locale: Locale; messages: Messages }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="#home" aria-label={m.common.homeLabel} className="brand-logo">
          <Image
            {...assets.logo.light}
            alt="ONYX"
            sizes="100px"
            loading="eager"
            fetchPriority="high"
          />
        </a>
        <nav className="desktop-navigation" aria-label={m.nav.label}>
          {navigation.map(([key, href]) => (
            <a key={key} href={href}>
              {m.nav[key]}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <LanguageSwitcher locale={locale} label={m.nav.language} />
          <a href="#design-studio" className="button button-primary header-cta">
            {m.common.start}
            <Icon name="arrow" className="directional" />
          </a>
          <MobileNavigation nav={m.nav} start={m.common.start} />
        </div>
      </div>
    </header>
  );
}
