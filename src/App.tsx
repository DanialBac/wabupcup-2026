/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TournamentProvider } from './context/TournamentContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { LiveScoreSection } from './components/LiveScoreSection';
import { CategoryPrizeSection } from './components/CategoryPrizeSection';
import { ScheduleBracketSection } from './components/ScheduleBracketSection';
import { VenueLocationSection } from './components/VenueLocationSection';
import { SponsorSection } from './components/SponsorSection';
import { Footer } from './components/Footer';
import { RegistrationForm } from './components/RegistrationForm';
import { CheckStatusModal } from './components/CheckStatusModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TournamentCategory } from './types';

const MainLayout: React.FC = () => {
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regCategory, setRegCategory] = useState<TournamentCategory>('SMA');
  const [isCheckStatusOpen, setIsCheckStatusOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const handleOpenRegistration = (category?: TournamentCategory) => {
    if (category) {
      setRegCategory(category);
    }
    setIsRegModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* NAVBAR */}
      <Navbar
        onOpenRegistration={() => handleOpenRegistration()}
        onOpenCheckStatus={() => setIsCheckStatusOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* HERO SECTION */}
      <Hero
        onOpenRegistration={() => handleOpenRegistration()}
        onOpenCheckStatus={() => setIsCheckStatusOpen(true)}
      />

      {/* LIVE SCORE & TICKER SECTION */}
      <LiveScoreSection />

      {/* 6 TOURNAMENT CATEGORIES & PRIZES */}
      <CategoryPrizeSection
        onSelectCategoryToRegister={(cat) => handleOpenRegistration(cat)}
      />

      {/* TOURNAMENT BRACKET & FULL SCHEDULE */}
      <ScheduleBracketSection />

      {/* VENUE LOCATION & GOOGLE MAPS */}
      <VenueLocationSection />

      {/* SPONSORSHIP & OFFICIAL PARTNERS */}
      <SponsorSection />

      {/* FOOTER */}
      <Footer
        onOpenCheckStatus={() => setIsCheckStatusOpen(true)}
        onOpenRegistration={() => handleOpenRegistration()}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* REGISTRATION FORM MODAL */}
      <RegistrationForm
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        preselectedCategory={regCategory}
      />

      {/* CHECK STATUS MODAL */}
      <CheckStatusModal
        isOpen={isCheckStatusOpen}
        onClose={() => setIsCheckStatusOpen(false)}
      />

      {/* CMS ADMIN DASHBOARD FULL MODAL */}
      {isAdminOpen && (
        <AdminDashboard onClose={() => setIsAdminOpen(false)} />
      )}
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
