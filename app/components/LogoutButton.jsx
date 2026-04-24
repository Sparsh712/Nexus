"use client";

export default function LogoutButton() {
  return (
    <a
      href="/api/auth/logout"
      className="text-sm text-white/90 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-colors"
    >
      Log Out
    </a>
  );
}