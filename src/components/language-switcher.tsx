"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { localeCookie, type Locale } from "@/i18n/config";
import { Icon } from "./icon";
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav className="language-switcher" aria-label={label} dir="ltr">
      <Icon name="globe" />
      {(["ar", "en"] as const).map((target) => {
        const path = `/${target}${pathname.replace(/^\/(ar|en)(?=\/|$)/, "")}`;
        return (
          <Link
            key={target}
            lang={target}
            href={path}
            hrefLang={target}
            aria-current={target === locale ? "true" : undefined}
            prefetch={false}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              document.cookie = `${localeCookie}=${target}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
              router.push(path + location.search + location.hash, { scroll: false });
            }}
          >
            {target === "ar" ? "العربية" : "English"}
          </Link>
        );
      })}
    </nav>
  );
}
