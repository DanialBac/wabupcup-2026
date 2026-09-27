import React, { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import {
  Trophy,
  Calendar,
  MapPin,
  FileText,
  Search,
  Shield,
  Menu,
  X,
  Sun,
  Moon,
  Users,
  Flame,
  Award
} from 'lucide-react';

interface NavbarProps {
  onOpenRegister?: () => void;
  onOpenRegistration?: () => void;
  onOpenCheckStatus: () => void;
  onOpenAdmin: () => void;
  onNavigateKlasemen?: () => void;
  activeSection?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRegister,
  onOpenRegistration,
  onOpenCheckStatus,
  onOpenAdmin,
  onNavigateKlasemen,
  activeSection = 'beranda',
}) => {
  const { theme, toggleTheme, currentAdmin, config } = useTournament();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRegisterClick = () => {
    if (onOpenRegister) onOpenRegister();
    else if (onOpenRegistration) onOpenRegistration();
  };

  const visibility = config.sectionsVisibility || {
    hero: true,
    liveScore: true,
    categories: true,
    bracket: true,
    venue: true,
    sponsors: true,
  };

  const allNavLinks = [
    { id: 'beranda', label: 'Beranda', icon: Trophy, href: '#beranda', visible: visibility.hero !== false },
    { id: 'kategori', label: 'Kategori & Hadiah', icon: Award, href: '#kategori', visible: visibility.categories !== false },
    { id: 'live-jadwal', label: 'Live & Jadwal', icon: Flame, href: '#live-jadwal', visible: visibility.liveScore !== false },
    { id: 'bagan', label: 'Bagan & Tim', icon: Calendar, href: '#bagan', visible: visibility.bracket !== false },
    { id: 'lokasi', label: 'Lokasi Map', icon: MapPin, href: '#lokasi', visible: visibility.venue !== false },
    { id: 'sponsor', label: 'Sponsor', icon: Users, href: '#sponsor', visible: visibility.sponsors !== false },
  ];

  const navLinks = allNavLinks.filter(l => l.visible);

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/10 shadow-sm dark:shadow-black/30 text-slate-900 dark:text-white'
          : 'bg-white/45 dark:bg-slate-950/45 backdrop-blur-lg border-b border-slate-200/40 dark:border-white/5 text-slate-900 dark:text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* LOGO & TITLE */}
          <a
            id="nav-logo"
            href="#beranda"
            className="flex items-center space-x-3 group text-left cursor-pointer"
          >
            {config.wabupLogoUrl ? (
              <div className="relative flex items-center justify-center h-12 w-auto max-w-[56px] rounded-xl overflow-hidden group-hover:scale-105 transition-transform shrink-0">
                <img
                  src={config.wabupLogoUrl}
                  alt="Logo WabupCup"
                  width="48"
                  height="48"
                  loading="eager"
                  decoding="async"
                  className="max-h-12 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-blue-900 shadow-md shadow-red-900/30 border border-red-500/40 group-hover:scale-105 transition-transform shrink-0">
                <span className="text-2xl select-none animate-float-ball">⚽</span>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping [will-change:transform,opacity]"></span>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-2xl font-heading font-bold tracking-wider text-slate-900 dark:text-white uppercase leading-none drop-shadow-xs">
                  {config.name ? (
                    config.name.toUpperCase().includes('WABUP') ? (
                      <>
                        {config.name.split(' ')[0]} <span className="text-red-600 dark:text-red-500">{config.name.split(' ').slice(1).join(' ')}</span>
                      </>
                    ) : (
                      config.name
                    )
                  ) : (
                    <>WABUP<span className="text-red-600 dark:text-red-500">CUP</span></>
                  )}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 text-[10px] font-bold tracking-widest border border-blue-200 dark:border-blue-700/60 shadow-xs">
                  {config.edition || '2026'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-300">
                {config.tagline || 'Piala Wakil Bupati • Futsal'}
              </p>
            </div>

            {config.panitiaLogoUrl && (
              <div className="hidden sm:flex items-center pl-2 border-l border-slate-300 dark:border-slate-700/60">
                <img
                  src={config.panitiaLogoUrl}
                  alt="Logo Panitia"
                  width="44"
                  height="40"
                  loading="eager"
                  decoding="async"
                  className="max-h-10 max-w-[48px] object-contain"
                  title="Penyelenggara Resmi"
                />
              </div>
            )}
          </a>

          {/* DESKTOP NAV LINKS */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center space-x-1.5 ${
                    isActive
                      ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 font-bold border border-red-200 dark:border-red-500/30 shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-80" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </div>

          {/* ACTION BUTTONS */}
          <div className="hidden md:flex items-center space-x-2.5">
            {/* Standalone Klasemen Link */}
            {onNavigateKlasemen && visibility.standaloneKlasemen !== false && (
              <button
                onClick={onNavigateKlasemen}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 dark:text-amber-300 dark:hover:text-white dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:border-amber-500/40 transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                title="Buka Halaman Klasemen & Jadwal Resmi"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Klasemen & Jadwal</span>
              </button>
            )}

            {/* Cek Status Tim */}
            <button
              id="btn-nav-check-status"
              onClick={onOpenCheckStatus}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 dark:text-slate-200 dark:hover:text-white dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:border-slate-700/70 transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              title="Cek Status Pendaftaran Tim Anda"
            >
              <Search className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>Cek Status</span>
            </button>

            {/* Dark/Light Switcher */}
            <button
              id="btn-theme-toggle"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700/70 transition flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
              title={theme === 'dark' ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
              aria-label="Toggle dark/light mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* Admin Portal Button */}
            <button
              id="btn-admin-portal"
              onClick={onOpenAdmin}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 shadow-xs cursor-pointer ${
                currentAdmin
                  ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border-slate-300 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:border-slate-700/70'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-red-500" />
              <span>{currentAdmin ? `CMS (${currentAdmin.role})` : 'Admin CMS'}</span>
            </button>

            {/* CTA Daftar Sekarang */}
            <button
              id="btn-nav-register"
              onClick={handleRegisterClick}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-md shadow-red-600/30 border border-red-500/50 hover:shadow-red-600/50 transition transform active:scale-95 flex items-center space-x-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Daftar Tim</span>
            </button>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              id="btn-mobile-theme-toggle"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-900/80 dark:text-slate-200 dark:border-slate-700/80 shadow-xs cursor-pointer"
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              aria-label={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-900/80 dark:text-slate-200 dark:border-slate-700/80 shadow-xs cursor-pointer"
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div
          id="mobile-drawer"
          className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map(link => {
              const Icon = link.icon;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-white flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4 text-red-500" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {onNavigateKlasemen && visibility.standaloneKlasemen !== false && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateKlasemen();
                }}
                className="w-full py-2.5 rounded-xl bg-amber-950/40 text-amber-300 font-bold text-xs flex items-center justify-center space-x-2 border border-amber-500/40"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Buka Klasemen & Jadwal Turnamen 🏆</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCheckStatus();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-800"
            >
              <Search className="w-4 h-4 text-blue-500" />
              <span>Cek Status Berkas Pendaftaran</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-800"
            >
              <Shield className="w-4 h-4 text-amber-500" />
              <span>{currentAdmin ? `CMS Admin (${currentAdmin.role})` : 'Login Admin CMS'}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleRegisterClick();
              }}
              className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-600/40 flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Daftar Tim Sekarang ⚡</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
