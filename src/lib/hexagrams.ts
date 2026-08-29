// 80 quẻ Kinh Dịch — bảng tra cứu cát/hung từ 4 hoặc 6 số cuối (mod 80).
// Tách từ tool /sim-phong-thuy cũ để engine chấm điểm phong thủy tái sử dụng
// cùng một bảng duy nhất (không bao giờ lệch nhau).

export type HexagramLevel = 'Đại cát' | 'Cát' | 'Bình thường' | 'Hung' | 'Đại hung';

export interface Hexagram {
  index: number;
  title: string;
  short: string;
  level: HexagramLevel;
}

export const HEXAGRAMS: Record<number, Hexagram> = {
  1: { index: 1, title: "Đại triển hồng đô, khả được thành công", short: "Đại triển hồng đô, khả được thành công", level: "Cát" },
  2: { index: 2, title: "Thăng trầm không số, về già vô công", short: "Thăng trầm không số, về già vô công", level: "Bình thường" },
  3: { index: 3, title: "Ngày ngày tiến tới, vạn sự thuận toàn", short: "Ngày ngày tiến tới, vạn sự thuận toàn", level: "Đại cát" },
  4: { index: 4, title: "Tiền đồ gai góc, đau khổ theo đuổi", short: "Tiền đồ gai góc, đau khổ theo đuổi", level: "Hung" },
  5: { index: 5, title: "Làm ăn phát đạt, lợi danh đều có", short: "Làm ăn phát đạt, lợi danh đều có", level: "Đại cát" },
  6: { index: 6, title: "Trời cho số phận có thể thành công", short: "Trời cho số phận có thể thành công", level: "Cát" },
  7: { index: 7, title: "Ôn hòa êm dịu nhất phải thành công", short: "Ôn hòa êm dịu nhất phải thành công", level: "Cát" },
  8: { index: 8, title: "Qua giai đoạn gian nan, có ngày thành công", short: "Qua giai đoạn gian nan, có ngày thành công", level: "Cát" },
  9: { index: 9, title: "Tự làm có sức thất bại khó lường", short: "Tự làm có sức thất bại khó lường", level: "Hung" },
  10: { index: 10, title: "Tâm sức làm không, không được đến bờ", short: "Tâm sức làm không, không được đến bờ", level: "Hung" },
  11: { index: 11, title: "Vững đi từng bước, được người trọng vọng", short: "Vững đi từng bước, được người trọng vọng", level: "Cát" },
  12: { index: 12, title: "Gầy gò yếu đuối, mọi việc khó thành", short: "Gầy gò yếu đuối, mọi việc khó thành", level: "Hung" },
  13: { index: 13, title: "Trời cho cát vận, được người kính trọng", short: "Trời cho cát vận, được người kính trọng", level: "Cát" },
  14: { index: 14, title: "Nửa được nửa bại, dựa vào nghị lực", short: "Nửa được nửa bại, dựa vào nghị lực", level: "Bình thường" },
  15: { index: 15, title: "Đại sự thành tựu, nhất định hưng vương", short: "Đại sự thành tựu, nhất định hưng vương", level: "Cát" },
  16: { index: 16, title: "Thành tựu to lớn, tên tuổi lừng danh", short: "Thành tựu to lớn, tên tuổi lừng danh", level: "Đại cát" },
  17: { index: 17, title: "Quý nhân trợ giúp, sẽ được thành công", short: "Quý nhân trợ giúp, sẽ được thành công", level: "Cát" },
  18: { index: 18, title: "Thuận lợi xương thịnh, trăm việc trôi chảy", short: "Thuận lợi xương thịnh, trăm việc trôi chảy", level: "Đại cát" },
  19: { index: 19, title: "Nội ngoại bất hòa, khó khăn muôn phát", short: "Nội ngoại bất hòa, khó khăn muôn phát", level: "Hung" },
  20: { index: 20, title: "Vượt mọi gian nan, lo xa nghĩ hoài", short: "Vượt mọi gian nan, lo xa nghĩ hoài", level: "Hung" },
  21: { index: 21, title: "Chuyên tâm kinh doanh hay dung trí", short: "Chuyên tâm kinh doanh hay dung trí", level: "Cát" },
  22: { index: 22, title: "Có tài không vận, việc không gặp may", short: "Có tài không vận, việc không gặp may", level: "Hung" },
  23: { index: 23, title: "Tên tuổi 4 phương, sẽ thành đại nghiệp", short: "Tên tuổi 4 phương, sẽ thành đại nghiệp", level: "Đại cát" },
  24: { index: 24, title: "Phải dựa tự lập sẽ thành đại nghiệp", short: "Phải dựa tự lập sẽ thành đại nghiệp", level: "Cát" },
  25: { index: 25, title: "Thiên thời địa lợi vì được nhân cách", short: "Thiên thời địa lợi vì được nhân cách", level: "Cát" },
  26: { index: 26, title: "Bảo táp phong ba qua được hiểm nguy", short: "Bảo táp phong ba qua được hiểm nguy", level: "Hung" },
  27: { index: 27, title: "Lúc thắng lúc thua giữ được thành công", short: "Lúc thắng lúc thua giữ được thành công", level: "Cát" },
  28: { index: 28, title: "Tiến mãi không lùi trí tuệ được dung", short: "Tiến mãi không lùi trí tuệ được dung", level: "Đại cát" },
  29: { index: 29, title: "Cát hung chia đổ, được thua mỗi nửa", short: "Cát hung chia đổ, được thua mỗi nửa", level: "Hung" },
  30: { index: 30, title: "Danh lợi được mùa đại sự thành công", short: "Danh lợi được mùa đại sự thành công", level: "Đại cát" },
  31: { index: 31, title: "Con rồng trong nước thành công sẽ đến", short: "Con rồng trong nước thành công sẽ đến", level: "Đại cát" },
  32: { index: 32, title: "Dùng trí lâu dài, sẽ được thịnh vượng", short: "Dùng trí lâu dài, sẽ được thịnh vượng", level: "Cát" },
  33: { index: 33, title: "Rủi ro không ngừng khó có thành công", short: "Rủi ro không ngừng khó có thành công", level: "Hung" },
  34: { index: 34, title: "Số phận trung cất tiến lùi bảo thủ", short: "Số phận trung cất tiến lùi bảo thủ", level: "Bình thường" },
  35: { index: 35, title: "Trôi nổi bập bùng thường hay gặp nạn", short: "Trôi nổi bập bùng thường hay gặp nạn", level: "Hung" },
  36: { index: 36, title: "Tránh được điểm ác, thuận buồm xuôi gió", short: "Tránh được điểm ác, thuận buồm xuôi gió", level: "Cát" },
  37: { index: 37, title: "Danh thì được tiếng lợi thì bằng không", short: "Danh thì được tiếng lợi thì bằng không", level: "Bình thường" },
  38: { index: 38, title: "Đường rộng thênh thang nhìn thấy tương lai", short: "Đường rộng thênh thang nhìn thấy tương lai", level: "Đại cát" },
  39: { index: 39, title: "Lúc thịnh lúc suy chìm nổi vô định", short: "Lúc thịnh lúc suy chìm nổi vô định", level: "Bình thường" },
  40: { index: 40, title: "Thiên ý cất vận tiền đồ sang sủa", short: "Thiên ý cất vận tiền đồ sang sủa", level: "Đại cát" },
  41: { index: 41, title: "Sự nghiệp không chuyên hầu như không thành", short: "Sự nghiệp không chuyên hầu như không thành", level: "Hung" },
  42: { index: 42, title: "Nhẫn nhịn chịu đựng, xấu sẽ thành tốt", short: "Nhẫn nhịn chịu đựng, xấu sẽ thành tốt", level: "Cát" },
  43: { index: 43, title: "Cây xanh trổ lá đột nhiên thành công", short: "Cây xanh trổ lá đột nhiên thành công", level: "Cát" },
  44: { index: 44, title: "Ngược với ý mình tham công lỡ việc", short: "Ngược với ý mình tham công lỡ việc", level: "Hung" },
  45: { index: 45, title: "Quanh co khúy khỷu khó khăn kéo dài", short: "Quanh co khúy khỷu khó khăn kéo dài", level: "Hung" },
  46: { index: 46, title: "Quý nhân giúp đỡ thành công đại sự", short: "Quý nhân giúp đỡ thành công đại sự", level: "Đại cát" },
  47: { index: 47, title: "Danh lợi đều có thành công tốt đẹp", short: "Danh lợi đều có thành công tốt đẹp", level: "Đại cát" },
  48: { index: 48, title: "Cặp cát được cát gặp hung thì hung", short: "Cặp cát được cát gặp hung thì hung", level: "Bình thường" },
  49: { index: 49, title: "Hung cát cùng có, một thành một bại", short: "Hung cát cùng có, một thành một bại", level: "Bình thường" },
  50: { index: 50, title: "Một thịnh một suy bập bùn sóng gió", short: "Một thịnh một suy bập bùn sóng gió", level: "Bình thường" },
  51: { index: 51, title: "Trời quang mây tạnh nay được thành công", short: "Trời quang mây tạnh nay được thành công", level: "Cát" },
  52: { index: 52, title: "Sướng thịnh nửa số cát trước hung sau", short: "Sướng thịnh nửa số cát trước hung sau", level: "Hung" },
  53: { index: 53, title: "Nỗ lực hết mình thành công ích ỏi", short: "Nỗ lực hết mình thành công ích ỏi", level: "Bình thường" },
  54: { index: 54, title: "Bề ngoài tươi sang ẩn họa sẽ tới", short: "Bề ngoài tươi sang ẩn họa sẽ tới", level: "Hung" },
  55: { index: 55, title: "Ngược lại ý mình, có có thành công", short: "Ngược lại ý mình, có có thành công", level: "Đại hung" },
  56: { index: 56, title: "Nỗ lực phấn đấu phận tốt quay về", short: "Nỗ lực phấn đấu phận tốt quay về", level: "Cát" },
  57: { index: 57, title: "Bấp bênh nhiều chuyến hung trước tốt sau", short: "Bấp bênh nhiều chuyến hung trước tốt sau", level: "Bình thường" },
  58: { index: 58, title: "Gặp việc do dự khó có thành công", short: "Gặp việc do dự khó có thành công", level: "Hung" },
  59: { index: 59, title: "Mơ mơ hồ hồ khó có định phương hướng", short: "Mơ mơ hồ hồ khó có định phương hướng", level: "Bình thường" },
  60: { index: 60, title: "Mây che nửa trăng dấu hiệu phong ba", short: "Mây che nửa trăng dấu hiệu phong ba", level: "Hung" },
  61: { index: 61, title: "Lo nghỉ nhiều điều mọi việc không thành", short: "Lo nghỉ nhiều điều mọi việc không thành", level: "Hung" },
  62: { index: 62, title: "Biết hướng nổ lực con đường phồn vinh", short: "Biết hướng nổ lực con đường phồn vinh", level: "Cát" },
  63: { index: 63, title: "Mười việc chín không mất công mất sức", short: "Mười việc chín không mất công mất sức", level: "Hung" },
  64: { index: 64, title: "Cát vận tự đến, có được thành công", short: "Cát vận tự đến, có được thành công", level: "Cát" },
  65: { index: 65, title: "Nội ngoại bất hòa thiếu thốn tín nhiệm", short: "Nội ngoại bất hòa thiếu thốn tín nhiệm", level: "Bình thường" },
  66: { index: 66, title: "Mọi việc như ý phú quý tự đến", short: "Mọi việc như ý phú quý tự đến", level: "Đại cát" },
  67: { index: 67, title: "Nắm được thời cơ, thành công sẽ đến", short: "Nắm được thời cơ, thành công sẽ đến", level: "Cát" },
  68: { index: 68, title: "Lo trước nghĩ sau thường hay gặp nạn", short: "Lo trước nghĩ sau thường hay gặp nạn", level: "Hung" },
  69: { index: 69, title: "Bập bên khó tránh vất vả", short: "Bập bên khó tránh vất vả", level: "Hung" },
  70: { index: 70, title: "Cát hung đều có chỉ dự chí khí", short: "Cát hung đều có chỉ dự chí khí", level: "Bình thường" },
  71: { index: 71, title: "Được rồi lại mất khó có bình yên", short: "Được rồi lại mất khó có bình yên", level: "Hung" },
  72: { index: 72, title: "An lạc tự đến tự nhiên cát tường", short: "An lạc tự đến tự nhiên cát tường", level: "Cát" },
  73: { index: 73, title: "Như là vô mưu khó được thành đạt", short: "Như là vô mưu khó được thành đạt", level: "Bình thường" },
  74: { index: 74, title: "Trong lành có hung tiến không bằng lùi", short: "Trong lành có hung tiến không bằng lùi", level: "Bình thường" },
  75: { index: 75, title: "Nhiều điều đại hung, hiện tượng phân tán", short: "Nhiều điều đại hung, hiện tượng phân tán", level: "Đại hung" },
  76: { index: 76, title: "Khổ trước sướng sau, không bị thất bại", short: "Khổ trước sướng sau, không bị thất bại", level: "Cát" },
  77: { index: 77, title: "Nửa được nửa mất sang mà không thực", short: "Nửa được nửa mất sang mà không thực", level: "Bình thường" },
  78: { index: 78, title: "Tiền đồ tươi sang trăm đầy hy vọng", short: "Tiền đồ tươi sang trăm đầy hy vọng", level: "Đại cát" },
  79: { index: 79, title: "Được rồi lại mất lo cũng bằng không", short: "Được rồi lại mất lo cũng bằng không", level: "Hung" },
  80: { index: 80, title: "Số phận cao nhất, sẽ được thành công", short: "Số phận cao nhất, sẽ được thành công", level: "Đại cát" },
};

/**
 * Tra quẻ từ N số cuối (mod 80). Trả về quẻ tương ứng hoặc null nếu không có.
 * Dùng chung cho engine chấm điểm và mọi tool tra cứu sau này.
 */
export const getHexagramFromSuffix = (suffixDigits: string): Hexagram | null => {
  const n = parseInt(suffixDigits, 10);
  if (Number.isNaN(n)) return null;
  let que = n % 80;
  if (que === 0) que = 80;
  return HEXAGRAMS[que] ?? null;
};
