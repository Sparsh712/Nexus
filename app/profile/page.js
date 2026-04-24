"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useUser, { loginHref } from "@/lib/authClient";
import Navbar from "@/app/components/Navbar";

export default function ProfilePage() {
    const { user, isSignedIn, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isSignedIn) {
            router.push(loginHref);
        }
    }, [isLoading, isSignedIn, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#000000] text-white">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#000000] text-white tracking-wide font-sans">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-32 relative z-10">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
                        Profile Settings
                    </h1>
                    <p className="text-gray-400 mt-3 text-lg">Manage your account and view your profile details.</p>
                </div>

                {/* Profile Card */}
                <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 bg-[#0a0a0a]/60 backdrop-blur-xl relative overflow-hidden shadow-2xl">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row gap-10 items-start md:items-center relative z-10">

                        {/* Avatar */}
                        <div className="relative group shrink-0">
                            {/* Outer glow effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full blur-md opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
                            {/* Gradient ring (halo) */}
                            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full p-[3px] bg-gradient-to-r from-cyan-500 to-purple-500">
                                {/* Inner dark background with white initial */}
                                <div className="w-full h-full rounded-full bg-[#0b0b12] flex items-center justify-center">
                                    <span className="text-white font-bold text-4xl md:text-5xl">
                                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-6 flex-1 w-full">
                            {/* Name Field */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold ml-1">Display Name</label>
                                <div className="w-full bg-[#111]/50 border border-white/10 rounded-xl px-5 py-4 text-gray-100 flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    {user?.name}
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold ml-1">Email Address</label>
                                <div className="w-full bg-[#111]/50 border border-white/10 rounded-xl px-5 py-4 text-gray-100 flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    {user?.email}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Read-only Badge & Info */}
                    <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500 text-center md:text-left">
                            Profile details are managed via your authentication provider.
                        </p>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                            <span className="text-xs text-gray-300 font-medium">Synced with Auth0</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Background Ambience */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#000000] to-[#000000]"></div>
        </div>
    );
}
