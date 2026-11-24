import { describe, expect, it } from "vitest";
import { STUDIES } from "./learn/studies";
import {
  REFERENCES,
  authorBlock,
  formatAuthors,
  referencesByIds,
  sortReferences,
  titleSentence,
} from "./references";

describe("reference list", () => {
  it("has unique ids and https links", () => {
    const ids = new Set(REFERENCES.map((r) => r.id));
    expect(ids.size).toBe(REFERENCES.length);
    for (const r of REFERENCES) expect(r.url).toMatch(/^https:\/\//);
  });

  it("covers every study in the sleep guide", () => {
    const ids = new Set(REFERENCES.map((r) => r.id));
    for (const s of STUDIES) expect(ids.has(s.id), s.id).toBe(true);
  });

  it("gives every journal article a volume and pages or an article number", () => {
    for (const r of REFERENCES.filter((x) => x.journal)) {
      expect(r.volume, r.id).toBeTruthy();
      expect(Boolean(r.pages || r.article), r.id).toBe(true);
    }
  });
});

describe("APA formatting", () => {
  it("joins authors with an ampersand before the last", () => {
    expect(formatAuthors(["Thacher, P. V."])).toBe("Thacher, P. V.");
    expect(formatAuthors(["A, A.", "B, B."])).toBe("A, A., & B, B.");
    expect(formatAuthors(["A, A.", "B, B.", "C, C."])).toBe("A, A., B, B., & C, C.");
  });

  it("shows 19 authors, an ellipsis and the last one when there are 21 or more", () => {
    const many = Array.from({ length: 32 }, (_, i) => `Author${i + 1}, X.`);
    const out = formatAuthors(many);
    expect(out).toContain("Author19, X., . . . Author32, X.");
    expect(out).not.toContain("Author20,");
  });

  it("ends group authors and titles with one full stop", () => {
    const hc = REFERENCES.find((r) => r.id === "health-canada-caffeine")!;
    expect(authorBlock(hc)).toBe("Health Canada.");
    expect(titleSentence("Are sleep programs successful?")).toBe("Are sleep programs successful?");
    expect(titleSentence("A marker")).toBe("A marker.");
  });

  it("sorts letter by letter, ignoring accents, shorter author lists first", () => {
    const order = sortReferences(REFERENCES).map((r) => r.id);
    expect(order[0]).toBe("akerstedt-folkard-1997");
    expect(order[1]).toBe("akerstedt-2004");
    expect(order.indexOf("health-canada-caffeine")).toBeLessThan(
      order.indexOf("hershner-chervin-2014"),
    );
    expect(order.indexOf("hershner-chervin-2014")).toBeLessThan(
      order.indexOf("hershner-obrien-2018"),
    );
    expect(order.indexOf("roenneberg-2004")).toBeLessThan(order.indexOf("roenneberg-2003"));
    expect(order.at(-1)).toBe("yoo-2007");
  });

  it("throws on an unknown id instead of citing nothing", () => {
    expect(() => referencesByIds(["not-a-source"])).toThrow();
  });
});
