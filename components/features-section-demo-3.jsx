"use client";

import React from "react";
import { cn } from "@/lib/utils";
import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { IconBrandYoutubeFilled } from "@tabler/icons-react";

export default function FeaturesSectionDemo() {
  const features = [
    {
      title: "Real-Time Portfolio Tracking",
      description:
        "Monitor your mutual funds, crypto, and investments seamlessly with live data and AI-driven insights — all in one dashboard.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 lg:col-span-4 border-b lg:border-r dark:border-neutral-800",
    },
    {
      title: "AI Investment Insights",
      description:
        "Receive smart, personalized recommendations powered by AI. Analyze trends, risks, and growth opportunities effortlessly.",
      skeleton: <SkeletonTwo />,
      className: "border-b col-span-1 lg:col-span-2 dark:border-neutral-800",
    },
    {
      title: "Learn with NEXUS",
      description:
        "Access videos, tutorials, and blogs to understand stocks, crypto, and mutual funds. Grow your financial literacy with ease.",
      skeleton: <SkeletonThree />,
      className:
        "col-span-1 lg:col-span-3 lg:border-r dark:border-neutral-800 lg:pb-6",
    },
    {
      title: "Global Financial Connectivity",
      description:
        "NEXUS connects investors worldwide — bringing real-time markets, global insights, and secure transactions to your fingertips.",
      skeleton: <SkeletonFour />,
      className:
        "col-span-1 lg:col-span-3 lg:border-r dark:border-neutral-800 lg:pb-12 relative after:content-[''] after:absolute after:-bottom-6 after:right-0 after:w-px after:h-6 after:bg-neutral-800",
    },
  ];

  return (
    <section id="features" className="relative w-full bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] overflow-hidden text-white">
      <div className="relative z-20 py-6 lg:py-12 max-w-7xl mx-auto">
        <div className="px-8">
          <h4 className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-white">
            Designed to Empower Every Investor
          </h4>

          <p className="text-sm lg:text-base max-w-2xl my-4 mx-auto text-white text-center font-normal">
            NEXUS combines AI, real-time analytics, and education to help you
            make smarter financial decisions with confidence and clarity.
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-6 mt-12 xl:border rounded-md dark:border-neutral-800">
            {features.map((feature) => (
              <FeatureCard key={feature.title} className={feature.className}>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
                <div className="h-full w-full">{feature.skeleton}</div>
              </FeatureCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const FeatureCard = ({ children, className }) => {
  return (
    <div className={cn(`p-4 sm:p-8 relative overflow-hidden`, className)}>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }) => {
  return (
    <p className="max-w-5xl mx-auto text-left tracking-tight text-white text-xl md:text-2xl md:leading-snug">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }) => {
  return (
    <p
      className={cn(
        "text-sm md:text-base max-w-4xl text-left mx-auto",
        "text-white",
        "text-left max-w-sm mx-0 md:text-sm my-2"
      )}
    >
      {children}
    </p>
  );
};

// --- Skeletons (visuals unchanged, themed appropriately) ---

export const SkeletonOne = () => {
  return (
    <div className="relative flex items-center justify-center py-6 px-3 h-72">
      <div className="w-full mx-auto bg-white dark:bg-neutral-900 shadow-xl rounded-lg overflow-hidden">
        <img
          src="/ss.png"
          alt="portfolio tracking"
          width={600}
          height={600}
          className="h-72 w-full object-cover object-center rounded-md"
        />
      </div>

      <div className="absolute bottom-0 z-40 inset-x-0 h-24 bg-gradient-to-t from-[#0b0b12] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 z-40 inset-x-0 h-24 bg-gradient-to-b from-[#0b0b12] via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export const SkeletonTwo = () => {
  const charts = [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71", // Charts/analytics
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f", // Graphs
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3", // Data visualization
    "https://images.unsplash.com/photo-1563986768609-322da13575f3", // Business charts
  ];


  const imageVariants = {
    whileHover: { scale: 1.05, zIndex: 50 },
    whileTap: { scale: 1.05, zIndex: 50 },
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-3 py-4 h-72 overflow-hidden">
      <div className="flex flex-row justify-center gap-3">
        {charts.slice(0, 2).map((image, idx) => (
          <motion.div
            key={`chart1-${idx}`}
            variants={imageVariants}
            whileHover="whileHover"
            whileTap="whileTap"
            className="rounded-md overflow-hidden border border-neutral-800 bg-neutral-900"
          >
            <img
              src={image}
              alt="investment chart"
              className="h-28 w-28 md:h-32 md:w-32 object-cover"
            />
          </motion.div>
        ))}
      </div>
      <div className="flex flex-row justify-center gap-3">
        {charts.slice(2, 4).map((image, idx) => (
          <motion.div
            key={`chart2-${idx}`}
            variants={imageVariants}
            whileHover="whileHover"
            whileTap="whileTap"
            className="rounded-md overflow-hidden border border-neutral-800 bg-neutral-900"
          >
            <img
              src={image}
              alt="AI investment insight"
              className="h-28 w-28 md:h-32 md:w-32 object-cover"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonThree = () => {
  return (
    <div className="flex justify-center items-center mt-6">
      <div className="relative w-[300px] h-[300px] bg-white/10 backdrop-blur-xl rounded-lg border border-white/20 shadow-2xl p-4 flex flex-col justify-between">
        <div className="flex flex-col gap-2 text-sm text-white overflow-hidden">
          <div className="self-start bg-white/20 px-3 py-2 rounded-lg rounded-bl-none max-w-[80%]">
            What’s a mutual fund?
          </div>
          <div className="self-end bg-purple-600/80 px-3 py-2 rounded-lg rounded-br-none max-w-[80%]">
            A mutual fund pools money from investors to invest in diversified assets.
          </div>
          <div className="self-start bg-white/20 px-3 py-2 rounded-lg rounded-bl-none max-w-[80%]">
            Awesome! Show me trending ones.
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <input
            type="text"
            placeholder="Type your question..."
            className="w-full px-3 py-2 rounded-md bg-white/20 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm transition-all">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export const SkeletonFour = () => {
  return (
    <div className="relative flex items-start justify-center py-2 overflow-visible">
      <div className="w-[300px] h-[300px] md:w-[360px] md:h-[360px] flex justify-center items-center">
        <Globe />
      </div>
    </div>
  );
};

export const Globe = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvasRef.current.getBoundingClientRect();
    const width = Math.max(300, Math.floor(rect.width * dpr));
    const height = Math.max(300, Math.floor(rect.height * dpr));

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: dpr,
      width,
      height,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.6, 0.3, 1],
      glowColor: [1, 1, 1],
      markers: [
        { location: [37.7749, -122.4194], size: 0.05 },
        { location: [28.6139, 77.209], size: 0.08 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.005;
      },
    });

    return () => globe.destroy();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
      className="rounded-full"
    />
  );
};
