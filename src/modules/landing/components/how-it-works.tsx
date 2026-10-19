import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { Icon } from "@/components/icon";
export function HowItWorks({ locale, copy }: { locale: Locale; copy: Messages["process"] }) {
  return (
    <section id="how-it-works" className="process section-light" aria-labelledby="process-title">
      <div className="container">
        <div data-reveal>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="process-title">{copy.title}</h2>
        </div>
        <ol className="steps">
          {(["choose", "design", "order"] as const).map((key, index) => (
            <li key={key} data-reveal="step" data-delay={index * 140}>
              <span className="step-icon">
                <Icon name={key === "choose" ? "hanger" : key === "design" ? "palette" : "box"} />
              </span>
              <div>
                <h3>
                  <span className="step-number">
                    {new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(index + 1)}.
                  </span>{" "}
                  {copy[key].title}
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
