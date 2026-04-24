"use client";
import React from "react";
import { motion } from "framer-motion";

export default function TestimonialsMarquee() {
    const testimonials = [
        { name: "John D.", text: "WealthPulse changed how I view my portfolio. The AI insights are scary good." },
        { name: "Sarah L.", text: "The real-time tracking is a game changer for my crypto assets." },
        { name: "Michael R.", text: "Finally, a dashboard that looks good and works even better." },
        {
            quote:
                "NEXUS revolutionized how I track my portfolio. The real-time updates are a game-changer.",
            name: "Sarah Chen",
            title: "Day Trader",
        },
        {
            quote:
                "The AI insights from NEXUS give me the confidence to make smarter investment decisions.",
            name: "Marcus Rodriguez",
            title: "Crypto Enthusiast",
        },
        {
            quote:
                "I've learnt so much from the Education Hub. NEXUS is more than just a dashboard.",
            name: "Emily Watson",
            title: "Long-term Investor",
        },
        {
            quote:
                "Simulating trades on NEXUS helped me refine my strategy without risking real money.",
            name: "David Park",
            title: "Finance Student",
        },
        {
            quote:
                "NEXUS is simply the best investment tool I've used. Clean, fast, and powerful.",
            name: "James Kim",
            title: "Angel Investor",
        },
    ];

    return (
        <section className="py-20 bg-black overflow-hidden border-t border-white/5">
            <h3 className="text-center text-white/50 text-sm font-medium tracking-widest uppercase mb-12">
                Trusted by Smart Investors
            </h3>

            <div className="flex overflow-hidden">
                <motion.div
                    className="flex gap-8 px-8"
                    animate={{ x: "-50%" }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                >
                    {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                        <div key={i} className="flex-shrink-0 w-80 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <p className="text-neutral-300 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                                <span className="text-white font-medium text-sm">{t.name}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
