/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { LiveScoreSection } from './components/LiveScoreSection';
import { CategoryPrizeSection } from './components/CategoryPrizeSection';
import { ScheduleBracketSection } from './components/ScheduleBracketSection';
import { VenueLocationSection } from './components/VenueLocationSection';
import { SponsorSection } from './components/SponsorSection';
import { Footer } from './components/Footer';
import { StandaloneKlasemenPage } from './components/StandaloneKlasemenPage';
import { TournamentCategory, MatchItem } from './types';

// Robust lazy-load helper with retry logic against stale browser cache or network glitches
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      console.warn('Chunk load error occurred, retrying module import...', error);
      try {
        return await factory();
      } catch (retryError) {
        if (typeof window !== 'undefined') {
          const reloaded = window.sessionStorage.getItem('wb_chunk_reload');
          if (!reloaded) {
            window.sessionStorage.setItem('wb_chunk_reload', 'true');
            window.location.reload();
          }
        }
        throw retryError;
      }
    }
  });
}

/**
 * Dynamic Meta Tag Manager:
 * Synchronizes document.title, meta description, OpenGraph, and Twitter tags
 * based on the active route/page (Landing, Klasemen, Admin, or specific Tournament Match).
 */
function useDynamicMetaManager(
  currentPage: 'landing' | 'klasemen' | 'admin',
  tournamentName: string,
  matches?: MatchItem[]
) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const brand = tournamentName || 'WabupCup 2026';
    let title = '';
    let description = '';

    // Check if deep-linked to a specific public tournament match
    let activeMatch: MatchItem | undefined;
    if (typeof window !== 'undefined' && matches && matches.length > 0) {
      const matchPathMatch = window.location.pathname.match(/^\/match\/([a-zA-Z0-9_-]+)/);
      const queryMatchId = new URLSearchParams(window.location.search).get('match');
      const targetMatchId = matchPathMatch ? matchPathMatch[1] : queryMatchId;
      if (targetMatchId) {
        activeMatch = matches.find((m) => m.id === targetMatchId);
      }
    }

    if (activeMatch) {
      const teamA = activeMatch.teamA?.name || 'Tim A';
      const teamB = activeMatch.teamB?.name || 'Tim B';
      const scoreText =
        activeMatch.teamA?.score !== undefined && activeMatch.teamB?.score !== undefined
          ? ` (${activeMatch.teamA.score} - ${activeMatch.teamB.score})`
          : '';
      const roundText = activeMatch.round || 'Pertandingan';
      const catText = activeMatch.category || 'Turnamen';

      title = `${teamA} vs ${teamB}${scoreText} – ${catText} ${roundText} | ${brand}`;
      description = `Info jadwal dan live score pertandingan futsal ${teamA} vs ${teamB} (${catText} - ${roundText}) di turnamen ${brand}. Status: ${activeMatch.status}.`;
    } else {
      switch (currentPage) {
        case 'admin':
          title = `CMS Admin Portal – ${brand}`;
          description = `Panel manajemen resmi turnamen ${brand} untuk mengelola jadwal pertandingan, live score, tim peserta, bagan turnamen, dan verifikasi pendaftaran.`;
          break;
        case 'klasemen': {
          let catSuffix = '';
          if (typeof window !== 'undefined') {
            const urlCat = new URLSearchParams(window.location.search).get('category');
            if (urlCat) catSuffix = ` Kategori ${urlCat}`;
          }
          title = `Klasemen & Statistik Tim${catSuffix} – ${brand}`;
          description = `Pantau klasemen terbaru, perolehan poin, selisih gol, dan statistik pertandingan tim di turnamen ${brand} secara interaktif dan real-time.`;
          break;
        }
        case 'landing':
        default:
          title = `${brand} – Turnamen Futsal & Sepakbola Resmi`;
          description = `Platform resmi turnamen futsal ${brand} dengan jadwal pertandingan lengkap, bagan interaktif, live score real-time, dan pendaftaran tim online.`;
          break;
      }
    }

    // 1. Update document title
    document.title = title;

    // 2. Helper to set/create meta tags
    const setMetaTag = (attributeName: 'name' | 'property', attributeValue: string, contentValue: string) => {
      let el = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attributeName, attributeValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentValue);
    };

    // 3. Update standard meta description
    setMetaTag('name', 'description', description);

    // 4. Update OpenGraph meta tags
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', brand);

    // 5. Update Twitter card meta tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);

    // 6. Update Canonical & og:url if window is available
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      setMetaTag('property', 'og:url', currentUrl);
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', currentUrl);
    }
  }, [currentPage, tournamentName, matches]);
}

const RegistrationForm = lazyWithRetry(() =>
  import('./components/RegistrationForm').then((module) => ({ default: module.RegistrationForm }))
);
const CheckStatusModal = lazyWithRetry(() =>
  import('./components/CheckStatusModal').then((module) => ({ default: module.CheckStatusModal }))
);
const AdminDashboard = lazyWithRetry(() =>
  import('./components/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard }))
);

const MainLayout: React.FC = () => {
  const { config, matches, isInitialLoading } = useTournament();
  const [currentPage, setCurrentPage] = useState<'landing' | 'klasemen' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      if (
        window.location.pathname === '/admin' ||
        window.location.hash === '#/admin' ||
        window.location.search.includes('page=admin')
      ) {
        return 'admin';
      }
      if (
        window.location.pathname === '/klasemen' ||
        window.location.hash === '#/klasemen' ||
        window.location.search.includes('page=klasemen')
      ) {
        return 'klasemen';
      }
    }
    return 'landing';
  });

  // Dynamic Meta Tag Manager for Document Title & Meta Descriptions
  useDynamicMetaManager(currentPage, config.name || 'WabupCup 2026', matches);

  // Auto-scroll & visual highlight when targeted match is requested via URL (/match/:id or ?match=:id)
  useEffect(() => {
    if (typeof window === 'undefined' || !matches || matches.length === 0) return;
    const matchPathMatch = window.location.pathname.match(/^\/match\/([a-zA-Z0-9_-]+)/);
    const queryMatchId = new URLSearchParams(window.location.search).get('match');
    const targetMatchId = matchPathMatch ? matchPathMatch[1] : queryMatchId;

    if (targetMatchId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`match-card-${targetMatchId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-red-500', 'ring-offset-2', 'scale-[1.01]');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2', 'scale-[1.01]');
          }, 3500);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [matches]);

  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regCategory, setRegCategory] = useState<TournamentCategory>('SMA');
  const [isCheckStatusOpen, setIsCheckStatusOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      if (
        window.location.hash === '#/admin' ||
        window.location.pathname === '/admin' ||
        window.location.search.includes('page=admin')
      ) {
        setCurrentPage('admin');
      } else if (
        window.location.hash === '#/klasemen' ||
        window.location.pathname === '/klasemen' ||
        window.location.search.includes('page=klasemen')
      ) {
        setCurrentPage('klasemen');
      } else {
        setCurrentPage('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateToAdmin = () => {
    setCurrentPage('admin');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '#/admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToKlasemen = () => {
    setCurrentPage('klasemen');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '#/klasemen');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToLanding = () => {
    setCurrentPage('landing');
    if (typeof window !== 'undefined') {
      const cleanPath = window.location.pathname === '/admin' || window.location.pathname === '/klasemen' ? '/' : window.location.pathname;
      window.history.pushState(null, '', cleanPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenRegistration = (category?: TournamentCategory) => {
    if (category) {
      setRegCategory(category);
    }
    setIsRegModalOpen(true);
  };

  const visibility = config.sectionsVisibility || {
    hero: true,
    liveScore: true,
    categories: true,
    bracket: true,
    venue: true,
    sponsors: true,
    standaloneKlasemen: true,
    klasemenLanding: true,
    registrationButton: true,
  };

  useEffect(() => {
    if (currentPage === 'admin') {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    }
  }, [currentPage]);

  return (
    <div
      className={
        currentPage === 'admin'
          ? "fixed inset-0 w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white transition-colors duration-200"
          : "min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white transition-colors duration-200 relative overflow-x-clip"
      }
    >
      {/* AMBIENT LIGHT REFLECTIONS FOR GLASS TRANSLUCENCY IN BOTH LIGHT & DARK */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-red-500/10 dark:bg-red-600/15 rounded-full blur-[120px] will-change-transform" />
        <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] bg-blue-500/8 dark:bg-blue-600/12 rounded-full blur-[140px] will-change-transform" />
        <div className="absolute bottom-1/4 -left-32 w-[550px] h-[550px] bg-amber-500/8 dark:bg-amber-600/10 rounded-full blur-[130px] will-change-transform" />
      </div>

      {/* INITIAL SERVER SYNC PROGRESS BAR */}
      {isInitialLoading && (
        <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
          <div className="h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse w-full shadow-sm shadow-red-500/30" />
        </div>
      )}

      {/* CONDITIONAL RENDERING: STANDALONE ADMIN PAGE VS STANDALONE KLASEMEN PAGE VS LANDING PAGE */}
      {currentPage === 'admin' ? (
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-900/90 border border-white/10 shadow-2xl">
                <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold tracking-wide">Memuat Panel Admin CMS...</span>
              </div>
            </div>
          }
        >
          <AdminDashboard onClose={navigateToLanding} isStandalonePage={true} />
        </Suspense>
      ) : currentPage === 'klasemen' ? (
        <StandaloneKlasemenPage
          onBackToHome={navigateToLanding}
          onOpenRegister={handleOpenRegistration}
          onOpenAdmin={navigateToAdmin}
        />
      ) : (
        <>
          {/* NAVBAR */}
          <Navbar
            onOpenRegister={() => handleOpenRegistration()}
            onOpenRegistration={() => handleOpenRegistration()}
            onOpenCheckStatus={() => setIsCheckStatusOpen(true)}
            onOpenAdmin={navigateToAdmin}
            onNavigateKlasemen={navigateToKlasemen}
          />

          {/* HERO SECTION */}
          {visibility.hero !== false && (
            <Hero
              onOpenRegister={() => handleOpenRegistration()}
              onOpenRegistration={() => handleOpenRegistration()}
              onOpenCheckStatus={() => setIsCheckStatusOpen(true)}
            />
          )}

          {/* LIVE SCORE & TICKER SECTION */}
          {visibility.liveScore !== false && <LiveScoreSection />}

          {/* TOURNAMENT CATEGORIES & PRIZES */}
          {visibility.categories !== false && (
            <CategoryPrizeSection
              onSelectCategoryToRegister={(cat) => handleOpenRegistration(cat)}
            />
          )}

          {/* TOURNAMENT BRACKET & FULL SCHEDULE & TEAMS DIRECTORY */}
          {visibility.bracket !== false && (
            <ScheduleBracketSection
              onOpenRegister={(cat) => handleOpenRegistration(cat)}
            />
          )}

          {/* VENUE LOCATION & GOOGLE MAPS */}
          {visibility.venue !== false && <VenueLocationSection />}

          {/* SPONSORSHIP & OFFICIAL PARTNERS */}
          {visibility.sponsors !== false && <SponsorSection />}

          {/* FOOTER */}
          <Footer
            onOpenCheckStatus={() => setIsCheckStatusOpen(true)}
            onOpenRegistration={() => handleOpenRegistration()}
            onOpenAdmin={navigateToAdmin}
            onNavigateKlasemen={navigateToKlasemen}
          />
        </>
      )}

      {/* LAZY LOADED MODALS (Loaded on-demand to keep initial bundle tiny) */}
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-900/90 border border-white/10 text-white shadow-2xl">
              <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold tracking-wide">Memuat komponen...</span>
            </div>
          </div>
        }
      >
        {isRegModalOpen && (
          <RegistrationForm
            isOpen={isRegModalOpen}
            onClose={() => setIsRegModalOpen(false)}
            preselectedCategory={regCategory}
          />
        )}

        {isCheckStatusOpen && (
          <CheckStatusModal
            isOpen={isCheckStatusOpen}
            onClose={() => setIsCheckStatusOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <TournamentProvider>
      <MainLayout />
    </TournamentProvider>
  );
}
