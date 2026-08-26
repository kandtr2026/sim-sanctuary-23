<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Deploy bắt buộc: push GitHub trước, Vercel sẽ tự deploy

Project này được Vercel cấu hình **Git integration (auto-deploy từ GitHub)**. Vercel luôn build bản mới nhất trên `origin/main`, KHÔNG dùng code local.

- **Sau mỗi commit phải `git push origin main`.** Nếu chỉ `npx vercel --prod` từ local, deploy báo "Ready" nhưng live vẫn hiển thị bản cũ → dễ tưởng lỗi cache.
- Quy trình chuẩn mỗi lần sửa: `git add <file>` → `git commit` → **`git push origin main`** → chờ Vercel auto-deploy (~1 phút) → verify trên `https://www.chonsomobifone.com`.
- Trước khi push, chạy `git pull --rebase origin main` nếu local bị `behind` để tránh conflict.
- Không cần chạy `npx vercel --prod` nữa (thừa, thậm chí gây nhầm). Chỉ dùng `npx vercel ls` để theo dõi trạng thái deployment.
