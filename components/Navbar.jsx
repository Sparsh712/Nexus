import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-3">
            <div className="glass-panel rounded-full px-3 py-2 flex items-center gap-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border-2 border-cyan-400 flex items-center justify-center bg-black/50">
                        <span className="text-white font-bold text-sm">N</span>
                    </div>
                    <span className="font-bold text-base tracking-tight text-white">NEXUS</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-5">
                    <NavLink href="/#features">Features</NavLink>
                    <NavLink href="/dashboard">Stocks</NavLink>
                    <NavLink href="/mf">Mutual Funds</NavLink>
                    <NavLink href="/crypto">Crypto</NavLink>
                    <NavLink href="/education">Education Hub</NavLink>
                    <NavLink href="/simulator">Simulator</NavLink>
                </div>

                {/* My Portfolio Button */}
                <Link
                    href="/portfolio"
                    className="hidden md:flex items-center gap-1 text-sm font-medium text-white px-4 py-1.5 rounded-full border border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 transition-colors whitespace-nowrap"
                >
                    My Portfolio <span className="text-purple-400">+</span>
                </Link>

                {/* User Profile */}
                <div className="hidden md:flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">S</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white text-xs font-medium truncate max-w-[100px]">sparygoel@...</span>
                        <span className="text-gray-400 text-[10px] uppercase tracking-wider">Member</span>
                    </div>
                </div>
            </div>
        </nav>
    );
}

const NavLink = ({ href, children }) => {
    return (
        <Link
            href={href}
            className="text-sm font-medium text-white/70 hover:text-white transition-colors whitespace-nowrap"
        >
            {children}
        </Link>
    );
};
