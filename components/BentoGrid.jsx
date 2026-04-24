import Link from "next/link";
import { ArrowRight, BarChart2, Briefcase, Zap, Cpu } from "lucide-react";

export default function BentoGrid() {
    const features = [
        {
            title: "AI Analysis",
            description: "Deep learning models predict market trends with scary accuracy.",
            icon: <Cpu className="w-6 h-6 text-white" />,
            className: "md:col-span-2",
            bg: "bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 border-white/10",
            glow: "group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]"
        },
        {
            title: "Real-time Crypto",
            description: "Live data feeds from 50+ exchanges.",
            icon: <Zap className="w-6 h-6 text-yellow-300" />,
            className: "md:col-span-1",
            bg: "bg-neutral-900/80 border-white/10",
            glow: "group-hover:shadow-[0_0_30px_rgba(250,204,21,0.2)]"
        },
        {
            title: "Portfolio Sync",
            description: "Connect your brokerage accounts in seconds.",
            icon: <Briefcase className="w-6 h-6 text-blue-300" />,
            className: "md:col-span-1",
            bg: "bg-neutral-900/80 border-white/10",
            glow: "group-hover:shadow-[0_0_30px_rgba(96,165,250,0.2)]"
        },
        {
            title: "Advanced Charts",
            description: "Professional-grade technical indicators at your fingertips.",
            icon: <BarChart2 className="w-6 h-6 text-emerald-300" />,
            className: "md:col-span-2",
            bg: "bg-gradient-to-bl from-slate-900/80 to-slate-800/50 border-white/10",
            glow: "group-hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]"
        },
    ];

    return (
        <section className="py-24 px-4 bg-black relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Power Tools for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Your Money</span></h2>
                    <p className="text-neutral-400 text-lg">Everything you need to dominate the market.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className={`relative overflow-hidden group rounded-3xl p-8 border ${feature.bg} ${feature.className} backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] ${feature.glow}`}
                        >
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-neutral-400 leading-relaxed">{feature.description}</p>
                                </div>

                                <div className="mt-8">
                                    <span className="inline-flex items-center text-sm font-medium text-white/50 group-hover:text-white transition-colors">
                                        Learn more <ArrowRight className="ml-2 w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
