"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Suspense } from "react";

export default function HeroModern() {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black selection:bg-purple-500/30">

            {/* Vivid Aurora Background */}
            <div
                className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
                style={{
                    backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(76, 29, 149, 0.4), transparent 50%),
            radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.3), transparent 40%),
            radial-gradient(circle at 100% 100%, rgba(236, 72, 153, 0.3), transparent 40%)
          `,
                    filter: "blur(60px)",
                }}
            />

            <div
                className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            {/* Content Container */}
            <div className="relative z-30 text-center px-4 max-w-5xl mx-auto space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-purple-200 backdrop-blur-md mb-6 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        ✨ The Future of Financial Intelligence
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="text-7xl md:text-[9rem] font-bold tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]"
                >
                    NEXUS
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-xl md:text-2xl text-purple-100/70 max-w-2xl mx-auto font-light leading-relaxed tracking-wide"
                >
                    Ignite your portfolio with <span className="text-white font-medium shadow-[0_0_10px_rgba(255,255,255,0.4)]">Symbiotic Intelligence</span>. <br className="hidden md:block" />
                    Where market chaos meets confident conquest.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-10"
                >
                    <Link
                        href="/dashboard"
                        className="relative px-8 py-4 bg-white text-black font-bold rounded-full hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow duration-300"
                    >
                        Start Analyzing
                    </Link>
                    <Link
                        href="/demo"
                        className="px-8 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-full hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all"
                    >
                        Watch Demo
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
