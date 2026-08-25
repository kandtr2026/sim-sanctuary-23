/**
 * Minimal Supabase REST client for the blog-draft bot.
 *
 * Uses the raw REST + Auth HTTP endpoints (same calls OpenCode.md describes)
 * so the job needs no Supabase JS dependency — only global `fetch`.
 */

export class SupabaseError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'SupabaseError';
    this.status = status;
    this.body = body;
  }
}

export class SupabaseBotClient {
  constructor({ url, apikey, email, password }) {
    this.url = url.replace(/\/$/, '');
    this.apikey = apikey;
    this.email = email;
    this.password = password;
    this.accessToken = null;
  }

  async login() {
    const res = await fetch(
      `${this.url}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: { apikey: this.apikey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.email, password: this.password }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw new SupabaseError(
        `Đăng nhập thất bại (${res.status}): ${data.error_description || data.message || data.msg || res.statusText}`,
        res.status,
        data,
      );
    }
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  headers(extra = {}) {
    if (!this.accessToken) throw new Error('Chưa đăng nhập — gọi login() trước.');
    return { apikey: this.apikey, Authorization: `Bearer ${this.accessToken}`, ...extra };
  }

  async getSlugs() {
    const res = await fetch(`${this.url}/rest/v1/blog_posts?select=slug`, {
      headers: this.headers(),
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) {
      throw new SupabaseError(`Không đọc được danh sách slug (${res.status})`, res.status, data);
    }
    if (!Array.isArray(data)) return [];
    return data.map((row) => row.slug);
  }

  async insertPost(post) {
    const res = await fetch(`${this.url}/rest/v1/blog_posts`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify(post),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (Array.isArray(data) && data.length === 0)) {
      const msg = data?.message || data?.error_description || data?.details || res.statusText;
      throw new SupabaseError(`Lưu bài thất bại (${res.status}): ${msg}`, res.status, data);
    }
    return Array.isArray(data) ? data[0] : data;
  }
}
