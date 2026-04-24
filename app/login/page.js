"use client";
import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#030014] text-white overflow-hidden relative font-sans selection:bg-purple-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0"></div>
            <div className="fixed top-0 left-0 right-0 h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none z-0 translate-y-[-50%]"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none z-0 translate-y-[20%]"></div>

            <div className="relative z-10">
                <Navbar />

                <div className="flex items-center justify-center min-h-[calc(100vh-80px)] pt-20 px-4">
                    <div className="glass-panel p-8 md:p-12 max-w-md w-full rounded-2xl border border-white/10 relative overflow-hidden group">
                        {/* Card Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                        <div className="relative z-10 text-center">
                            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                                Welcome Back
                            </h1>
                            <p className="text-gray-400 mb-8">
                                Sign in to access your NEXUS portfolio and real-time analytics.
                            </p>

                            <Link
                                href="/api/auth/login"
                                className="block w-full py-4 rounded-xl font-bold text-lg bg-white text-black hover:bg-neutral-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10"
                            >
                                Continue with Auth0
                            </Link>

                            <div className="mt-6 text-sm text-gray-500">
                                Don&apos;t have an account?{" "}
                                <Link href="/signup" className="text-blue-400 hover:text-blue-300 hover:underline">
                                    Sign up
                                </Link>
                            </div>

                            {/* Divider */}
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[#030014]/80 px-2 text-gray-500 glass-panel">Trusted by Pro Traders</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-2 rounded bg-white/5 border border-white/5">
                                    <div className="text-xs text-gray-400">Users</div>
                                    <div className="font-bold">200K+</div>
                                </div>
                                <div className="p-2 rounded bg-white/5 border border-white/5">
                                    <div className="text-xs text-gray-400">Security</div>
                                    <div className="font-bold text-green-400">AES-256</div>
                                </div>
                                <div className="p-2 rounded bg-white/5 border border-white/5">
                                    <div className="text-xs text-gray-400">Uptime</div>
                                    <div className="font-bold">99.9%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

