"use client";

import { motion } from "framer-motion";

import starsBg from "@/assets/stars.png"; // star background

import useUser, { loginHref } from "@/lib/authClient";

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden text-white bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12]">
      {/* Animated Stars Background */}
      <motion.div
        className="absolute inset-0 z-0 opacity-60"
        animate={{
          backgroundPositionX: [0, 800],
          backgroundPositionY: [0, 200],
        }}
        transition={{
          backgroundPositionX: { duration: 80, ease: "linear", repeat: Infinity },
          backgroundPositionY: { duration: 60, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
        }}
        style={{
          backgroundImage: `url(${starsBg.src})`,
          backgroundRepeat: "repeat",
          backgroundSize: "cover",
        }}
      />

      {/* Subtle Glow Overlay */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none"></div>

      {/* Navbar */}
      

      {/* Main Hero */}
      <div className="relative z-10 pt-40 pb-20 flex flex-col items-center text-center px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-12 font-poppins">
          Transforming complex finance into
          <span className="block relative">
            <span className="relative inline-block px-4">
              Simple, Smart decisions
              <span
                className="absolute left-[-1rem] right-[-1rem] top-full h-[7px] bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] mt-2"
                style={{ borderRadius: "0 0 100% 100%" }}
              ></span>
            </span>
          </span>
        </h1>

       

        <p className="text-lg md:text-xl text-white/70 mt-5 max-w-2xl mx-auto">
          Real-time AI insights, smart investing tools, and personalized learning,
          all in one seamless platform to help you invest confidently and grow smarter.
        </p>

        {/* Call to Action */}
       

        <div className="flex justify-center mt-8">
          {(() => {
            const { isSignedIn } = useUser();
            return isSignedIn ? (
              <a href="/Portfolio" className="relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white rounded-full bg-purple-600 hover:bg-purple-700 transition-all duration-300 shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] active:scale-95">Get Started</a>
            ) : (
              <a href={`${loginHref}?screen_hint=signup`} className="relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white rounded-full bg-purple-600 hover:bg-purple-700 transition-all duration-300 shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] active:scale-95">Get Started</a>
            );
          })()}
        </div>

        {/* Background Glow */}
        <div className="relative mt-16 w-full max-w-4xl">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,_rgba(155,92,255,0.25),_transparent_70%)] blur-3xl"></div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute left-0 right-0 bottom-0 h-[350px] w-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(155,92,255,0.25)_0%,_rgba(240,139,214,0.15)_30%,_transparent_80%)] blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0710] via-[#0b0710]/80 to-transparent" />
      </div>
    </section>
  );
}
