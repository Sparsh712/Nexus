"use client";
import React, { useState, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import { CardPattern, generateRandomString } from "./ui/evervault-card";

const MarketStats = () => {
    let mouseX = useMotionValue(0);
    let mouseY = useMotionValue(0);

    const [randomString, setRandomString] = useState("");

    useEffect(() => {
        let str = generateRandomString(10000); // Increased density for large area
        setRandomString(str);
    }, []);

    function onMouseMove({ currentTarget, clientX, clientY }) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);

        const str = generateRandomString(10000); // Refresh dense string
        setRandomString(str);
    }

    return (
        <section className="bg-black pt-12 pb-32 relative overflow-hidden group/pattern">
            <div
                className="absolute inset-0 z-0 pointer-events-none group-hover/pattern:pointer-events-none"
            >
            </div>

            <div
                onMouseMove={onMouseMove}
                className="max-w-7xl mx-auto px-6 relative z-10 min-h-[600px] flex flex-col items-center justify-center text-center group/card rounded-3xl overflow-hidden border border-white/10 bg-black/40"
            >
                {/* Background Pattern - High Priority */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} maskSize={600} />
                </div>

                {/* Subtle Gradient only (removed heavy overlay) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-black/0 to-transparent pointer-events-none z-0"></div>

                {/* Content */}
                <div className="relative z-20 max-w-4xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-8xl font-bold tracking-tight text-white leading-tight mb-8 mix-blend-overlay"
                    >
                        NEXUS helps you have better market stats.
                    </motion.h2>

                    <p className="text-xl text-neutral-300 max-w-2xl mx-auto mb-12">
                        Real-time encryption & security for your financial data. <br />
                        <span className="text-emerald-400 font-mono">AES-256 Enabled</span>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default MarketStats;
