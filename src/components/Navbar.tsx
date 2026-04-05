"use client";

import Link from 'next/link';
import { Brain, LayoutDashboard, Calendar, UploadCloud, Settings, LogIn } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Planner', path: '/dashboard/planner', icon: Calendar },
    { name: 'Upload', path: '/dashboard/upload', icon: UploadCloud },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/10">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Brain className="w-8 h-8 text-[#00f2fe] glow-icon group-hover:animate-pulse" />
          <span className="font-outfit font-bold text-xl tracking-wide">IntelliTwin</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.path} 
                href={link.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? 'text-[#00f2fe]' : 'text-gray-400 hover:text-white'}`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-[#00f2fe]/50 hover:bg-[#00f2fe]/10 transition-all text-sm font-medium">
            <LogIn className="w-4 h-4" />
            Login
          </Link>
          <Link href="/signup" className="px-4 py-2 rounded-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white text-sm font-medium hover:shadow-[0_0_15px_rgba(0,242,254,0.4)] transition-all">
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
