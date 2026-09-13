#!/usr/bin/env node
/**
 * Đọc / đánh dấu "Góp ý cho Claude" mà A Khoa gửi từ ô nổi trên khu /admin.
 *
 * Ô đó nằm ở src/components/admin/GopYWidget.tsx, ghi vào `public.sim_gop_y` qua
 * route /api/admin/gop-y. Script này ĐỌC qua Supabase CLI (`supabase db query
 * --linked`) nên KHÔNG cần service role key ở máy — nó mượn access token của CLI
 * đã đăng nhập, đúng project đã `link` (xhlpawjvtqvtdkhjanwl / chonsomobifone).
 *
 *   node scripts/gop-y.mjs            # góp ý CHƯA xử, cũ trước mới sau
 *   node scripts/gop-y.mjs --tat-ca   # kể cả đã xử
 *   node scripts/gop-y.mjs --xong 3 5 # đánh dấu #3 và #5 là đã xử
 *   node scripts/gop-y.mjs --dem      # chỉ in số góp ý chưa xử (cho watcher)
 *   node scripts/gop-y.mjs --canh [N] # WATCHER: chờ tới khi có góp ý MỚI (quá
 *                                     # mốc N tổng dòng, mặc định = tổng hiện tại)
 *                                     # rồi in dòng mới và THOÁT. Chạy nền để
 *                                     # harness gọi Claude dậy bắt việc.
 */
import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/**
 * Chạy 1 câu SQL trên remote qua CLI, trả về mảng rows đã parse.
 *
 * SQL truyền qua FILE TẠM (-f) chứ không nhét inline: né hẳn chuyện quote dấu
 * nháy/ngoặc trên Windows cmd. Gọi qua execSync (shell) vì spawn thẳng `npx.cmd`
 * bị Node chặn (EINVAL) từ bản vá bảo mật .cmd.
 */
function chay(sql) {
  const tmp = path.join(os.tmpdir(), `simgopy_${Date.now()}_${Math.random().toString(36).slice(2)}.sql`);
  writeFileSync(tmp, sql, "utf8");
  try {
    const out = execSync(`npx supabase db query --linked -f "${tmp}"`, {
      cwd: repo,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    });
    // CLI trả { boundary, rows, warning }. Lấy rows; chịu được rác dòng đầu.
    const i = out.indexOf("{");
    const j = JSON.parse(i >= 0 ? out.slice(i) : out);
    return Array.isArray(j?.rows) ? j.rows : [];
  } finally {
    try {
      unlinkSync(tmp);
    } catch {
      /* kệ */
    }
  }
}

const argv = process.argv.slice(2);
const co = (c) => argv.includes(c);

try {
  if (co("--xong")) {
    const ids = argv
      .slice(argv.indexOf("--xong") + 1)
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) {
      console.error("Thiếu id. Ví dụ: node scripts/gop-y.mjs --xong 3 5");
      process.exit(1);
    }
    // Chỉ nội suy số nguyên đã lọc — không nhét chuỗi ngoài vào câu lệnh.
    chay(
      `update public.sim_gop_y set da_xu = true, xu_luc = now() where id in (${ids.join(",")})`,
    );
    console.log(`Đã đánh dấu xong: #${ids.join(" #")}`);
  } else if (co("--dem")) {
    const r = chay("select count(*)::int as n from public.sim_gop_y where da_xu = false");
    console.log(r[0]?.n ?? 0);
  } else if (co("--canh")) {
    const demTong = () => chay("select count(*)::int as n from public.sim_gop_y")[0]?.n ?? 0;
    const arg = Number(argv[argv.indexOf("--canh") + 1]);
    let moc = Number.isInteger(arg) && arg >= 0 ? arg : demTong();
    console.log(`[canh] đang canh sim_gop_y — mốc ${moc} dòng, poll mỗi 30s…`);
    for (;;) {
      await new Promise((r) => setTimeout(r, 30000));
      let n;
      try {
        n = demTong();
      } catch (e) {
        // Blip mạng/CLI: bỏ qua vòng này, canh tiếp — đừng để watcher chết oan.
        console.error("[canh] lỗi poll, thử lại:", e?.message || e);
        continue;
      }
      if (n > moc) {
        const moi = chay(
          `select id, luc, nguoi, duong_dan, tieu_de, phien_ban, noi_dung
             from public.sim_gop_y order by id desc limit ${n - moc}`,
        ).reverse();
        console.log(`=== CÓ GÓP Ý MỚI: ${n} dòng (mốc ${moc}) ===`);
        for (const d of moi) {
          const gio = new Date(d.luc).toLocaleString("vi-VN");
          const ban = d.phien_ban ? `  bản ${d.phien_ban}` : "";
          console.log(`#${d.id}  ${gio}  ${d.nguoi}${ban}`);
          console.log(`   màn: ${d.duong_dan}${d.tieu_de ? `  (${d.tieu_de})` : ""}`);
          console.log(`   ${String(d.noi_dung).replace(/\n/g, "\n   ")}\n`);
        }
        process.exit(0);
      }
    }
  } else {
    const dieuKien = co("--tat-ca") ? "" : "where da_xu = false";
    const r = chay(
      `select id, luc, nguoi, duong_dan, tieu_de, phien_ban, da_xu, noi_dung
         from public.sim_gop_y ${dieuKien} order by id asc limit 100`,
    );
    if (!r.length) {
      console.log("Chưa có góp ý mới.");
    } else {
      console.log(`${r.length} góp ý${dieuKien ? " CHƯA XỬ" : ""}:\n`);
      for (const d of r) {
        const gio = new Date(d.luc).toLocaleString("vi-VN");
        const ban = d.phien_ban ? `  bản ${d.phien_ban}` : "";
        console.log(`#${d.id}  ${gio}  ${d.nguoi}${d.da_xu ? "  [đã xử]" : ""}${ban}`);
        console.log(`   màn: ${d.duong_dan}${d.tieu_de ? `  (${d.tieu_de})` : ""}`);
        console.log(`   ${String(d.noi_dung).replace(/\n/g, "\n   ")}\n`);
      }
    }
  }
} catch (e) {
  console.error("Lỗi đọc góp ý:", e?.message || e);
  process.exit(1);
}
