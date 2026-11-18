import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ViewTransition } from "react";
import { parseWorkspaceTheme, workspaceThemeKey } from "@/modules/design-studio/preferences";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { studioCatalog } from "@/modules/design-studio/catalog/read-catalog";
import { availableVariants } from "@/modules/design-studio/catalog/selectors";
import { StudioShell } from "@/modules/design-studio/studio-shell";
import "@/modules/design-studio/studio.css";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { designStudio } = await getDictionary(locale);
  return {
    title: `${designStudio.title} | ONYX`,
    description: designStudio.description,
    robots: { index: false, follow: false },
    alternates: { languages: { ar: "/ar/design-studio", en: "/en/design-studio" } },
  };
}
export default async function DesignStudioPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const [messages, catalog] = await Promise.all([
    getDictionary(locale),
    studioCatalog.getCatalog(),
  ]);
  const product = catalog.products.find((item) => availableVariants(item).length > 0);
  if (!product)
    return (
      <main id="main-content" className="ds-unavailable">
        <h1>{messages.designStudio.title}</h1>
        <p>{messages.designStudio.unavailable}</p>
        <a href={`/${locale}`}>{messages.designStudio.home}</a>
      </main>
    );
  return (
    <ViewTransition enter={{ "studio-open": "onyx-studio-enter", default: "none" }} default="none">
      <StudioShell
        key={locale}
        locale={locale}
        copy={messages.designStudio}
        catalog={catalog}
        product={product}
        initialTheme={parseWorkspaceTheme((await cookies()).get(workspaceThemeKey)?.value)}
      />
    </ViewTransition>
  );
}
