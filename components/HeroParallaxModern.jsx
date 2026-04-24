"use client";
import React from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";

export default function HeroParallaxModern() {
    const ref = React.useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

    const translateX = useSpring(
        useTransform(scrollYProgress, [0, 1], [0, 1000]),
        springConfig
    );
    const translateXReverse = useSpring(
        useTransform(scrollYProgress, [0, 1], [0, -1000]),
        springConfig
    );
    const rotateX = useSpring(
        useTransform(scrollYProgress, [0, 0.2], [15, 0]),
        springConfig
    );
    const opacity = useSpring(
        useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
        springConfig
    );
    const rotateZ = useSpring(
        useTransform(scrollYProgress, [0, 0.2], [20, 0]),
        springConfig
    );
    const translateY = useSpring(
        useTransform(scrollYProgress, [0, 0.2], [-500, 400]),
        springConfig
    );

    return (
        <div
            ref={ref}
            className="h-[300vh] overflow-hidden bg-black antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
        >
            <Header />
            <motion.div
                style={{
                    rotateX,
                    rotateZ,
                    translateY,
                    opacity,
                }}
                className=""
            >
                <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
                    {firstRow.map((product) => (
                        <ProductCard
                            product={product}
                            translate={translateX}
                            key={product.title}
                        />
                    ))}
                </motion.div>
                <motion.div className="flex flex-row mb-20 space-x-20">
                    {secondRow.map((product) => (
                        <ProductCard
                            product={product}
                            translate={translateXReverse}
                            key={product.title}
                        />
                    ))}
                </motion.div>
                <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
                    {thirdRow.map((product) => (
                        <ProductCard
                            product={product}
                            translate={translateX}
                            key={product.title}
                        />
                    ))}
                </motion.div>
            </motion.div>

            {/* Ambient Aurora Background */}
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: `
            radial-gradient(circle at 50% 50%, rgba(76, 29, 149, 0.15), transparent 50%),
            radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.15), transparent 50%),
            radial-gradient(circle at 0% 100%, rgba(236, 72, 153, 0.15), transparent 50%)
          `,
                    filter: "blur(60px)",
                }}
            />
        </div>
    );
}

const Header = () => {
    return (
        <div className="max-w-7xl relative z-50 mx-auto py-32 md:py-48 px-4 w-full left-0 top-0">
            <h1 className="text-2xl md:text-7xl font-bold text-white mb-2">
                Empower Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                    Financial Future
                </span>
            </h1>
            <div className="max-w-4xl text-base md:text-xl mt-8 text-white font-medium leading-relaxed">
                Transform Market Shadows into Strategic Brilliance – Your Symbiotic AI Ally in the Fintech Frontier.
                <br />
                Democratizing institutional intelligence for India's 212M+ trailblazers: Real-time insights, risk mastery, and 50% sharper decisions. Ready to conquer volatility?
            </div>

            <div className="mt-10 flex gap-4">
                <Link
                    href="/dashboard"
                    className="px-8 py-4 bg-white text-black font-extrabold rounded-full shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300 relative z-50"
                >
                    Get Started →
                </Link>

            </div>
        </div>
    );
};

const ProductCard = ({ product, translate }) => {
    return (
        <motion.div
            style={{
                x: translate,
            }}
            whileHover={{
                y: -20,
            }}
            key={product.title}
            className="group/product h-96 w-[30rem] relative flex-shrink-0"
        >
            <Link href={product.link} className="block group-hover/product:shadow-2xl">
                <img
                    src={product.thumbnail}
                    height="600"
                    width="600"
                    className="object-cover object-left-top absolute h-full w-full inset-0 rounded-xl"
                    alt={product.title}
                />
            </Link>

        </motion.div>
    );
};

const products = [
    { title: "Stock Dashboard", link: "/dashboard", thumbnail: "/parallax_1.png" },
    { title: "Crypto Tracking", link: "/crypto", thumbnail: "/parallax_2.png" },
    { title: "Portfolio Sync", link: "/portfolio", thumbnail: "/parallax_3.png" },
    { title: "Mutual Funds", link: "/mf", thumbnail: "/parallax_4.png" },
    { title: "AI Insights", link: "/ai", thumbnail: "/parallax_5.png" },
    { title: "Stock Analysis", link: "/dashboard", thumbnail: "/parallax_6.png" },
    { title: "Risk Metrics", link: "/dashboard", thumbnail: "/parallax_7.png" },
    { title: "Price Charts", link: "/crypto", thumbnail: "/parallax_8.png" },

    { title: "Global Markets", link: "/global", thumbnail: "/parallax_1.png" },
    { title: "Real-time Analytics", link: "/analytics", thumbnail: "/parallax_2.png" },
    { title: "Secure Transactions", link: "/security", thumbnail: "/parallax_3.png" },
    { title: "Education Hub", link: "/education", thumbnail: "/parallax_4.png" },
    { title: "Expert Strategies", link: "/strategies", thumbnail: "/parallax_5.png" },
    { title: "Community", link: "/community", thumbnail: "/parallax_6.png" },
    { title: "WealthPulse Pro", link: "/pro", thumbnail: "/parallax_7.png" },
    { title: "Market Depth", link: "/dashboard", thumbnail: "/parallax_8.png" },
];

const firstRow = products.slice(0, 5);
const secondRow = products.slice(5, 10);
const thirdRow = products.slice(10, 15);
