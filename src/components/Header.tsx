import React, { useState } from 'react';
import { Calendar, MapPin, Menu, MessageSquareHeart, X } from 'lucide-react';

export type ActiveRoute =
  | '/'
  | '/biographie'
  | '/programme'
  | '/souvenirs'
  | '/confidentialite'
  | '/admin';

interface HeaderProps {
  displayName: string;
  activeRoute: ActiveRoute;
  onNavigate: (route: ActiveRoute, sectionId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  displayName,
  activeRoute,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{
    label: string;
    route: ActiveRoute;
    sectionId?: string;
  }> = [
    { label: 'Accueil', route: '/', sectionId: 'accueil' },
    { label: 'Faire-part', route: '/', sectionId: 'faire-part' },
    { label: 'Biographie', route: '/biographie', sectionId: 'biographie' },
    { label: 'Témoignages', route: '/', sectionId: 'temoignages' },
    { label: 'Programme', route: '/programme', sectionId: 'programme' },
    { label: 'Localisation', route: '/', sectionId: 'localisation' },
    { label: 'Souvenirs', route: '/souvenirs', sectionId: 'souvenirs' },
    { label: 'Contact', route: '/', sectionId: 'contact' },
  ];

  const handleLinkClick = (route: ActiveRoute, sectionId?: string) => {
    setMobileMenuOpen(false);
    onNavigate(route, sectionId);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#DCE8EF] no-print">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand / Name */}
          <button
            type="button"
            onClick={() => handleLinkClick('/', 'accueil')}
            className="text-left font-serif-editorial text-lg sm:text-xl font-semibold tracking-tight text-[#17191C] hover:text-[#245B7A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245B7A]"
          >
            {displayName}
          </button>

          {/* Zone 2: Desktop Navigation */}
          <nav
            aria-label="Navigation principale"
            className="hidden xl:flex items-center gap-5 text-sm font-medium text-[#56616A]"
          >
            {navItems.map((item) => {
              const isCurrentPage =
                item.route !== '/' && activeRoute === item.route;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleLinkClick(item.route, item.sectionId)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245B7A] ${
                    isCurrentPage
                      ? 'border-[#245B7A] text-[#17191C] font-semibold'
                      : 'border-transparent hover:text-[#17191C] hover:border-[#A9D7F2]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary CTA & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleLinkClick('/programme', 'programme')}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245B7A]"
            >
              Consulter le programme
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className="xl:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-[#DCE8EF] text-[#17191C] hover:bg-[#EFF8FD] transition-colors focus-visible:outline-2 focus-visible:outline-[#245B7A]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Accessible Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation-drawer"
            className="xl:hidden border-t border-[#DCE8EF] bg-white px-4 pt-3 pb-5 shadow-sm"
          >
            <nav aria-label="Menu mobile" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleLinkClick(item.route, item.sectionId)}
                  className="text-left px-3 py-2.5 rounded-md text-sm font-medium text-[#17191C] hover:bg-[#EFF8FD] border border-transparent hover:border-[#DCE8EF] transition-colors whitespace-nowrap"
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-3 pt-3 border-t border-[#DCE8EF] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleLinkClick('/programme', 'programme')}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md text-center transition-colors"
              >
                Consulter le programme
              </button>
              <button
                type="button"
                onClick={() => handleLinkClick('/admin')}
                className="text-xs text-[#56616A] hover:text-[#17191C] underline underline-offset-4 py-1"
              >
                Ajuster
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Discreet Mobile Bottom Quick Access (strictly <= 48px high to respect 15% mobile sticky cap) */}
      <div
        role="region"
        aria-label="Accès rapide mobile"
        className="mobile-quick-bar sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-t border-[#DCE8EF] h-11 px-3 flex items-center justify-around no-print"
      >
        <button
          type="button"
          onClick={() => handleLinkClick('/programme', 'programme')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#17191C] hover:text-[#245B7A] py-1.5 px-2 whitespace-nowrap"
        >
          <Calendar className="w-3.5 h-3.5 text-[#245B7A]" />
          <span>Programme</span>
        </button>
        <span aria-hidden="true" className="text-[#DCE8EF]">
          ·
        </span>
        <button
          type="button"
          onClick={() => handleLinkClick('/', 'localisation')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#17191C] hover:text-[#245B7A] py-1.5 px-2 whitespace-nowrap"
        >
          <MapPin className="w-3.5 h-3.5 text-[#245B7A]" />
          <span>Itinéraire</span>
        </button>
        <span aria-hidden="true" className="text-[#DCE8EF]">
          ·
        </span>
        <button
          type="button"
          onClick={() => handleLinkClick('/', 'contact')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#17191C] hover:text-[#245B7A] py-1.5 px-2 whitespace-nowrap"
        >
          <MessageSquareHeart className="w-3.5 h-3.5 text-[#245B7A]" />
          <span>Contact</span>
        </button>
      </div>
    </>
  );
};
