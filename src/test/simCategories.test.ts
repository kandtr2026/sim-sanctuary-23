import { describe, expect, it } from "vitest";
import {
  CATEGORY_PRIORITY,
  calculateBeautyScore,
  detectSimCategories,
  isVIPSim,
  primarySimCategory,
} from "@/lib/simCategories";
import { detectSimTags } from "@/lib/simUtils";

/**
 * Luật danh mục bóc từ simthanglong.vn (09/2026). Fixture dưới đây là DỮ LIỆU
 * THẬT của họ, không phải đáp án tự nghĩ ra:
 *  - MEMBERSHIP: hỏi web họ từng số × 20 danh mục (tìm kiếm cô lập 1 số + bộ lọc
 *    ?c=<id>), ghi lại số đó hiện ở những danh mục nào. Đã bỏ VIP (theo giá) và
 *    Ông địa (A Khoa bỏ 14/09).
 *  - PRIMARY: nhãn "Loại sim" họ in trên dòng của số đó.
 * Bộ đầy đủ ~20k số ở _research_stl_rules/ (ngoài repo): nhãn chính khớp 99,94%.
 */
const MEMBERSHIP: [string, string[]][] = [
  ["0922860068", ["Lộc phát","Gánh đảo"]], // 0922.860.068
  ["0914370111", ["Tam hoa","Dễ nhớ","Đầu số cổ"]], // 091.4370.111
  ["0387000111", ["Tam hoa kép","Tam hoa","Dễ nhớ"]], // 0387.000.111
  ["0929500002", ["Tứ quý giữa","Dễ nhớ"]], // 0929.500002
  ["0857300102", ["Dễ nhớ","Số độc","Năm sinh"]], // 0857.30.01.02
  ["0921270279", ["Thần tài","Dễ nhớ","Năm sinh"]], // 0921.270.279
  ["0879000123", ["Tiến lên"]], // 0879.00.0123
  ["0917880440", ["Gánh đảo","Đầu số cổ"]], // 0917.880.440
  ["0942210038", ["Đầu số cổ"]], // 0942.210.038
  ["0877200000", ["Ngũ quý","Dễ nhớ"]], // 08772.00000
  ["0876950000", ["Tứ quý"]], // 0876.95.0000
  ["0876000003", ["Ngũ quý giữa","Dễ nhớ"]], // 0876.000003
  ["0983000000", ["Lục quý","Đầu số cổ"]], // 0983.000000
  ["0961111114", ["Lục quý giữa","Dễ nhớ","Năm sinh"]], // 096.1111114
  ["0902030260", ["Đầu số cổ","Năm sinh"]], // 0902.03.02.60
  ["0326640021", []], // 0326.640.021
  ["0901190260", ["Năm sinh"]], // 0901.19.02.60
  ["0824530389", ["Số độc"]], // 08245.30389
  ["0849210555", ["Tam hoa","Dễ nhớ","Năm sinh"]], // 0849.21.05.55
  ["0528120666", ["Tam hoa","Dễ nhớ","Năm sinh"]], // 0528.120.666
  ["0843800777", ["Tam hoa","Dễ nhớ"]], // 084.3800.777
  ["0587720888", ["Tam hoa","Dễ nhớ"]], // 0587.720.888
  ["0582040888", ["Tam hoa","Dễ nhớ","Năm sinh"]], // 0582.040.888
  ["0876830999", ["Tam hoa","Dễ nhớ"]], // 0876.830.999
  ["0928920777", ["Tam hoa","Dễ nhớ"]], // 0928.920.777
  ["0839841555", ["Tam hoa","Dễ nhớ"]], // 083.9841.555
  ["0846981777", ["Tam hoa","Dễ nhớ"]], // 084.6981.777
  ["0941062000", ["Tam hoa","Dễ nhớ","Năm sinh"]], // 0941.06.2000
  ["0528241888", ["Tam hoa","Dễ nhớ"]], // 0528.241.888
  ["0922532777", ["Tam hoa","Dễ nhớ"]], // 0922.532.777
  ["0917892999", ["Tam hoa","Dễ nhớ","Đầu số cổ"]], // 091.7892.999
  ["0983113666", ["Tam hoa","Dễ nhớ","Đầu số cổ"]], // 098.3113.666
  ["0528703888", ["Tam hoa","Dễ nhớ"]], // 0528.703.888
  ["0389943999", ["Tam hoa","Dễ nhớ"]], // 038.9943.999
  ["0523304666", ["Tam hoa","Dễ nhớ"]], // 0523.304.666
  ["0876284888", ["Tam hoa","Dễ nhớ"]], // 0876.284.888
  ["0889324888", ["Tam hoa","Dễ nhớ"]], // 088.9324.888
  ["0911485000", ["Tam hoa","Dễ nhớ"]], // 091.1485.000
  ["0876185999", ["Tam hoa","Dễ nhớ"]], // 0876.185.999
  ["0922785777", ["Tam hoa","Dễ nhớ"]], // 0922.785.777
  ["0876010010", ["Taxi","Dễ nhớ","Gánh đảo"]], // 0876.010.010
  ["0942260260", ["Taxi","Đầu số cổ","Năm sinh"]], // 0942.260.260
  ["0878940940", ["Taxi"]], // 0878.940.940
  ["0523560560", ["Taxi"]], // 0523.560.560
  ["0876170170", ["Taxi","Năm sinh"]], // 0876.170.170
  ["0877251251", ["Taxi","Năm sinh"]], // 0877.251.251
  ["0587052052", ["Taxi"]], // 0587.052.052
  ["0562501501", ["Taxi"]], // 0562.501.501
  ["0927110011", ["Lặp kép","Gánh đảo"]], // 0927.11.00.11
  ["0943790077", ["Lặp kép","Đầu số cổ"]], // 0943.79.0077
  ["0917810505", ["Lặp kép","Dễ nhớ","Đầu số cổ"]], // 0917.81.0505
  ["0916271155", ["Lặp kép","Đầu số cổ","Năm sinh"]], // 0916.27.11.55
  ["0797970404", ["Lặp kép","Dễ nhớ","Số độc"]], // 079.797.0404
  ["0927621919", ["Lặp kép","Dễ nhớ","Số độc"]], // 0927.62.1919
  ["0916951717", ["Lặp kép","Dễ nhớ","Đầu số cổ"]], // 0916.95.1717
  ["0832462828", ["Lặp kép","Dễ nhớ","Số độc"]], // 083.246.2828
  ["0948942277", ["Lặp kép","Đầu số cổ"]], // 0948.94.2277
  ["0921073838", ["Lặp kép","Dễ nhớ"]], // 0921.07.3838
];

const PRIMARY: [string, string][] = [
  ["0876526526", "Taxi"], // 0876.526.526
  ["0569703703", "Taxi"], // 0569.703.703
  ["0947534534", "Taxi"], // 0947.534.534
  ["0858840840", "Taxi"], // 0858.840.840
  ["0563170170", "Taxi"], // 0563.170.170
  ["0879746746", "Taxi"], // 0879.746.746
  ["0878404040", "Lặp kép"], // 0878.40.40.40
  ["0928004400", "Lặp kép"], // 0928.00.44.00
  ["0563406688", "Lặp kép"], // 0563.40.6688
  ["0919166868", "Lặp kép"], // 091.916.6868
  ["0915731155", "Lặp kép"], // 0915.73.1155
  ["0945640808", "Lặp kép"], // 094.564.0808
  ["0876740888", "Tam hoa"], // 0876.740.888
  ["0852423555", "Tam hoa"], // 085.2423.555
  ["0568704888", "Tam hoa"], // 0568.704.888
  ["0583270666", "Tam hoa"], // 0583.270.666
  ["0926821777", "Tam hoa"], // 0926.821.777
  ["0971525999", "Tam hoa"], // 0971.525.999
  ["0879777999", "Tam hoa kép"], // 0879.777.999
  ["0879555000", "Tam hoa kép"], // 0879.555.000
  ["0879111000", "Tam hoa kép"], // 0879.111.000
  ["0876333777", "Tam hoa kép"], // 0876.333.777
  ["0878555000", "Tam hoa kép"], // 0878.555.000
  ["0376444666", "Tam hoa kép"], // 0376.444.666
  ["0878016886", "Lộc phát"], // 0878.01.6886
  ["0926695986", "Lộc phát"], // 0926.695.986
  ["0942865386", "Lộc phát"], // 0942.86.53.86
  ["0969893168", "Lộc phát"], // 096.98.93.168
  ["0921562368", "Lộc phát"], // 0921.562.368
  ["0369191486", "Lộc phát"], // 036.9191.486
  ["0923826996", "Gánh đảo"], // 0923.82.6996
  ["0948746996", "Gánh đảo"], // 0948.74.6996
  ["0913487997", "Gánh đảo"], // 0913.48.7997
  ["0929078998", "Gánh đảo"], // 0929.07.8998
  ["0922719889", "Gánh đảo"], // 0922.71.9889
  ["0923895598", "Gánh đảo"], // 0923.895.598
  ["0876466664", "Tứ quý giữa"], // 0876.466664
  ["0798888206", "Tứ quý giữa"], // 079.8888.206
  ["0926111170", "Tứ quý giữa"], // 0926.1111.70
  ["0389222291", "Tứ quý giữa"], // 0389.2222.91
  ["0394666625", "Tứ quý giữa"], // 0394.6666.25
  ["0913333947", "Tứ quý giữa"], // 091.3333.947
  ["0916427227", "Dễ nhớ"], // 091.642.7227
  ["0901510503", "Dễ nhớ"], // 090.151.0503
  ["0917502503", "Dễ nhớ"], // 0917.502.503
  ["0943084947", "Dễ nhớ"], // 094.308.4947
  ["0968262260", "Dễ nhớ"], // 0968.262.260
  ["0868360260", "Dễ nhớ"], // 0868.360.260
  ["0928719779", "Thần tài"], // 0928.71.9779
  ["0928852979", "Thần tài"], // 0928.852.979
  ["0923326779", "Thần tài"], // 0923.326.779
  ["0925286779", "Thần tài"], // 0925.286.779
  ["0923116979", "Thần tài"], // 0923.116.979
  ["0929892579", "Thần tài"], // 0929.892.579
  ["0876842345", "Tiến lên"], // 087.684.2345
  ["0925712789", "Tiến lên"], // 0925.712.789
  ["0878496789", "Tiến lên"], // 087.849.6789
  ["0855289234", "Tiến lên"], // 0855.289.234
  ["0866345789", "Tiến lên"], // 086.6345.789
  ["0878528910", "Tiến lên"], // 08785.28910
  ["0876950000", "Tứ quý"], // 0876.95.0000
  ["0989815555", "Tứ quý"], // 0989.81.5555
  ["0963280000", "Tứ quý"], // 0963.28.0000
  ["0979331111", "Tứ quý"], // 0979.33.1111
  ["0876059999", "Tứ quý"], // 0876.05.9999
  ["0859587777", "Tứ quý"], // 08.5958.7777
  ["0879144444", "Ngũ quý"], // 08791.44444
  ["0876200000", "Ngũ quý"], // 08762.00000
  ["0867233333", "Ngũ quý"], // 08672.33333
  ["0339866666", "Ngũ quý"], // 0339.866666
  ["0833577777", "Ngũ quý"], // 08.335.77777
  ["0326355555", "Ngũ quý"], // 03263.55555
  ["0876666653", "Ngũ quý giữa"], // 087.66666.53
  ["0876666607", "Ngũ quý giữa"], // 087.66666.07
  ["0366666934", "Ngũ quý giữa"], // 03.66666.934
  ["0333339705", "Ngũ quý giữa"], // 033333.9705
  ["0888885783", "Ngũ quý giữa"], // 088888.5783
  ["0888887521", "Ngũ quý giữa"], // 088888.7521
  ["0983000000", "Lục quý"], // 0983.000000
  ["0392555555", "Lục quý"], // 0392.555.555
  ["0373555555", "Lục quý"], // 0373.555.555
  ["0996555555", "Lục quý"], // 0996.555.555
  ["0967333333", "Lục quý"], // 0967.333.333
  ["0823999999", "Lục quý"], // 0823.999.999
  ["0877777785", "Lục quý giữa"], // 08777.77785
  ["0877777787", "Lục quý giữa"], // 08777.77787
  ["0877777763", "Lục quý giữa"], // 08.777.777.63
  ["0877777710", "Lục quý giữa"], // 08.777.777.10
  ["0766666611", "Lục quý giữa"], // 0766.6666.11
  ["0833333346", "Lục quý giữa"], // 08.333333.46
  ["0916702009", "Đầu số cổ"], // 091.670.2009
  ["0905042260", "Đầu số cổ"], // 09.0504.2260
  ["0909576718", "Đầu số cổ"], // 0909.5767.18
  ["0918607947", "Đầu số cổ"], // 0918.607.947
  ["0944883260", "Đầu số cổ"], // 09.4488.3260
  ["0975379503", "Đầu số cổ"], // 0975.379.503
  ["0929300366", "Năm sinh"], // 0929.300.366
  ["0931131260", "Năm sinh"], // 0931.13.12.60
  ["0938030260", "Năm sinh"], // 0938.03.02.60
  ["0965290718", "Năm sinh"], // 0965.29.07.18
  ["0886300718", "Năm sinh"], // 0886.30.07.18
  ["0812150718", "Năm sinh"], // 0812.15.07.18
  ["0865537330", "Tự chọn"], // 0865.537.330
  ["0911862260", "Tự chọn"], // 0911.862.260
  ["0936645503", "Tự chọn"], // 0936.645.503
  ["0964329503", "Tự chọn"], // 0964.329.503
  ["0889598947", "Tự chọn"], // 08.89.59.89.47
  ["0764203718", "Tự chọn"], // 0764.203.718
  ["0928871102", "Số độc"], // 0928.87.1102
  ["0375588569", "Số độc"], // 0375.588.569
  ["0917506389", "Số độc"], // 0917.506.389
  ["0889731389", "Số độc"], // 0889.73.1389
  ["0799141102", "Số độc"], // 0799.14.11.02
  ["0836006689", "Số độc"], // 0836.0066.89
];

describe("detectSimCategories — một số thuộc nhiều danh mục (khớp simthanglong)", () => {
  it.each(MEMBERSHIP)("%s", (digits, want) => {
    expect(detectSimCategories(digits)).toEqual(want);
  });
});

describe("nhãn chính = danh mục đứng đầu theo CATEGORY_PRIORITY", () => {
  it.each(PRIMARY)("%s → %s", (digits, want) => {
    expect(primarySimCategory(digits) ?? "Tự chọn").toBe(want);
  });

  it("số không thuộc danh mục nào → null (simthanglong gọi là Tự chọn)", () => {
    expect(primarySimCategory("0326640021")).toBeNull();
    expect(detectSimCategories("0326640021")).toEqual([]);
  });
});

describe("các ranh giới dễ sai", () => {
  it("quý tính ĐÚNG độ dài đuôi: tứ quý không phải tam hoa, ngũ quý không phải tứ quý", () => {
    expect(detectSimCategories("0876950000")).toEqual(["Tứ quý"]);
    expect(detectSimCategories("0877200000")).toContain("Ngũ quý");
    expect(detectSimCategories("0877200000")).not.toContain("Tứ quý");
    expect(detectSimCategories("0983000000")).toContain("Lục quý");
    expect(detectSimCategories("0983000000")).not.toContain("Ngũ quý");
  });

  it("quý nằm giữa dãy là danh mục riêng, không phải quý đuôi", () => {
    expect(detectSimCategories("0876000003")).toContain("Ngũ quý giữa");
    expect(detectSimCategories("0876000003")).not.toContain("Ngũ quý");
    expect(detectSimCategories("0929500002")).toContain("Tứ quý giữa");
  });

  it("tứ quý dính đầu số (0911.11…, 0333.3…) không tính là tứ quý giữa", () => {
    expect(detectSimCategories("0911113503")).not.toContain("Tứ quý giữa");
    expect(detectSimCategories("0333366775")).not.toContain("Tứ quý giữa");
  });

  it("lặp kép gồm cả AABB lẫn ABAB", () => {
    expect(detectSimCategories("0925645588")).toContain("Lặp kép");
    expect(detectSimCategories("0925082929")).toContain("Lặp kép");
    expect(detectSimCategories("0925082929")).toContain("Dễ nhớ");
  });

  it("taxi: AB.AB.AB, ABC.ABC, ABCD.ABCD", () => {
    expect(detectSimCategories("0878404040")).toContain("Taxi");
    expect(detectSimCategories("0876412412")).toContain("Taxi");
    expect(detectSimCategories("0835603560")).toContain("Taxi");
    expect(detectSimCategories("0878404040")[0]).toBe("Lặp kép"); // nhãn chính vẫn là lặp kép
  });

  it("gánh đảo: ABBA đuôi, hoặc 6/8 số cuối đối xứng", () => {
    expect(detectSimCategories("0917880440")).toContain("Gánh đảo");
    expect(detectSimCategories("0922860068")).toContain("Gánh đảo");
    expect(detectSimCategories("0906244260")).toContain("Gánh đảo");
  });

  // Ba ca dưới đây hỏi lại TỪNG SỐ trên simthanglong (tìm kiếm cô lập + ?c=), 09/2026.
  it("lặp kép gồm 6 số cuối là ba cặp kép (tứ quý có cặp đứng trước)", () => {
    expect(detectSimCategories("0879550000")).toEqual(["Tứ quý", "Lặp kép"]);
    expect(detectSimCategories("0336119999")).toContain("Lặp kép");
    expect(detectSimCategories("0983000000")).not.toContain("Lặp kép"); // 000000 là lục quý
  });

  it("gánh đảo: ABBA liền sau A (…1.1221) không tính, chỉ là dễ nhớ", () => {
    expect(detectSimCategories("0394511221")).not.toContain("Gánh đảo");
    expect(detectSimCategories("0394511221")).toContain("Dễ nhớ");
    expect(detectSimCategories("0843113113")).toContain("Gánh đảo"); // …1.3113: trước ABBA là 1 ≠ 3 nên vẫn tính
  });

  it("dễ nhớ: hai đuôi simthanglong xếp tay 310310, 113113", () => {
    expect(detectSimCategories("0562310310")).toEqual(["Taxi", "Dễ nhớ", "Năm sinh"]);
    expect(detectSimCategories("0989113113")).toContain("Dễ nhớ");
    expect(detectSimCategories("0876412412")).not.toContain("Dễ nhớ"); // taxi thường thì không
  });

  it("tiến lên: 3 số tăng, bước 2, và cặp tiến đều", () => {
    expect(detectSimCategories("0879000123")).toContain("Tiến lên");
    expect(detectSimCategories("0925063579")).toContain("Tiến lên");
    expect(detectSimCategories("0876040506")).toContain("Tiến lên");
    expect(detectSimCategories("0981567894")).not.toContain("Tiến lên"); // dãy tăng nằm giữa không tính
  });

  it("năm sinh: ngày phải có thật", () => {
    expect(detectSimCategories("0901190260")).toContain("Năm sinh"); // 19.02.60
    expect(detectSimCategories("0787310260")).not.toContain("Năm sinh"); // 31.02.60 không tồn tại
    expect(detectSimCategories("0941062000")).toContain("Năm sinh"); // …2000
  });

  it("đầu số cổ: 0902–0909 có, 0901 không", () => {
    expect(detectSimCategories("0902030260")).toContain("Đầu số cổ");
    expect(detectSimCategories("0901190260")).not.toContain("Đầu số cổ");
  });

  it("không bao giờ gắn Ông địa (A Khoa bỏ 14/09)", () => {
    expect(detectSimCategories("0942210038")).not.toContain("Ông địa");
    expect(CATEGORY_PRIORITY as readonly string[]).not.toContain("Ông địa");
  });

  it("số 9 chữ số (sheet mất số 0 đầu) được trả lại số 0", () => {
    expect(detectSimCategories("902030260")).toEqual(detectSimCategories("0902030260"));
  });

  it("detectSimTags của simUtils chính là detector dùng chung", () => {
    expect(detectSimTags("0876010010")).toEqual(["Taxi", "Dễ nhớ", "Gánh đảo"]);
  });
});

describe("VIP & điểm đẹp", () => {
  it("quý giữa 5–6 số vẫn là VIP như trước khi tách danh mục", () => {
    expect(isVIPSim(detectSimCategories("0961111114"), 1_000_000)).toBe(true);
    expect(isVIPSim(detectSimCategories("0876000003"), 1_000_000)).toBe(true);
    expect(isVIPSim(detectSimCategories("0929500002"), 1_000_000)).toBe(false);
  });

  it("VIP theo giá", () => {
    expect(isVIPSim([], 50_000_000)).toBe(true);
    expect(isVIPSim([], 49_999_999)).toBe(false);
  });

  it("điểm đẹp cộng mỗi danh mục một lần", () => {
    expect(calculateBeautyScore(["Tam hoa", "Tam hoa"], 0)).toBe(40);
    expect(calculateBeautyScore(["Tứ quý"], 60_000_000)).toBe(70);
  });
});
