import { describe, it, expect } from "vitest";
import {
  HANH_CUA_CHU_SO,
  chuSoCuaHanh,
  chuSoHopMenh,
  hanhSinhCho,
  hopTuoiSo,
  nguHanhCuaSo,
  type NguHanh,
} from "@/lib/phongThuy";
import {
  buildProfile,
  hanhChinhCuaSo,
  nguHanhCuaSo as hanhMotChuSo,
  scoreSim,
} from "@/lib/simHopTuoi";
import { countMenh, normalizeSIM, type NormalizedSIM } from "@/lib/simUtils";
import { filterSims } from "@/lib/simFilter";
import { HANH_META } from "@/app/sim-hop-menh/_lib/hanhMeta";

/**
 * Khoá bảng chữ số → ngũ hành CHUẨN của toàn site (A Khoa chốt 24/09/2026,
 * site gọi là "Hà Đồ"): 0, 1 Thủy · 2, 5, 8 Thổ · 3, 4 Mộc · 6, 7 Kim · 9 Hỏa.
 *
 * Lỗi cũ: phongThuy.ts (chip hành, lọc/đếm theo mệnh, hợp tuổi nhẹ) dùng bảng
 * 1,6 Thủy · 2,7 Hỏa · 3,8 Mộc · 4,9 Kim · 5,0 Thổ trong khi engine simHopTuoi
 * dùng bảng chuẩn → cùng một số mà chip ghi một hành, điểm hợp tuổi luận hành khác.
 */

const BANG_CHUAN: Record<string, NguHanh> = {
  "0": "Thủy",
  "1": "Thủy",
  "2": "Thổ",
  "3": "Mộc",
  "4": "Mộc",
  "5": "Thổ",
  "6": "Kim",
  "7": "Kim",
  "8": "Thổ",
  "9": "Hỏa",
};

const NGU_HANH: NguHanh[] = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];

// Số mẫu KHÔNG hòa số lượng giữa các hành → hành chính là duy nhất.
const MAU: [string, NguHanh][] = [
  ["0909111111", "Thủy"], // 0,0,1×6 = 8 Thủy · 9×2 Hỏa
  ["0258825825", "Thổ"], // 0 Thủy · 2,5,8×9 Thổ
  ["0966667777", "Kim"], // 6,7×8 Kim
  ["0934343434", "Mộc"], // 3,4×8 Mộc
  ["0999999999", "Hỏa"], // 9×9 Hỏa
];

const sim = (digits: string, price = 1_000_000): NormalizedSIM => normalizeSIM(digits, null, price, digits);

describe("bảng chữ số → ngũ hành chuẩn (Hà Đồ)", () => {
  it("HANH_CUA_CHU_SO khớp đúng bảng A Khoa chốt, đủ 10 chữ số", () => {
    expect({ ...HANH_CUA_CHU_SO }).toEqual(BANG_CHUAN);
  });

  it("từng chữ số lẻ: phongThuy.nguHanhCuaSo và simHopTuoi.nguHanhCuaSo cùng một hành", () => {
    for (const [d, h] of Object.entries(BANG_CHUAN)) {
      expect(nguHanhCuaSo(d).chinh, `phongThuy ${d}`).toBe(h);
      expect(hanhMotChuSo(d), `simHopTuoi ${d}`).toBe(h);
      expect(hanhMotChuSo(Number(d)), `simHopTuoi số ${d}`).toBe(h);
    }
    expect(hanhMotChuSo("x")).toBeNull();
  });

  it("không còn dấu vết bảng cũ (6 Thủy · 2,7 Hỏa · 8 Mộc · 4,9 Kim · 0 Thổ)", () => {
    expect(HANH_CUA_CHU_SO["6"]).not.toBe("Thủy");
    expect(HANH_CUA_CHU_SO["2"]).not.toBe("Hỏa");
    expect(HANH_CUA_CHU_SO["7"]).not.toBe("Hỏa");
    expect(HANH_CUA_CHU_SO["8"]).not.toBe("Mộc");
    expect(HANH_CUA_CHU_SO["4"]).not.toBe("Kim");
    expect(HANH_CUA_CHU_SO["9"]).not.toBe("Kim");
    expect(HANH_CUA_CHU_SO["0"]).not.toBe("Thổ");
  });

  it("chuSoCuaHanh chia 0–9 thành 5 nhóm không chồng lấn", () => {
    expect(chuSoCuaHanh("Thủy")).toEqual(["0", "1"]);
    expect(chuSoCuaHanh("Thổ")).toEqual(["2", "5", "8"]);
    expect(chuSoCuaHanh("Mộc")).toEqual(["3", "4"]);
    expect(chuSoCuaHanh("Kim")).toEqual(["6", "7"]);
    expect(chuSoCuaHanh("Hỏa")).toEqual(["9"]);
    const tatCa = NGU_HANH.flatMap(chuSoCuaHanh).sort();
    expect(tatCa).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });
});

describe("ngũ hành của dãy số — mọi nơi dùng CÙNG một bảng", () => {
  it("số mẫu ra đúng hành chính", () => {
    for (const [so, h] of MAU) expect(nguHanhCuaSo(so).chinh, so).toBe(h);
  });

  it("phân bố đếm theo bảng chuẩn", () => {
    expect(nguHanhCuaSo("0909111111").phanBo).toEqual({ Kim: 0, Mộc: 0, Thủy: 8, Hỏa: 2, Thổ: 0 });
    expect(nguHanhCuaSo("0258825825").phanBo).toEqual({ Kim: 0, Mộc: 0, Thủy: 1, Hỏa: 0, Thổ: 9 });
    // Chấp nhận số có dấu chấm như khi hiển thị.
    expect(nguHanhCuaSo("0909.111.111").chinh).toBe("Thủy");
  });

  it("phongThuy.nguHanhCuaSo === engine hanhChinhCuaSo / scoreSim.simHanh (mọi mệnh)", () => {
    for (const [so] of MAU) {
      const chinh = nguHanhCuaSo(so).chinh;
      for (const menh of NGU_HANH) {
        expect(hanhChinhCuaSo(so, menh), `${so} / ${menh}`).toBe(chinh);
      }
      for (const nam of [1984, 1990, 1995, 2000, 2003]) {
        expect(scoreSim(sim(so), buildProfile(nam, 0, "nam")).simHanh, `${so} / ${nam}`).toBe(chinh);
      }
    }
  });

  it("hợp tuổi nhẹ (/sim/[digits]) luận theo hành chuẩn", () => {
    // 1990 Canh Ngọ — Lộ Bàng Thổ; số toàn 2,5,8 → cùng hành Thổ.
    const kq = hopTuoiSo("0258825825", 1990);
    expect(kq?.menh).toBe("Thổ");
    expect(kq?.hanhSo).toBe("Thổ");
    expect(kq?.tone).toBe("tot");
    // 2000 Canh Thìn — Bạch Lạp Kim; số toàn 9 (Hỏa) → Hỏa khắc Kim.
    const kq2 = hopTuoiSo("0999999999", 2000);
    expect(kq2?.hanhSo).toBe("Hỏa");
    expect(kq2?.tone).toBe("xau");
  });

  it("lọc & đếm kho theo mệnh (sidebar, /sim-theo-menh) dùng bảng chuẩn", () => {
    const kho = MAU.map(([so]) => sim(so));
    expect(countMenh(kho)).toEqual({ Kim: 1, Mộc: 1, Thủy: 1, Hỏa: 1, Thổ: 1 });
    for (const [so, h] of MAU) {
      expect(filterSims(kho, { menh: h }).map((s) => s.rawDigits), h).toEqual([so]);
    }
  });
});

describe("số hợp theo mệnh — suy từ bảng chuẩn + tương sinh", () => {
  it("chuSoHopMenh giữ đúng chip 'Số hợp' ở /sim-phong-thuy", () => {
    expect(chuSoHopMenh("Kim")).toEqual(["2", "5", "8", "6", "7"]);
    expect(chuSoHopMenh("Mộc")).toEqual(["0", "1", "3", "4"]);
    expect(chuSoHopMenh("Thủy")).toEqual(["6", "7", "0", "1"]);
    expect(chuSoHopMenh("Hỏa")).toEqual(["3", "4", "9"]);
    expect(chuSoHopMenh("Thổ")).toEqual(["9", "2", "5", "8"]);
  });

  it("hanhSinhCho đi ngược vòng tương sinh", () => {
    expect(hanhSinhCho("Kim")).toBe("Thổ");
    expect(hanhSinhCho("Mộc")).toBe("Thủy");
    expect(hanhSinhCho("Thủy")).toBe("Kim");
    expect(hanhSinhCho("Hỏa")).toBe("Mộc");
    expect(hanhSinhCho("Thổ")).toBe("Hỏa");
  });

  it("mô tả /sim-hop-menh/[hanh] nêu đúng nhóm số của bảng chuẩn", () => {
    for (const h of NGU_HANH) {
      const sinh = hanhSinhCho(h);
      const moTa = HANH_META[h].description;
      expect(moTa, h).toContain(`${chuSoCuaHanh(sinh).join(", ")} (${sinh} sinh ${h})`);
      expect(moTa, h).toContain(`${chuSoCuaHanh(h).join(", ")} đồng hành`);
    }
  });
});
