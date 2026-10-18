import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("foundation page", () => {
  it("renders a clear Phase 00 page with a working in-page destination", () => {
    const html = renderToStaticMarkup(createElement(HomePage));

    expect(html).toMatch(/<h1\b[^>]*>ONYX يبدأ من هنا\.<\/h1>/);
    expect(html).toContain("Phase 00 / Foundation");
    expect(html).toContain('href="#foundation"');
    expect(html).toContain('id="foundation"');
    expect(html).toContain('id="main-content"');
    expect(html).toContain("الألوان والخطوط مؤقتة");
  });
});
