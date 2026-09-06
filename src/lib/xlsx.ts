/**
 * Tạo file .xlsx (Excel thật) KHÔNG cần thư viện ngoài.
 *
 * Vì sao tự viết thay vì dùng exceljs/SheetJS: repo này có tới 3 lockfile
 * (bun.lock, bun.lockb cũ + package-lock.json) nên thêm dependency dễ khiến
 * Vercel build hụt gói. Ở đây chỉ cần đóng gói vài file XML thành ZIP — dùng
 * `zlib.deflateRawSync` có sẵn của Node là đủ, zero-dependency, an toàn deploy.
 *
 * Điểm mấu chốt cho SIM: mọi ô "text" ghi bằng inlineStr nên số 0 đầu
 * (vd 0909...) KHÔNG bao giờ bị Excel nuốt hay bẻ thành 9.09E+9.
 */

import { deflateRawSync } from "node:zlib";

// ── CRC32 (bắt buộc cho ZIP) ──────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── Đóng gói ZIP (mỗi entry: deflate nếu nhỏ hơn, không thì store) ─────────────
interface ZipEntry {
  name: string;
  data: Buffer;
}

function zip(entries: ZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, "utf8");
    const crc = crc32(e.data);
    const deflated = deflateRawSync(e.data);
    const useDeflate = deflated.length < e.data.length;
    const stored = useDeflate ? deflated : e.data;
    const method = useDeflate ? 8 : 0;

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); // local file header signature
    lh.writeUInt16LE(20, 4); // version needed
    lh.writeUInt16LE(0x0800, 6); // flag: tên file UTF-8
    lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(0, 10); // mod time
    lh.writeUInt16LE(0x21, 12); // mod date (1980-01-01)
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(stored.length, 18);
    lh.writeUInt32LE(e.data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    locals.push(lh, nameBuf, stored);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); // central dir header signature
    ch.writeUInt16LE(20, 4); // version made by
    ch.writeUInt16LE(20, 6); // version needed
    ch.writeUInt16LE(0x0800, 8); // flag UTF-8
    ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0x21, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(stored.length, 20);
    ch.writeUInt32LE(e.data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30); // extra len
    ch.writeUInt16LE(0, 32); // comment len
    ch.writeUInt16LE(0, 34); // disk number
    ch.writeUInt16LE(0, 36); // internal attrs
    ch.writeUInt32LE(0, 38); // external attrs
    ch.writeUInt32LE(offset, 42); // offset local header
    central.push(ch, nameBuf);

    offset += lh.length + nameBuf.length + stored.length;
  }

  const localBuf = Buffer.concat(locals);
  const centralBuf = Buffer.concat(central);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // end of central dir signature
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(localBuf.length, 16); // offset của central dir
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([localBuf, centralBuf, eocd]);
}

// ── Sinh XML sheet ────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Chỉ số cột 0-based → chữ cái cột Excel (0→A, 25→Z, 26→AA). */
function colLetter(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** "text" = ép chuỗi (giữ số 0 đầu); "int" = số nguyên; "money" = số + định dạng #,##0. */
export type XlsxCell = { v: string | number; kind: "text" | "int" | "money" };
export interface XlsxColumn {
  header: string;
  width: number;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;

const RELS_ROOT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

const RELS_WORKBOOK = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

/** Tên sheet hợp lệ: bỏ ký tự cấm, cắt 31 ký tự. */
function safeSheetName(name: string): string {
  const cleaned = name.replace(/[:\\/?*[\]]/g, " ").trim();
  return (cleaned || "Sheet1").slice(0, 31);
}

function cellXml(ref: string, cell: XlsxCell): string {
  if (cell.kind === "text") {
    const text = String(cell.v ?? "");
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(text)}</t></is></c>`;
  }
  // int / money — chỉ ghi khi là số hữu hạn, không thì để ô text rỗng.
  const num = typeof cell.v === "number" ? cell.v : Number(cell.v);
  if (!Number.isFinite(num)) {
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve"></t></is></c>`;
  }
  const s = cell.kind === "money" ? ' s="2"' : "";
  return `<c r="${ref}"${s}><v>${num}</v></c>`;
}

/**
 * Dựng buffer .xlsx 1 sheet: dòng 1 là header (in đậm, đóng băng), autofilter
 * phủ toàn bảng. Trả về Buffer sẵn sàng gửi làm file tải về.
 */
export function buildXlsx(
  sheetName: string,
  columns: XlsxColumn[],
  rows: XlsxCell[][],
): Buffer {
  const colCount = columns.length;
  const lastCol = colLetter(colCount - 1);
  const lastRow = rows.length + 1; // +1 cho header

  const colsXml =
    "<cols>" +
    columns
      .map(
        (c, i) =>
          `<col min="${i + 1}" max="${i + 1}" width="${c.width}" customWidth="1"/>`,
      )
      .join("") +
    "</cols>";

  const headerCells = columns
    .map((c, i) => {
      const ref = `${colLetter(i)}1`;
      return `<c r="${ref}" t="inlineStr" s="1"><is><t xml:space="preserve">${esc(c.header)}</t></is></c>`;
    })
    .join("");

  const parts: string[] = [];
  parts.push(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`,
    `<dimension ref="A1:${lastCol}${lastRow}"/>`,
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>`,
    `<sheetFormatPr defaultRowHeight="15"/>`,
    colsXml,
    `<sheetData>`,
    `<row r="1">${headerCells}</row>`,
  );

  for (let r = 0; r < rows.length; r++) {
    const rowNum = r + 2;
    const row = rows[r];
    let cells = "";
    for (let ci = 0; ci < colCount; ci++) {
      const cell = row[ci] ?? { v: "", kind: "text" as const };
      cells += cellXml(`${colLetter(ci)}${rowNum}`, cell);
    }
    parts.push(`<row r="${rowNum}">${cells}</row>`);
  }

  parts.push(
    `</sheetData>`,
    `<autoFilter ref="A1:${lastCol}${lastRow}"/>`,
    `</worksheet>`,
  );
  const sheetXml = parts.join("");

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(safeSheetName(sheetName))}" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  return zip([
    { name: "[Content_Types].xml", data: Buffer.from(CONTENT_TYPES, "utf8") },
    { name: "_rels/.rels", data: Buffer.from(RELS_ROOT, "utf8") },
    { name: "xl/workbook.xml", data: Buffer.from(workbookXml, "utf8") },
    { name: "xl/_rels/workbook.xml.rels", data: Buffer.from(RELS_WORKBOOK, "utf8") },
    { name: "xl/styles.xml", data: Buffer.from(STYLES_XML, "utf8") },
    { name: "xl/worksheets/sheet1.xml", data: Buffer.from(sheetXml, "utf8") },
  ]);
}
