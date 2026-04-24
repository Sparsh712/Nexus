"use client";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Globe, Briefcase, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FeaturesInteractive() {
    return (
        <section id="features" className="pt-24 pb-12 bg-black relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter mb-4">
                        Designed to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Empower</span>
                    </h2>
                    <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto">
                        NEXUS combines AI, real-time analytics, and education to help you make smarter financial decisions.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, idx) => (
                        <Link href={feature.link} key={idx} className={feature.className}>
                            <SpotlightCard feature={feature} />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

const SpotlightCard = ({ feature }) => {
    const divRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e) => {
        if (!divRef.current || isFocused) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative rounded-3xl border border-neutral-800 bg-neutral-900/50 overflow-hidden p-8 transition-colors hover:border-neutral-700 h-full`}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.1), transparent 40%)`,
                }}
            />

            <div className="relative z-10 flex flex-col h-full">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br ${feature.iconGradient} shadow-lg`}>
                    {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-8 flex-grow">
                    {feature.description}
                </p>
                <div className="flex items-center text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer group">
                    Learn More <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </div>
    );
};

const features = [
    {
        title: "Real-Time Tracking",
        description: "Monitor your mutual funds, crypto, and investments with live data and AI-driven insights.",
        icon: <Zap className="w-6 h-6 text-white" />,
        iconGradient: "from-yellow-400/20 to-orange-500/20 text-orange-300",
        className: "lg:col-span-2",
        link: "/dashboard"
    },
    {
        title: "AI Insights",
        description: "Receive smart, personalized recommendations powered by symbiotic intelligence.",
        icon: <Cpu className="w-6 h-6 text-white" />,
        iconGradient: "from-purple-500/20 to-indigo-500/20 text-indigo-300",
        className: "lg:col-span-1",
        link: "/"
    },
    {
        title: "Global Connectivity",
        description: "Connect investors worldwide — bringing real-time markets and secure transactions.",
        icon: <Globe className="w-6 h-6 text-white" />,
        iconGradient: "from-blue-400/20 to-cyan-500/20 text-cyan-300",
        className: "lg:col-span-1",
        link: "/"
    },
    {
        title: "Learn & Grow",
        description: "Access curated videos, tutorials, and blogs to grow your financial literacy.",
        icon: <Briefcase className="w-6 h-6 text-white" />,
        iconGradient: "from-emerald-400/20 to-green-500/20 text-emerald-300",
        className: "lg:col-span-4",
        link: "/education"
    },
];
