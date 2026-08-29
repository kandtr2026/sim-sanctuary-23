/**
 * Content generation for the blog-draft bot.
 *
 * Two paths, controlled by env:
 *  - BOT_CONTENT_FILE  -> load pre-written JSON from a file. Used for manual
 *    testing / dry runs (see OpenCode.md section 7). Content must be a JSON
 *    object: { title, meta_title, meta_description, content_html }.
 *  - LLM_* vars         -> generate via an LLM API:
 *      LLM_API_KEY  (required)
 *      LLM_PROVIDER (anthropic | openai | deepseek | openrouter | groq; default deepseek)
 *      LLM_MODEL    (optional; sensible per-provider default used otherwise)
 *      LLM_BASE_URL (optional; overrides the provider default base URL)
 *
 * The prompt enforces the writing style in OpenCode.md section 6.
 */

import { readFileSync } from 'node:fs';

const PROVIDER_DEFAULTS = {
  anthropic: { baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-4-5' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'deepseek/deepseek-chat-v3-0324' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
};

function buildPrompt(topic, correction = null) {
  const keywords = (topic.keywords && topic.keywords.length ? topic.keywords : [topic.title]).join(', ');
  let prompt = `Bạn là biên tập viên nội dung của CHONSOMOBIFONE.COM — một doanh nghiệp bán sim số đẹp Mobifone có thương hiệu. Viết 1 bài bằng TIẾNG VIỆT theo VĂN PHONG DOANH NGHIỆP CHUYÊN NGHIỆP (tham chiếu văn phong Techcombank), phủ được các từ khóa cho trước một cách tự nhiên. VIẾT MỚI hoàn toàn, không sao chép trang nào.

VĂN PHONG BẮT BUỘC (ưu tiên cao hơn mọi yêu cầu SEO bên dưới):
- Xưng hô: gọi khách là "Quý khách" (mặc định) hoặc "Anh/Chị" (khi hướng dẫn, tư vấn). Gọi mình là "CHONSOMOBIFONE.COM", "chúng tôi", "đội ngũ tư vấn". TUYỆT ĐỐI KHÔNG dùng: "mình", "bạn", "tụi mình", "các bạn", "shop mình". Câu mệnh lệnh nên bỏ chủ ngữ ("Kiểm tra kỹ dãy số trước khi đặt") thay vì gắn "bạn".
- Giọng: chuyên nghiệp, tin cậy, ấm áp nhưng đúng mực. KHÔNG viết như bài SEO, KHÔNG viết như tin nhắn chat, không emoji, không cảm thán, không hỏi tu từ kiểu "Bạn có biết...?".
- Ưu tiên các từ: đồng hành, an tâm, thấu hiểu, tối ưu, vững vàng, chủ động (dùng tự nhiên, không nhồi).
- Nêu LỢI ÍCH CHO KHÁCH TRƯỚC, rồi mới tới đặc điểm sản phẩm. Câu ngắn, thể chủ động, hạn chế câu dài quá 30 chữ.
- CẤM các cụm sau (viết lại ý bằng câu khác hẳn, không thay bằng "vừa... vừa..." cho có): "không chỉ... mà còn", "Trước hết", "Về phong thủy, mỗi con số mang...", "Trong thời đại công nghệ số", "Đáng chú ý", "Nhìn chung", "Có thể nói rằng", "Hy vọng bài viết này".
- CẤM câu mẫu dùng lại giữa các bài. Không mở bài bằng công thức "X là dòng sim số đẹp có...". Mỗi bài phải có một cách vào bài khác hẳn về cấu trúc: bối cảnh sử dụng thật, nhóm khách điển hình, cách đọc số, độ khan hiếm, hoặc rủi ro cần tránh.

CHỦ ĐỀ:
- slug: ${topic.slug}
- tiêu đề gợi ý: ${topic.title}
- chuyên mục: ${topic.category}
- từ khóa SEO chính (đưa tự nhiên vào title, các thẻ <h2>, đoạn mở đầu và thân bài): ${keywords}
- link nội bộ BẮT BUỘC chèn đúng 1 lần vào trong bài: href="${topic.internalLink}"

YÊU CẦU NỘI DUNG:
1. content_html: 700-1100 từ (đếm theo tiếng Việt). Cấu trúc: 1 đoạn mở đầu + 3-5 mục có thẻ <h2>, mỗi mục có <p> và dùng <ul><li> khi hợp lý. KHÔNG bọc <html>, <head>, <body>.
2. Phủ từ khóa TỰ NHIÊN: từ khóa chính xuất hiện trong đoạn mở đầu, trong ít nhất 2 thẻ <h2> và rải hợp lý trong thân bài — nhưng không lặp máy móc, không nhồi nhét, thà thiếu một lần lặp còn hơn để câu văn gượng. Với bài về dòng sim (tứ quý, lục quý, tam hoa…) hoặc đuôi số (68, 86, 39, 79…), triển khai các mục: dòng sim/đuôi số đó là gì (định nghĩa + ví dụ đuôi số cụ thể như 8888, 66666, 68, 39), ý nghĩa theo quan niệm dân gian, cách chọn hợp mệnh, giá trị/giá thị trường tham khảo (nói chung, không bịa số liệu cụ thể), tiêu chí chọn nơi mua đáng tin, câu hỏi thường gặp. Các mục KHÔNG được cùng một khuôn câu mở đầu.
3. Trình bày phong thủy/số học như niềm tin dân gian: dùng cụm "theo quan niệm dân gian", "theo phong thủy", "được xem là". Không khẳng định tuyệt đối, không hứa đổi vận, không phải lời khuyên y tế hay tài chính. Tránh từ ngữ thổi phồng ("chắc chắn giàu", "rẻ nhất thị trường", "uy tín số 1").
4. Không bịa số liệu, tên khách hàng, đánh giá giả. Không nói xấu đối thủ theo tên (không nhắc tên bất kỳ đối thủ nào).
5. Chèn ĐÚNG 1 link nội bộ <a href="${topic.internalLink}"> với anchor text tự nhiên, có thể bọc trong tag <strong> nếu cần nhấn.
6. meta_title: dưới 60 ký tự, chứa từ khóa chính.
7. meta_description: 140-160 ký tự, tự nhiên, không nhồi nhét từ khóa.

TRẢ VỀ DUY NHẤT một JSON hợp lệ (không markdown, không text thừa):
{"title": "...", "meta_title": "...", "meta_description": "...", "content_html": "<p>...</p>"}

title là tiêu đề hiển thị của bài (có thể khác tiêu đề gợi ý nhưng cùng ý nghĩa, chứa từ khóa chính). QUAN TRỌNG: không được lặp mẫu "X là gì?" cho mọi bài — hãy đa dạng mẫu câu, luân phiên các kiểu như: "Sim X – Ý Nghĩa Và Cách Chọn...", "Bí quyết chọn sim X hợp mệnh", "Vì sao sim X được săn đón?", "Sim X – Điều cần biết trước khi mua", "Khám phá ý nghĩa của sim X...". Mỗi bài dùng MỘT kiểu câu khác nhau, tránh trùng mẫu với các bài đã viết trước đó.`;

  if (correction) {
    prompt += `\n\n${correction}`;
  }
  return prompt;
}

function parseLlmJson(text) {
  const cleaned = text.trim();
  let candidate = cleaned;
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) candidate = fence[1];
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error('Không parse được JSON từ phản hồi LLM.');
  }
}

/**
 * Chốt cửa văn phong. Prompt là lời đề nghị, guard này là điều kiện đăng:
 * bot mặc định `published=true` nên một bài gọi khách là "bạn" là một bài
 * sai xưng hô nằm thẳng trên site. Xưng hô sai => chặn (ném lỗi, thử lại một
 * lượt rồi bỏ lượt chạy). Cụm AI-typical => cảnh báo, vì "chứ không chỉ" có
 * thể hợp lệ và không đáng đánh đổi cả bài.
 */
const BANNED_PRONOUNS = [
  /\bcác bạn\b/gi,
  /\btụi mình\b/gi,
  /\bshop mình\b/gi,
  /\bbạn\b/gi,
  /\bmình\b/gi,
];

const AI_TYPICAL = [
  /không chỉ[^.!?]{0,40}mà còn/gi,
  /\bTrước hết\b/gi,
  /Về phong thủy, mỗi con số mang/gi,
  /Trong thời đại công nghệ số/gi,
  /\bNhìn chung\b/gi,
  /Hy vọng bài viết này/gi,
];

function checkVoice(fields) {
  const text = Object.values(fields).join('\n').replace(/<[^>]*>/g, ' ');

  const hits = [];
  const words = [];
  for (const re of BANNED_PRONOUNS) {
    const m = text.match(re);
    if (m) {
      hits.push(`${m[0]} (${m.length}×)`);
      words.push(m[0]);
    }
  }
  if (hits.length) {
    const err = new Error(
      `Sai xưng hô, không đăng: ${hits.join(', ')}. Phải gọi khách là "Quý khách"/"Anh Chị".`,
    );
    err.bannedWords = [...new Set(words.map((w) => w.trim().toLowerCase()))];
    throw err;
  }

  for (const re of AI_TYPICAL) {
    const found = text.match(re);
    if (found) console.warn(`[blog-bot] Cụm AI-typical còn sót: "${found[0]}" — nên sửa tay trước khi để bài chạy lâu dài.`);
  }
}

function validateAndNormalize(content, topic) {
  const title = typeof content.title === 'string' && content.title.trim() ? content.title.trim() : topic.title;
  const meta_title = typeof content.meta_title === 'string' && content.meta_title.trim()
    ? content.meta_title.trim().slice(0, 60)
    : title.slice(0, 60);
  const meta_description =
    typeof content.meta_description === 'string' && content.meta_description.trim()
      ? content.meta_description.trim()
      : '';
  const content_html =
    typeof content.content_html === 'string' && content.content_html.trim() ? content.content_html.trim() : '';

  if (!content_html) throw new Error('LLM trả về content_html rỗng.');

  const words = content_html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .split(/\s+/)
    .filter((w) => /[a-zA-ZÀ-ỹ0-9]/.test(w)).length;

  const hasInternalLink = content_html.includes(`href="${topic.internalLink}"`) || content_html.includes(`href='${topic.internalLink}'`);
  if (!hasInternalLink) {
    throw new Error(`Thiếu link nội bộ ${topic.internalLink} trong content_html.`);
  }

  const metaDescLength = meta_description.length;
  if (metaDescLength < 140 || metaDescLength > 160) {
    console.warn(`[blog-bot] meta_description dài ${metaDescLength} ký tự (ngoài 140-160) — vẫn lưu.`);
  }
  if (words < 700 || words > 1100) {
    console.warn(`[blog-bot] content_html ~${words} từ (ngoài 700-1100) — vẫn lưu.`);
  }
  if (meta_title.length > 60) {
    console.warn(`[blog-bot] meta_title bị cắt còn ${meta_title.length} ký tự.`);
  }

  checkVoice({ title, meta_title, meta_description, content_html });

  return { title, meta_title, meta_description, content_html, words };
}

async function callAnthropic(prompt, env) {
  const cfg = PROVIDER_DEFAULTS.anthropic;
  const baseUrl = env.LLM_BASE_URL || cfg.baseUrl;
  const model = env.LLM_MODEL || cfg.model;
  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.LLM_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Anthropic API lỗi (${res.status}): ${data?.error?.message || res.statusText}`);
  }
  const text = (data.content || []).map((b) => b.text || '').join('');
  if (!text) throw new Error('Anthropic API trả về nội dung rỗng.');
  return text;
}

async function callOpenAICompatible(prompt, env, provider) {
  const cfg = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.openai;
  const baseUrl = (env.LLM_BASE_URL || cfg.baseUrl).replace(/\/$/, '');
  const model = env.LLM_MODEL || cfg.model;
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4096,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`LLM API lỗi (${res.status}): ${data?.error?.message || data?.error || res.statusText}`);
  }
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('LLM API trả về nội dung rỗng.');
  return text;
}

function loadFromFile(path) {
  const raw = readFileSync(path, 'utf8');
  const data = JSON.parse(raw);
  if (typeof data.content_html !== 'string') {
    throw new Error(`BOT_CONTENT_FILE ${path} không chứa content_html hợp lệ.`);
  }
  return data;
}

export async function generateContent(topic, env = process.env) {
  if (env.BOT_CONTENT_FILE) {
    const content = loadFromFile(env.BOT_CONTENT_FILE);
    return validateAndNormalize(content, topic);
  }

  if (!env.LLM_API_KEY) {
    throw new Error(
      'Thiếu LLM_API_KEY. Bật BOT_CONTENT_FILE để chạy thử không cần API, hoặc cấu hình LLM_API_KEY (xem OpenCode.md mục 4).',
    );
  }

  const provider = (env.LLM_PROVIDER || 'deepseek').toLowerCase();
  const MAX_ATTEMPTS = 3;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let correction = null;
    if (lastError && lastError.bannedWords && lastError.bannedWords.length) {
      const banList = [...new Set(lastError.bannedWords)].join('", "');
      correction = `SỬA LẦN ${attempt} (BẮT BUỘC tuân thủ): Bài lần trước bị từ chối vì chứa các từ bị cấm: "${banList}". TUYỆT ĐỐI KHÔNG được dùng bất kỳ từ nào trong số đó một lần nữa. Chỉ dùng "Quý khách" (mặc định) hoặc "Anh/Chị" (khi hướng dẫn, tư vấn).`;
    }

    const prompt = buildPrompt(topic, correction);
    try {
      const raw = provider === 'anthropic' ? await callAnthropic(prompt, env) : await callOpenAICompatible(prompt, env, provider);
      const parsed = parseLlmJson(raw);
      return validateAndNormalize(parsed, topic);
    } catch (err) {
      lastError = err;
      if (attempt >= MAX_ATTEMPTS) {
        console.error(`[blog-bot] Hết ${MAX_ATTEMPTS} lần thử, bài vẫn lỗi: ${err.message}`);
        throw err;
      }
      console.warn(`[blog-bot] Lần ${attempt} lỗi: ${err.message}. Thử lại lần ${attempt + 1}…`);
    }
  }
}
