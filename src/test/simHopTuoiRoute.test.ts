import { describe, it, expect, vi } from "vitest";
import type { NextRequest } from "next/server";
import { normalizeSIM } from "@/lib/simUtils";

/**
 * Khoá API /api/sim-hop-tuoi: năm âm lịch, loại lịch, ô số (bói / lọc), ngưỡng
 * điểm và phân trang. Kho giả lập để không gọi Supabase.
 */

const KHO = [
  normalizeSIM("0968686868", null, 2_000_000, "a"),
  normalizeSIM("0909686886", null, 5_000_000, "b"),
  normalizeSIM("0903714793", null, 600_000, "c"),
  normalizeSIM("0936866868", null, 150_000_000, "d"),
  normalizeSIM("0777782668", null, 1_200_000, "e"),
];

vi.mock("@/lib/serverSimData", () => ({
  getServerSims: async () => KHO,
}));

const { GET } = await import("@/app/api/sim-hop-tuoi/route");

const call = async (qs: string) => {
  const req = { nextUrl: new URL(`http://localhost/api/sim-hop-tuoi?${qs}`) } as unknown as NextRequest;
  const res = await GET(req);
  return { status: res.status, body: await res.json() };
};

describe("/api/sim-hop-tuoi", () => {
  it("dương lịch trước Tết → tính theo năm âm trước đó", async () => {
    const { body } = await call("ngay=20&thang=1&nam=1990&gio=5&gioitinh=nam");
    expect(body.profile).toMatchObject({ nam: 1989, thienCan: "Kỷ", diaChi: "Tỵ", menh: "Mộc" });
    expect(body.birth).toMatchObject({ nam: 1990, namAm: 1989, lich: "dl" });
  });

  it("âm lịch giữ nguyên năm, chấp nhận ngày 30", async () => {
    const { status, body } = await call("ngay=30&thang=2&nam=1990&gio=5&gioitinh=nam&lich=al");
    expect(status).toBe(200);
    expect(body.profile).toMatchObject({ nam: 1990, thienCan: "Canh", diaChi: "Ngọ" });
  });

  it("ngày dương lịch không có thật trả 400 kèm lý do", async () => {
    const { status, body } = await call("ngay=31&thang=2&nam=1990");
    expect(status).toBe(400);
    expect(body.error).toMatch(/không có ngày 31/);
  });

  it("thiếu năm dùng mặc định 1990 (không kẹp thành năm nhỏ nhất)", async () => {
    const { body } = await call("ngay=15&thang=8");
    expect(body.birth.nam).toBe(1990);
  });

  it("mặc định chỉ trả số từ 5.5 điểm; minScore=0 trả cả kho", async () => {
    const { body } = await call("ngay=15&thang=8&nam=1990&limit=50");
    expect(body.sims.every((s: { score: number }) => s.score >= 5.5)).toBe(true);
    const all = await call("ngay=15&thang=8&nam=1990&limit=50&minScore=0");
    expect(all.body.total).toBe(KHO.length);
  });

  it("đang tìm một dạng số thì KHÔNG ẩn số điểm thấp (khỏi tưởng hết hàng)", async () => {
    const tim = await call("ngay=15&thang=8&nam=1990&soCanXem=*93");
    expect(tim.body.sims.map((s: { digits: string }) => s.digits)).toEqual(["0903714793"]);
    expect(tim.body.sims[0].score).toBeLessThan(5.5); // số điểm thấp vẫn hiện khi đang tìm
  });

  it("ô số 10 chữ số (kể cả +84) → bói, không lọc kho", async () => {
    const { body } = await call("ngay=15&thang=8&nam=1990&minScore=0&soCanXem=%2B84903714793");
    expect(body.singleEvaluation?.digits).toBe("0903714793");
    expect(body.total).toBe(KHO.length);
  });

  it("ô số 2–9 chữ số trơn → lọc 'chứa'; có '*' → wildcard", async () => {
    const chua = await call("ngay=15&thang=8&nam=1990&minScore=0&soCanXem=6868");
    expect(chua.body.singleEvaluation).toBeNull();
    expect(chua.body.sims.map((s: { digits: string }) => s.digits).sort()).toEqual([
      "0909686886",
      "0936866868",
      "0968686868",
    ]);
    const sao = await call("ngay=15&thang=8&nam=1990&minScore=0&soCanXem=09*68");
    expect(sao.body.sims.map((s: { digits: string }) => s.digits).sort()).toEqual(["0936866868", "0968686868"]);
  });

  it("offset lớn không bị kẹp về 10.000", async () => {
    const { body } = await call("ngay=15&thang=8&nam=1990&offset=20000");
    expect(body.offset).toBe(20000);
    expect(body.sims).toEqual([]);
  });
});
