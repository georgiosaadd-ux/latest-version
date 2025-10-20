import React, { useState, useEffect } from 'react';
import { ShoppingCart, BookOpen, Volume2, ExternalLink, ChevronRight, Mail } from 'lucide-react';
import { EBook, CartItem } from '../types';
import { activeCategories } from '../data/products';
import PreviewModal from './PreviewModal';
import { formatCurrency } from '../utils/currency';

interface EbookGridProps {
  ebooks: EBook[];
  onAddToCart: (item: CartItem) => void;
  selectedCategory?: string;
}

const EbookGrid: React.FC<EbookGridProps> = ({ ebooks, onAddToCart, selectedCategory = 'All' }) => {
  const [previewEbook, setPreviewEbook] = useState<EBook | null>(null);
  const [activeTab, setActiveTab] = useState<string>('manipulation-toxic');
  const [showStickyTabs, setShowStickyTabs] = useState(false);
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const [submittedEmails, setSubmittedEmails] = useState<Record<string, boolean>>({});

  const handleAddToCart = (ebook: EBook) => {
    console.log('EbookGrid adding to cart:', ebook);
    onAddToCart(ebook);
  };

  const openPreview = (ebook: EBook) => {
    setPreviewEbook(ebook);
  };

  const closePreview = () => {
    setPreviewEbook(null);
  };

  const handleEmailChange = (ebookId: string, email: string) => {
    setEmailInputs(prev => ({ ...prev, [ebookId]: email }));
  };

  const handleNotifyMe = (ebook: EBook) => {
    const email = emailInputs[ebook.id];
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    // Store email (you can send this to your backend later)
    console.log('Early access signup:', { ebookId: ebook.id, email, ebookTitle: ebook.title });
    
    // Mark as submitted
    setSubmittedEmails(prev => ({ ...prev, [ebook.id]: true }));
    
    // Show success message
    setTimeout(() => {
      alert('Thank you! We\'ll notify you when this ebook launches.');
    }, 100);
  };

  const getEbooksByCategory = (category: string) => {
    return ebooks.filter(ebook => ebook.category === category);
  };

  const getCategoryAnchor = (category: string) => {
    return category === 'Manipulation & Toxic Relationships' ? 'manipulation-toxic' : 
           category === 'Dating & Red Flags' ? 'dating-red-flags' : 'self-empowering';
  };

  const getCategoryColors = (category: string) => {
    if (category === 'Manipulation & Toxic Relationships') {
      return { from: 'from-[hsl(333,65%,59%)]', to: 'to-[hsl(335,77%,80%)]', bg: 'bg-purple-100', text: 'text-purple-700' };
    } else if (category === 'Dating & Red Flags') {
      return { from: 'from-[hsl(333,65%,59%)]', to: 'to-[hsl(335,77%,80%)]', bg: 'bg-rose-100', text: 'text-rose-700' };
    } else {
      return { from: 'from-[hsl(333,65%,59%)]', to: 'to-[hsl(335,77%,80%)]', bg: 'bg-pink-100', text: 'text-pink-700' };
    }
  };

  const scrollToCategory = (category: string) => {
    const anchor = getCategoryAnchor(category);
    const element = document.getElementById(anchor);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll spy and sticky tabs logic
  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector('section');
      const heroBottom = heroSection ? heroSection.offsetTop + heroSection.offsetHeight : 0;
      
      setShowStickyTabs(window.scrollY > heroBottom + 200);

      const manipulationSection = document.getElementById('manipulation-toxic');
      const datingSection = document.getElementById('dating-red-flags');
      const selfSection = document.getElementById('self-empowering');
      
      if (manipulationSection && datingSection && selfSection) {
        const manipulationTop = manipulationSection.offsetTop - 150;
        const datingTop = datingSection.offsetTop - 150;
        const selfTop = selfSection.offsetTop - 150;
        
        if (window.scrollY >= selfTop) {
          setActiveTab('self-empowering');
        } else if (window.scrollY >= datingTop) {
          setActiveTab('dating-red-flags');
        } else if (window.scrollY >= manipulationTop) {
          setActiveTab('manipulation-toxic');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="ebooks" className="py-16 bg-gradient-to-br from-gray-50 to-pink-50">
      <div className="container mx-auto px-4">
        {/* Audio Hook Section */}
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent text-2xl md:text-3xl lg:text-4xl block mb-2">
              Every ebook come with a 
            </span>
            <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent text-4xl md:text-6xl lg:text-7xl">
           Voice Summary
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your day is busy, but your growth doesn't have to wait! Hear the key lessons anytime, anywhere.
          </p>
        </div>

        {/* Sticky Segmented Tabs (Mobile) */}
        <div className={`md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-all duration-300 ${
          showStickyTabs ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => scrollToCategory('Manipulation & Toxic Relationships')}
                className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'manipulation-toxic'
                    ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Manipulation
              </button>
              <button
                onClick={() => scrollToCategory('Dating & Red Flags')}
                className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'dating-red-flags'
                    ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Dating
              </button>
              <button
                onClick={() => scrollToCategory('Self Empowering')}
                className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'self-empowering'
                    ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Self
              </button>
            </div>
          </div>
        </div>

        {/* Mini Jump Menu (Compact) */}
        <div className="md:hidden mb-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">Jump to:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => scrollToCategory('Manipulation & Toxic Relationships')}
                className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all"
              >
                Manipulation & Toxic
              </button>
              <button
                onClick={() => scrollToCategory('Dating & Red Flags')}
                className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all"
              >
                Dating & Red Flags
              </button>
              <button
                onClick={() => scrollToCategory('Self Empowering')}
                className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all"
              >
                Self Empowering
              </button>
            </div>
          </div>
        </div>

        {/* Active Categories with eBooks */}
        {activeCategories.map((category, categoryIndex) => {
          const categoryEbooks = getEbooksByCategory(category);
          const colors = getCategoryColors(category);
          const anchor = getCategoryAnchor(category);
          
          return (
            <div key={category} className="mb-16">
              {/* Category Banner */}
              <div id={anchor} className={`bg-gradient-to-r ${colors.from} ${colors.to} rounded-2xl p-8 mb-8 text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold mb-2">
                        {category}
                      </h3>
                      <p className="text-xl md:text-2xl opacity-90 mb-2">
                        {category === 'Manipulation & Toxic Relationships' 
                          ? 'Recognize the patterns, protect your peace'
                          : category === 'Dating & Red Flags'
                          ? 'Navigate modern dating with confidence'
                          : 'Build unshakeable confidence and self-worth'
                        }
                      </p>
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                        <BookOpen size={16} />
                        <span className="font-medium">{categoryEbooks.length} eBooks</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {categoryIndex > 0 && (
                <div className="md:hidden mb-8">
                  <div className="h-1 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-full"></div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {categoryEbooks.map((ebook) => (
                  <div
                    key={ebook.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden flex flex-col h-full relative"
                  >
                    {/* Cover */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={ebook.cover}
                        alt={ebook.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      {ebook.badges.length > 0 && (
                        <div className="absolute top-3 right-3">
                          {ebook.badges.map((badge) => (
                            <span
                              key={badge}
                              className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-2 py-1 rounded-full text-xs font-semibold mr-1"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                      {ebook.comingSoon && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                            Coming Soon
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      {/* Title and description */}
                      <h4 className="font-heading text-xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                          {ebook.title}
                        </span>
                      </h4>
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        {ebook.description}
                      </p>

                      {/* Pages and Audio info */}
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <BookOpen size={14} />
                          <span>{ebook.pages}+ pages</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Volume2 size={14} />
                          <span>{ebook.audioMinutes}+ min audio</span>
                        </div>
                      </div>

                      {/* Learn more section */}
                      <div className="mb-4">
                        <button
                          onClick={() => openPreview(ebook)}
                          className="flex items-center gap-2 font-medium text-sm transition-colors hover:underline"
                          style={{ color: 'hsl(333, 65%, 59%)' }}
                        >
                          Preview
                          <ExternalLink size={14} />
                        </button>
                      </div>

                      <div className="flex-grow"></div>

                      {/* Footer section - Price and controls */}
                      <div className="mt-auto pt-4">
                        {/* Value badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-2 py-1 rounded-full text-xs font-semibold">
                            {ebook.pages}+ Pages
                          </span>
                          <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-2 py-1 rounded-full text-xs font-semibold">
                            {ebook.audioMinutes}+ Minute Voice Summary
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(ebook.price)}
                          </div>
                        </div>

                        {/* Coming Soon or Add to Cart */}
                        {ebook.comingSoon ? (
                          submittedEmails[ebook.id] ? (
                            <div className="bg-green-50 border-2 border-green-200 text-green-700 py-3 rounded-full text-center font-semibold text-sm">
                              ✓ You're on the list!
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <input
                                type="email"
                                placeholder="Your email for early access"
                                value={emailInputs[ebook.id] || ''}
                                onChange={(e) => handleEmailChange(ebook.id, e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-full text-sm focus:outline-none focus:border-pink-400 transition-colors"
                              />
                              <button
                                onClick={() => handleNotifyMe(ebook)}
                                className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                              >
                                <Mail size={18} />
                                Notify Me at Launch
                              </button>
                            </div>
                          )
                        ) : (
                          <button
                            onClick={() => handleAddToCart(ebook)}
                            className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                          >
                            <ShoppingCart size={18} />
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Floating Action Button (Mobile) */}
        <div className="md:hidden fixed bottom-20 right-4 z-30">
          <button
            onClick={() => {
              const nextCategory = activeTab === 'manipulation-toxic' 
                ? 'Dating & Red Flags' 
                : activeTab === 'dating-red-flags'
                ? 'Self Empowering'
                : 'Manipulation & Toxic Relationships';
              scrollToCategory(nextCategory);
            }}
            className="w-14 h-14 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {previewEbook && (
          <PreviewModal
            ebook={previewEbook}
            onClose={closePreview}
            onAddToCart={handleAddToCart}
          />
        )}
      </div>
    </section>
  );
};

export default EbookGrid;