export const Footer = () => {
  return (
    <footer className="py-12 border-t border-white/10 bg-black text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="text-xl font-bold tracking-tighter mb-2">NEXUS</div>
            <p className="text-neutral-500 text-sm">
              © {new Date().getFullYear()} Vectôr Inc. All rights reserved.
            </p>
          </div>

          <nav className="flex gap-8">
            <a href="#" className="text-neutral-500 hover:text-white transition-colors text-sm">Privacy</a>
            <a href="#" className="text-neutral-500 hover:text-white transition-colors text-sm">Terms</a>
            <a href="#" className="text-neutral-500 hover:text-white transition-colors text-sm">Twitter</a>
            <a href="#" className="text-neutral-500 hover:text-white transition-colors text-sm">GitHub</a>
          </nav>
        </div>
      </div>
    </footer>
  );
};
