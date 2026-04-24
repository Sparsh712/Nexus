"use client";
import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-[#030014] text-white overflow-hidden relative font-sans selection:bg-purple-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0"></div>
            <div className="fixed top-0 left-0 right-0 h-[500px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none z-0 translate-y-[-50%]"></div>
            <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none z-0 translate-y-[20%]"></div>

            <div className="relative z-10">
                <Navbar />

                <div className="flex items-center justify-center min-h-[calc(100vh-80px)] pt-20 px-4">
                    <div className="glass-panel p-8 md:p-12 max-w-md w-full rounded-2xl border border-white/10 relative overflow-hidden group">
                        {/* Card Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                        <div className="relative z-10 text-center">
                            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                                Join the Revolution
                            </h1>
                            <p className="text-gray-400 mb-8">
                                Create your NEXUS account and start your journey to financial mastery.
                            </p>

                            <Link
                                href="/api/auth/login?screen_hint=signup"
                                className="block w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20"
                            >
                                Create Free Account
                            </Link>

                            <div className="mt-6 text-sm text-gray-500">
                                Already have an account?{" "}
                                <Link href="/login" className="text-white hover:text-white/80 hover:underline">
                                    Log in
                                </Link>
                            </div>

                            {/* Divider */}
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[#030014]/80 px-2 text-gray-500 glass-panel">Why NEXUS?</span>
                                </div>
                            </div>

                            <ul className="text-left space-y-3 text-sm text-gray-400">
                                <li className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span> Real-time Market Simulator
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span> AI-Powered Insights
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span> Community of 212M+ Investors
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

