import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { Icon } from "@/components/icon";
import { BrushArtwork } from "@/components/brush-artwork";
export function HowItWorks({ locale, copy }: { locale: Locale; copy: Messages["process"] }) {
  return (
    <section id="how-it-works" className="process section-light" aria-labelledby="process-title">
      <div className="process-atmosphere" aria-hidden="true">
        <span className="atmosphere-light" data-ambient="paper" />
        <BrushArtwork id="process-brush" gesture />
      </div>
      <div className="container">
        <div data-reveal>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="process-title">{copy.title}</h2>
        </div>
        <ol className="steps" data-process data-process-state="static">
          {(["choose", "design", "order"] as const).map((key, index) => (
            <li key={key}>
              <span className="step-icon">
                <Icon name={key === "choose" ? "hanger" : key === "design" ? "palette" : "box"} />
              </span>
              <div>
                <h3>
                  <span className="step-number">
                    {new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(index + 1)}.
                  </span>{" "}
                  <span className="step-title">{copy[key].title}</span>
                </h3>
                <p>{copy[key].description}</p>
              </div>
              <span className="step-connector" aria-hidden="true">
                <Icon name="arrow" className="directional" />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
