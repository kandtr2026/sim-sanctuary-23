import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { PT_COPY, PT_LINKS } from "@/app/sim-phong-thuy-hop-menh/copy";
import { renderLinkedText, toPlainText } from "@/app/sim-phong-thuy-hop-menh/linkedText";
import { NGU_HANH_LIST } from "@/lib/phongThuy";

/**
 * Trang "Sim Phong Thủy MobiFone" (/sim-phong-thuy-hop-menh, 25/11/2026):
 * chữ nguyên văn từ Terra, đường dẫn thô phải thành <a>, không thêm chữ.
 */
const ROOT = path.resolve(__dirname, "../..");
const allTexts = [...PT_COPY.sections.map((s) => s.body), ...PT_COPY.faqs.map((f) => f.a)];

describe("chữ trang Sim Phong Thủy MobiFone", () => {
  it("khớp nguyên văn file nguồn của Terra (nếu file còn trong máy)", () => {
    const src = path.join(ROOT, "TASK_PHONGTHUY_COPY_20261125.json");
    if (!existsSync(src)) return;
    expect(JSON.parse(readFileSync(src, "utf8"))).toEqual(PT_COPY);
  });

  it("không còn đường dẫn thô nào sau khi gắn link", () => {
    for (const t of allTexts) expect(toPlainText(t, PT_LINKS), t).not.toMatch(/\/sim-|\/[a-z-]+\/</);
  });

  it("mỗi luật: nhãn là chữ có sẵn trong cụm gốc, chỉ bỏ phần đường dẫn", () => {
    for (const r of PT_LINKS) {
      expect(r.find.startsWith(r.label), r.find).toBe(true);
      expect(r.find.slice(r.label.length), r.find).toMatch(/^( tại \/\S+| \(\/\S+\))$/);
    }
  });

  it("route đích của link có thật", () => {
    const slugs = NGU_HANH_LIST.map((x) => x.slug);
    for (const r of PT_LINKS) {
      const m = r.href.match(/^\/sim-theo-menh\/([a-z]+)$/);
      if (m) {
        expect(slugs, r.href).toContain(m[1]);
        expect(existsSync(path.join(ROOT, "src/app/sim-theo-menh/[hanh]/page.tsx"))).toBe(true);
      } else {
        expect(existsSync(path.join(ROOT, "src/app", r.href, "page.tsx")), r.href).toBe(true);
      }
    }
  });

  it("render thành thẻ <a>, /sim-hop-tuoi/<năm> → trang sim hợp tuổi theo năm sinh", () => {
    const html = renderToStaticMarkup(<p>{renderLinkedText(PT_COPY.faqs[1].a, PT_LINKS)}</p>);
    expect(html).toContain('href="/sim-hop-tuoi"');
    expect(html).toContain(">trang sim hợp tuổi theo năm sinh</a>");
    expect(html).not.toContain("&lt;năm&gt;");
    const s1 = renderToStaticMarkup(<p>{renderLinkedText(PT_COPY.sections[1].body, PT_LINKS)}</p>);
    for (const slug of ["kim", "moc", "thuy", "hoa", "tho"]) expect(s1).toContain(`href="/sim-theo-menh/${slug}"`);
  });

  it("không có 'chúng tôi'", () => {
    expect(JSON.stringify(PT_COPY).toLowerCase()).not.toContain("chúng tôi");
  });
});
