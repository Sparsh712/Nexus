'use client'
import avatar1 from "@/assets/avatar-1.png";
import avatar2 from "@/assets/avatar-2.png";
import avatar3 from "@/assets/avatar-3.png";
import avatar4 from "@/assets/avatar-4.png";
import Image from "next/image";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "“NEXUS gave me the confidence to start investing. The real-time insights make complex data feel simple and actionable.”",
    name: "Aarav Sharma",
    title: "Young Investor",
    avatarImg: avatar2,
  },
  {
    text: "“The AI-driven recommendations and learning hub have completely changed how I understand mutual funds and crypto.”",
    name: "Priya Mehta",
    title: "Finance Student",
    avatarImg: avatar3,
  },
  {
    text: "“As a working professional, I finally have a single dashboard to track my portfolio and make smarter financial moves.”",
    name: "Rahul Khanna",
    title: "Product Manager @ FinEdge",
    avatarImg: avatar4,
  },
  {
    text: "“NEXUS makes investing feel effortless — it’s like having a personal financial advisor powered by AI.”",
    name: "Neha Kapoor",
    title: "Entrepreneur",
    avatarImg: avatar1,
  },
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 md:py-24 bg-black">
      <div className="container flex flex-col items-center justify-center mx-auto">
        <h2 className="text-5xl md:text-6xl font-medium tracking-tighter text-white text-center mx-auto">
          Trusted by Smart Investors.
        </h2>
        <p className="text-gray-400 text-lg md:text-xl max-w-sm mx-auto text-center mt-5 tracking-tight">
          Discover how NEXUS empowers users to invest confidently and grow smarter with AI-driven insights.
        </p>

        {/* Hide scrollbar cleanly */}
        <div className="relative w-full mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
          <motion.div
            initial={{ translateX: `-50%` }}
            animate={{ translateX: `0%` }}
            transition={{
              ease: "linear",
              repeat: Infinity,
              duration: 30,
            }}
            className="flex gap-5 pr-5 flex-none will-change-transform"
          >
            {[...testimonials, ...testimonials].map((testimonial, idx) => (
              <div
                key={`${testimonial.name}-${idx}`}
                className="border border-white/15 p-6 md:p-10 rounded-xl bg-[linear-gradient(to_bottom_left,rgb(140,69,255,.3),black)] max-w-xs md:max-w-md flex-none"
              >
                <div className="text-lg md:text-xl tracking-tight text-white">
                  {testimonial.text}
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <div className="relative">
                    <Image
                      src={testimonial.avatarImg}
                      alt={`Avatar for ${testimonial.name}`}
                      className="h-11 w-11 rounded-xl grayscale border border-white/30"
                    />
                  </div>
                  <div>
                    <div className="text-white">{testimonial.name}</div>
                    <div className="text-white/50 text-sm">{testimonial.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
