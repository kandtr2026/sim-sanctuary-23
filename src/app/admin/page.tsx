"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/hooks/useAdminAuth";

// Lets the one admin account sign in by typing "admin" instead of memorizing
// the real address. Supabase Auth itself only accepts email/password, so
// this just resolves the shorthand to the real email before calling signIn.
const USERNAME_ALIASES: Record<string, string> = {
  admin: "phuongtruck22c1+admin@gmail.com",
};

export default function AdminLoginPage() {
  const { user, isAdmin, loading, signIn } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Đăng nhập quản trị – CHONSOMOBIFONE.COM";
  }, []);

  // Already signed in as an admin — no reason to see the login form again.
  useEffect(() => {
    if (!loading && user && isAdmin) router.replace("/admin/dashboard");
  }, [loading, user, isAdmin, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const resolvedEmail = USERNAME_ALIASES[email.trim().toLowerCase()] ?? email.trim();
    const { error: signInError } = await signIn(resolvedEmail, password);
    setSubmitting(false);

    if (signInError) {
      setError("Sai email hoặc mật khẩu.");
      return;
    }
    router.replace("/admin/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-lg border border-border bg-card p-8 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold text-foreground">Đăng nhập quản trị</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Khu vực nội bộ — dành cho quản trị viên chonsomobifone.com.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-email">Tài khoản</Label>
          <Input
            id="admin-email"
            type="text"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-password">Mật khẩu</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
}
