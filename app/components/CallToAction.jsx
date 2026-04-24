"use client";
import useUser, { loginHref } from "@/lib/authClient";
import starsBg from "@/assets/stars.png";
import gridLines from "@/assets/grid-lines.png";
import { motion, useMotionTemplate, useMotionValue, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import Link from "next/link";

const useRelativeMousePosition = (to) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const updateMousePosition = (event) => {
    if (!to.current) return;
    const { top, left } = to.current.getBoundingClientRect();
    mouseX.set(event.x - left);
    mouseY.set(event.y - top);
  };

  useEffect(() => {
    window.addEventListener("mousemove", updateMousePosition);
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);

  return [mouseX, mouseY];
};

export const CallToAction = () => {
  const sectionRef = useRef(null);
  const borderedDivRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundPositionY = useTransform(scrollYProgress, [0, 1], [-300, 300]);
  const [mouseX, mouseY] = useRelativeMousePosition(borderedDivRef);
  const imageMask = useMotionTemplate`radial-gradient(50% 50% at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center bg-black text-white pt-16 md:pt-20" // slightly less top padding
    >
      <div className="container px-4">
        <motion.div
          ref={borderedDivRef}
          className="relative cursor-grab border border-white/15 py-24 rounded-xl overflow-hidden group max-w-10xl mx-auto w-200%" // increased max-width
          animate={{
            backgroundPositionX: starsBg.width,
          }}
          transition={{
            duration: 40,
            ease: "linear",
            repeat: Infinity,
          }}
          style={{
            backgroundPositionY,
            backgroundImage: `url(${starsBg.src})`,
          }}
        >
          {/* Base layer */}
          <div
            className="absolute inset-0 bg-[rgb(74,32,138)] bg-blend-overlay [mask-image:radial-gradient(50%_50%_at_50%_35%,black,transparent)] group-hover:opacity-0 transition duration-700"
            style={{
              backgroundImage: `url(${gridLines.src})`,
            }}
          ></div>

          {/* Hover layer */}
          <motion.div
            className="absolute inset-0 bg-[rgb(74,32,138)] bg-blend-overlay opacity-0 group-hover:opacity-100"
            style={{
              maskImage: imageMask,
              backgroundImage: `url(${gridLines.src})`,
            }}
          ></motion.div>

          {/* Text + Button */}
          <div className="relative text-center">
            <h2 className="text-5xl md:text-6xl font-medium tracking-tighter max-w-3xl mx-auto">
              Empower Your Financial Future with NEXUS
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mb-8 mt-6 mx-auto text-center">
              Unleash your financial potential with NEXUS
              <br />
              <span className="italic">
                your AI-powered investment companion.
              </span>
            </p>


            <div>
              {(() => {
                const { isSignedIn } = useUser();
                return isSignedIn ? (
                  <Link href="/Portfolio" className="inline-flex items-center gap-3 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-[1.02] transition-transform">
                    Get Started
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">→</span>
                  </Link>
                ) : (
                  <a href={`${loginHref}?screen_hint=signup`} className="inline-flex items-center gap-3 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-[1.02] transition-transform">
                    Get Started
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">→</span>
                  </a>
                );
              })()}
            </div>
          </div>
        </motion.div>
      </div>
    </section>

  );
};
