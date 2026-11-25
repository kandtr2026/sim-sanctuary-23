import type { ReactNode } from "react";

/**
 * Chữ Terra có đường dẫn thô ("… công cụ bói sim miễn phí tại /sim-phong-thuy …").
 * In nguyên đường dẫn ra trang thì xấu và không bấm được, nên mỗi luật dưới đây
 * nói: tìm đúng chuỗi `find` trong chữ gốc, thay bằng thẻ <a> có nhãn `label`
 * (chữ tự nhiên CÓ SẴN quanh đường dẫn). Luật chỉ được BỎ phần đường dẫn
 * ("tại /x", "(/x)") — không thêm chữ nào ngoài nguồn.
 */
export interface LinkRule {
  /** Chuỗi con nguyên văn trong chữ gốc, gồm cả nhãn và đường dẫn thô. */
  find: string;
  /** Chữ hiển thị — phải là chuỗi con có sẵn trong `find`. */
  label: string;
  href: string;
}

const firstHit = (text: string, rules: readonly LinkRule[]) => {
  let best: { at: number; rule: LinkRule } | null = null;
  for (const rule of rules) {
    const at = text.indexOf(rule.find);
    if (at !== -1 && (best === null || at < best.at)) best = { at, rule };
  }
  return best;
};

/** Bản chữ thuần (cho JSON-LD): giống hệt chữ hiển thị, chỉ không có thẻ <a>. */
export function toPlainText(text: string, rules: readonly LinkRule[]): string {
  let out = "";
  let rest = text;
  for (let hit = firstHit(rest, rules); hit; hit = firstHit(rest, rules)) {
    out += rest.slice(0, hit.at) + hit.rule.label;
    rest = rest.slice(hit.at + hit.rule.find.length);
  }
  return out + rest;
}

/** Bản hiển thị: các cụm khớp luật thành <a>, phần còn lại giữ nguyên. */
export function renderLinkedText(
  text: string,
  rules: readonly LinkRule[],
  linkClassName = "font-medium text-primary underline underline-offset-2 hover:no-underline",
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let key = 0;
  for (let hit = firstHit(rest, rules); hit; hit = firstHit(rest, rules)) {
    if (hit.at > 0) nodes.push(rest.slice(0, hit.at));
    nodes.push(
      <a key={key++} href={hit.rule.href} className={linkClassName}>
        {hit.rule.label}
      </a>,
    );
    rest = rest.slice(hit.at + hit.rule.find.length);
  }
  if (rest) nodes.push(rest);
  return nodes;
}
