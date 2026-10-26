/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AdminPageView } from './components/AdminPageView';
import { BiographySectionView } from './components/BiographySectionView';
import { ContactCondolencesSection } from './components/ContactCondolencesSection';
import { DovesOverlay } from './components/DovesOverlay';
import { FairePartSection } from './components/FairePartSection';
import { Footer } from './components/Footer';
import { ActiveRoute, Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { LocationSectionView } from './components/LocationSectionView';
import { PhotosSectionView } from './components/PhotosSectionView';
import { PrivacyPageView } from './components/PrivacyPageView';
import { ProgramSectionView } from './components/ProgramSectionView';
import { SkyBackground } from './components/SkyBackground';
import { TributesSectionView } from './components/TributesSectionView';
import {
  INITIAL_BIOGRAPHY_SECTIONS,
  INITIAL_FAMILIES,
  INITIAL_MEMORIAL_SETTINGS,
  INITIAL_PHOTOS,
  INITIAL_PROGRAM_EVENTS,
  INITIAL_TRIBUTES,
} from './data/initialMemorialData';
import {
  DraftTributeProposal,
  MemorialPublicPayload,
} from './types/memorial';

function resolveRouteFromPathname(pathname: string): ActiveRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/biographie') return '/biographie';
  if (clean === '/programme') return '/programme';
  if (clean === '/souvenirs') return '/souvenirs';
  if (clean === '/confidentialite') return '/confidentialite';
  if (clean === '/admin') return '/admin';
  return '/';
}

const FALLBACK_PUBLIC_PAYLOAD: MemorialPublicPayload = {
  settings: {
    ...INITIAL_MEMORIAL_SETTINGS,
    whatsappNumber: '',
    hasUnconfirmedContactConfigured: true,
  },
  families: INITIAL_FAMILIES,
  biographySections: INITIAL_BIOGRAPHY_SECTIONS.filter(
    (s) => s.isVisiblePublic && s.content.trim().length > 0
  ),
  programEvents: INITIAL_PROGRAM_EVENTS,
  approvedTributes: INITIAL_TRIBUTES,
  approvedPhotos: INITIAL_PHOTOS,
  attendances: [],
  backendStatus: {
    connected: false,
    storageEngine: 'server_persistent_json',
    supabaseConfigured: false,
  },
};

export default function App() {
  const [activeRoute, setActiveRoute] = useState<ActiveRoute>(() =>
    resolveRouteFromPathname(window.location.pathname)
  );
  const [payload, setPayload] = useState<MemorialPublicPayload>(
    FALLBACK_PUBLIC_PAYLOAD
  );
  const [selectedDraftProposal, setSelectedDraftProposal] =
    useState<DraftTributeProposal | null>(null);

  // Presence confirmation modal & Top-to-Bottom White Doves animation state
  const [presenceModalOpen, setPresenceModalOpen] = useState(false);
  const [activeDoveFlightId, setActiveDoveFlightId] = useState<number | null>(
    null
  );

  const triggerDovesAnimation = useCallback(() => {
    const flightId = Date.now();
    setActiveDoveFlightId(flightId);
    setTimeout(() => {
      setActiveDoveFlightId((current) =>
        current === flightId ? null : current
      );
    }, 6800);
  }, []);

  const loadMemorialData = useCallback(async () => {
    try {
      const response = await fetch('/api/memorial');
      if (!response.ok) throw new Error('API non disponible');
      const data = (await response.json()) as MemorialPublicPayload;
      setPayload(data);
    } catch {
      setPayload((prev) => ({
        ...prev,
        backendStatus: {
          ...prev.backendStatus,
          connected: false,
        },
      }));
    }
  }, []);

  useEffect(() => {
    loadMemorialData();
  }, [loadMemorialData]);

  useEffect(() => {
    const handlePopState = () => {
      setActiveRoute(resolveRouteFromPathname(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (route: ActiveRoute, sectionId?: string) => {
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
      setActiveRoute(route);
    }

    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectDraftProposal = (draft: DraftTributeProposal) => {
    setSelectedDraftProposal(draft);
  };

  return (
    <div className="relative min-h-screen flex flex-col text-[#17191C]">
      {/* Moving Sky Background & Click Ripple Animation */}
      <SkyBackground />

      {/* Top-to-Bottom White Doves Cascade & Presence Confirmation Modal */}
      <DovesOverlay
        activeFlightId={activeDoveFlightId}
        isModalOpen={presenceModalOpen}
        onCloseModal={() => setPresenceModalOpen(false)}
        onTriggerDoves={triggerDovesAnimation}
        displayName={payload.settings.displayName}
        attendances={payload.attendances || []}
        onAttendanceSaved={loadMemorialData}
      />

      <Header
        displayName={payload.settings.displayName}
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
      />

      <main className="relative z-10 flex-1 animate-gentle-fade print-container">
        {activeRoute === '/admin' && (
          <AdminPageView
            onNavigate={handleNavigate}
            onPublicDataChanged={loadMemorialData}
          />
        )}

        {activeRoute === '/confidentialite' && (
          <PrivacyPageView
            settings={payload.settings}
            onNavigate={handleNavigate}
          />
        )}

        {activeRoute === '/biographie' && (
          <>
            <BiographySectionView
              settings={payload.settings}
              sections={payload.biographySections}
              isDedicatedPage
            />
            <FairePartSection
              settings={payload.settings}
              families={payload.families}
            />
          </>
        )}

        {activeRoute === '/programme' && (
          <>
            <ProgramSectionView
              settings={payload.settings}
              events={payload.programEvents}
              isDedicatedPage
              onOpenPresenceModal={() => {
                triggerDovesAnimation();
                setPresenceModalOpen(true);
              }}
            />
            <LocationSectionView
              settings={payload.settings}
              onNavigate={handleNavigate}
            />
          </>
        )}

        {activeRoute === '/souvenirs' && (
          <PhotosSectionView
            settings={payload.settings}
            approvedPhotos={payload.approvedPhotos}
            backendConnected={payload.backendStatus.connected}
            isDedicatedPage
            onRefreshData={loadMemorialData}
          />
        )}

        {activeRoute === '/' && (
          <>
            <HeroSection
              settings={payload.settings}
              portraitUrl={payload.settings.portraitUrl}
              onNavigate={handleNavigate}
              onOpenPresenceModal={() => setPresenceModalOpen(true)}
              onTriggerDoves={triggerDovesAnimation}
            />
            <FairePartSection
              settings={payload.settings}
              families={payload.families}
            />
            <BiographySectionView
              settings={payload.settings}
              sections={payload.biographySections}
            />
            <ProgramSectionView
              settings={payload.settings}
              events={payload.programEvents}
              onOpenPresenceModal={() => {
                triggerDovesAnimation();
                setPresenceModalOpen(true);
              }}
            />
            <LocationSectionView
              settings={payload.settings}
              onNavigate={handleNavigate}
            />
            <TributesSectionView
              approvedTributes={payload.approvedTributes}
              backendConnected={payload.backendStatus.connected}
              onSelectDraftProposal={handleSelectDraftProposal}
              onRefreshData={loadMemorialData}
            />
            <PhotosSectionView
              settings={payload.settings}
              approvedPhotos={payload.approvedPhotos}
              backendConnected={payload.backendStatus.connected}
              onRefreshData={loadMemorialData}
            />
            <ContactCondolencesSection
              settings={payload.settings}
              backendConnected={payload.backendStatus.connected}
              prefilledDraft={selectedDraftProposal}
              onClearDraft={() => setSelectedDraftProposal(null)}
              onRefreshData={loadMemorialData}
            />
          </>
        )}
      </main>

      <div className="relative z-10">
        <Footer settings={payload.settings} onNavigate={handleNavigate} />
      </div>
    </div>
  );
}
