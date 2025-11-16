import React, { useState, useEffect } from 'react';

const StickyNav: React.FC = () => {
  const [showSticky, setShowSticky] = useState(false);
  const [activeSection, setActiveSection] = useState<'ebooks' | 'bundles'>('ebooks');

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky nav after scrolling past hero section (adjust offset as needed)
      setShowSticky(window.scrollY > 600);

      // Determine active section based on scroll position
      const ebooksSection = document.getElementById('ebooks');
      const bundlesSection = document.getElementById('bundles');
      const scrollY = window.scrollY;
      const offset = 200;

      if (bundlesSection && scrollY >= bundlesSection.offsetTop - offset) {
        setActiveSection('bundles');
      } else if (ebooksSection && scrollY >= ebooksSection.offsetTop - offset) {
        setActiveSection('ebooks');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className={`fixed top-20 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-transform duration-300 ${
        showSticky ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex bg-gray-100 rounded-full p-1 max-w-md mx-auto">
          <button
            onClick={() => scrollToSection('ebooks')}
            className={`flex-1 py-2 px-6 rounded-full text-sm font-medium transition-all ${
              activeSection === 'ebooks'
                ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            eBooks
          </button>
          <button
            onClick={() => scrollToSection('bundles')}
            className={`flex-1 py-2 px-6 rounded-full text-sm font-medium transition-all ${
              activeSection === 'bundles'
                ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Bundles
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyNav;