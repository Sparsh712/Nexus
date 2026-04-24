"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import useUser, { loginHref, logoutHref } from "@/lib/authClient";

export default function Navbar() {
  const [openNavigation, setOpenNavigation] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isSignedIn, isLoading } = useUser();

  const pathname = usePathname();
  const toggleNavigation = () => setOpenNavigation(!openNavigation);
  const handleNavClick = () => setOpenNavigation(false);

  // Smooth scroll to features when on home page
  const handleFeaturesClick = (e) => {
    if (pathname === "/") {
      e.preventDefault();
      const featuresSection = document.getElementById("features");
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const links = [
    { name: "Features", href: "/#features" },
    { name: "Stocks", href: "/dashboard" },
    { name: "Mutual Funds", href: "/mf" },
    { name: "Crypto", href: "/crypto" },
    { name: "Screener", href: "/screener" },
    { name: "Education Hub", href: "/education" },
    { name: "Simulator", href: "/simulator" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 border-b border-white/5 backdrop-blur-xl transition-all duration-300 ${openNavigation ? "bg-[#030014]/90" : "bg-[#030014]/50 supports-[backdrop-filter]:bg-[#030014]/50"
        }`}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 p-[1px] group-hover:scale-110 transition-transform duration-300">
            <div className="w-full h-full rounded-xl bg-[#0b0b12] flex items-center justify-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">N</span>
            </div>
          </div>
          <span className="hidden md:block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400 tracking-wide">
            NEXUS
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center bg-white/5 rounded-full px-2 py-1.5 border border-white/5 backdrop-blur-sm">
          {links.map((link) => {
            // Check if this link is active
            const isActive =
              (link.href === "/#features" && pathname === "/") ||
              (link.href !== "/#features" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={link.name === "Features" ? handleFeaturesClick : undefined}
                className={`relative px-5 py-2 text-sm font-medium transition-all duration-300 rounded-full whitespace-nowrap ${isActive
                  ? "bg-white/5 text-white"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
              >
                {link.name}
              </Link>
            );
          })}
          {isSignedIn && !isLoading && (
            <div className="w-px h-5 bg-white/10 mx-2"></div>
          )}
          {isSignedIn && !isLoading && (
            <Link
              href="/Portfolio"
              className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-purple-500/20 to-purple-500/10 text-purple-300 hover:text-purple-200 border border-purple-500/20 rounded-full hover:bg-purple-500/20 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
            >
              <span>My Portfolio</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          {isLoading ? (
            <div className="animate-pulse bg-white/10 h-10 w-28 rounded-full"></div>
          ) : isSignedIn && user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10 group"
              >
                <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-r from-cyan-500 to-purple-500">
                  <div className="w-full h-full rounded-full bg-[#0b0b12] flex items-center justify-center overflow-hidden">
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm">{(user.name || user.email || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm text-gray-200 font-medium max-w-[100px] truncate leading-tight">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Member</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-gray-400 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""} group-hover:text-white`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-4 w-72 p-3 rounded-2xl bg-[#0b0b12]/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-purple-500/10 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-white/5">
                  <div className="flex items-center gap-4 p-3 mb-2 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                      </div>
                      Settings
                    </Link>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>

                  <a
                    href={logoutHref}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                    </div>
                    Sign out
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <a
                href={loginHref}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign in
              </a>
              <a
                href={`${loginHref}?screen_hint=signup`}
                className="group relative px-6 py-2.5 rounded-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 group-hover:scale-105 transition-transform duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                <span className="relative text-sm font-bold text-white flex items-center gap-2">
                  Get Started
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </span>
              </a>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300"
          onClick={toggleNavigation}
        >
          <div className="space-y-1.5 relative w-6">
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${openNavigation ? "rotate-45 translate-y-2 bg-gradient-to-r from-cyan-400 to-purple-400" : ""
                }`}
            ></span>
            <span
              className={`block w-4 h-0.5 bg-gray-300 ml-auto transition-all duration-300 ${openNavigation ? "opacity-0" : ""
                }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${openNavigation ? "-rotate-45 -translate-y-2 bg-gradient-to-r from-cyan-400 to-purple-400" : ""
                }`}
            ></span>
          </div>
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {openNavigation && (
        <nav className="lg:hidden fixed top-[80px] left-4 right-4 bottom-4 rounded-3xl bg-[#0b0b12]/95 border border-white/10 backdrop-blur-2xl flex flex-col p-6 space-y-6 z-40 shadow-2xl overflow-y-auto ring-1 ring-white/5">
          <div className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (link.name === "Features") {
                    handleFeaturesClick(e);
                  }
                  handleNavClick();
                }}
                className="block px-4 py-3 text-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="h-px bg-white/5 my-2"></div>

          {isLoading ? (
            <div className="animate-pulse bg-white/10 h-10 w-full rounded-xl"></div>
          ) : isSignedIn && user ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold">{user.name}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              </div>

              <Link
                href="/Portfolio"
                onClick={handleNavClick}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20"
              >
                My Portfolio
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <a
                href={logoutHref}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 text-red-300 font-semibold rounded-xl border border-white/5 hover:bg-red-500/10 transition-colors"
              >
                Sign out
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-auto">
              <a
                href={loginHref}
                className="w-full text-center py-3.5 rounded-xl bg-white/5 text-white font-semibold border border-white/10"
              >
                Sign in
              </a>
              <a
                href={`${loginHref}?screen_hint=signup`}
                className="w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold shadow-lg shadow-purple-500/20"
              >
                Sign up
              </a>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

