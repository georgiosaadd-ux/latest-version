import React, { useEffect, useRef } from 'react';
import { X, FileText, ShoppingCart } from 'lucide-react';
import { EBook } from '../types';
import { formatCurrency } from '../utils/currency';

interface PreviewModalProps {
  ebook: EBook;
  onClose: () => void;
  onAddToCart?: (ebook: EBook) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ ebook, onClose, onAddToCart }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  // Store the element that triggered the modal for focus return
  triggerRef.current = document.activeElement as HTMLElement;

  // Store current scroll position
  const scrollY = window.scrollY;
  
  // Simpler approach: just prevent scrolling without position fixed
  const originalOverflow = document.body.style.overflow;
  const originalPaddingRight = document.body.style.paddingRight;
  
  // Get scrollbar width to prevent layout shift
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  
  // Lock scroll
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollbarWidth}px`;
  
  // Hide bottom nav on mobile
  const bottomNav = document.querySelector('[class*="bottom-0"]');
  if (bottomNav) {
    (bottomNav as HTMLElement).style.display = 'none';
  }

  // Focus on modal (with preventScroll)
  setTimeout(() => {
    if (modalRef.current) {
      modalRef.current.focus({ preventScroll: true });
    }
  }, 10);

  return () => {
    // Restore overflow
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;

    // Show bottom nav
    const bottomNav = document.querySelector('[class*="bottom-0"]');
    if (bottomNav) {
      (bottomNav as HTMLElement).style.display = '';
    }

    // Return focus (with preventScroll)
    if (triggerRef.current) {
      triggerRef.current.focus({ preventScroll: true });
    }
    
    // Ensure scroll position is maintained
    window.scrollTo(0, scrollY);
  };
}, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleBackButton = () => {
      onClose();
    };

    document.addEventListener('keydown', handleEscape);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(ebook);
    }
    onClose();
  };

  const getPreviewContent = (ebookId: string) => {
    const previews: Record<string, any> = {
      'trapped-in-his-game': {
        chapterTitle: 'Recognizing the Signs',
        intro: [
          "You know that sinking feeling when he promises change, but the cycle repeats? One day he's charming, the next he makes you question if you're the problem. This isn't love — it's control dressed up as affection.",
          "The confusion you feel isn't accidental. It's designed to keep you off balance, questioning yourself instead of questioning him. When someone truly loves you, clarity follows — not chaos."
        ],
        discoveries: [
          'The 7 subtle tactics men use to make you doubt yourself',
          'How to spot gaslighting before it destroys your confidence',
          'Why "mixed signals" are actually manipulation in disguise',
          'Small steps to protect your peace starting today'
        ],
        quote: 'You are not overreacting. The confusion you feel is the proof.',
        chapters: 7
      },
      'gaslighting-unmasked': {
        chapterTitle: 'The Mind Games You Don\'t See Coming',
        intro: [
          "Ever walked away from an argument more confused than when it began? He swears you're remembering wrong, insists you're too sensitive, or laughs it off until you doubt your own reality. That's not a miscommunication — that's gaslighting.",
          "Your memory isn't failing you. Your instincts aren't wrong. When someone consistently makes you question what you know to be true, they're not protecting you — they're protecting themselves from accountability."
        ],
        discoveries: [
          'The 5 most common phrases gaslighters use to control you',
          'How to rebuild trust in your own memory and instincts',
          'Why apologies always feel hollow (and what it really means)',
          'Scripts to respond without being pulled deeper into the trap'
        ],
        quote: 'If he makes you question your reality, it\'s because he fears your truth.',
        chapters: 7
      },
      'love-bombed-left': {
        chapterTitle: 'When Too Much Love Isn\'t Love at All',
        intro: [
          "At first, he couldn't get enough of you. Texts all day. Future plans after two dates. He said you were \"the one.\" Then suddenly, silence. You feel abandoned and wonder what you did wrong. The truth? This was never about you — it was his cycle of love-bombing.",
          "Real love doesn't need to overwhelm you to prove itself. When someone showers you with excessive attention only to withdraw it later, they're not showing love — they're showing you their pattern."
        ],
        discoveries: [
          'How to spot the difference between genuine affection and manipulation',
          'Why sudden withdrawals are part of a calculated pattern',
          'The psychology of narcissists and their endless chase for supply',
          'How to detach before you get discarded again'
        ],
        quote: 'His intensity wasn\'t proof of love — it was bait.',
        chapters: 7
      },
      'why-attract-toxic': {
        chapterTitle: 'Breaking the Cycle',
        intro: [
          "You tell yourself the next one will be different — yet here you are again, same story, different man. It's not that you're broken. It's that toxic men are drawn to your light. And unless you see the pattern, you'll keep repeating their lies.",
          "Your empathy, your hope, your willingness to see the best in people — these aren't flaws. But toxic men know how to weaponize your strengths against you. Understanding this changes everything."
        ],
        discoveries: [
          'Why strong, empathetic women attract manipulators',
          'The invisible "hooks" toxic men look for in partners',
          'How to spot red flags before you get attached',
          'Practical shifts to protect your love without losing your heart'
        ],
        quote: 'It\'s not about changing who you are — it\'s about changing what you allow.',
        chapters: 8
      },
      'dating-age-manipulators': {
        chapterTitle: 'Modern Red Flags',
        intro: [
          "Ghosting. Breadcrumbing. \"Situationships.\" You're told this is just how dating works now — but it's not normal, and it's not okay. These new tactics are simply old manipulation with a modern mask.",
          "The dating landscape has changed, but respect hasn't. When someone truly wants to be with you, you'll never have to decode their behavior or wonder where you stand."
        ],
        discoveries: [
          'The 6 manipulative dating behaviors every woman should know',
          'Why "mixed signals" are intentional, not accidental',
          'How social media fuels toxic dating cycles',
          'Steps to filter out manipulators from the start'
        ],
        quote: 'If he wanted to, you\'d never be confused.',
        chapters: 6
      },
      'mr-almost': {
        chapterTitle: 'When He Keeps You Waiting',
        intro: [
          "He says you're amazing, but \"not ready.\" He keeps you close, but never commits. Months turn into years, and you realize you've been his \"almost\" while he keeps his options open.",
          "The right person doesn't make you wait for clarity. They don't keep you in limbo while they figure out if you're worth choosing. Your time is precious — don't let anyone treat it like it's disposable."
        ],
        discoveries: [
          'The psychology of men who keep you in limbo',
          'How to tell if he truly can\'t commit — or just won\'t',
          'Why hope is the most dangerous red flag of all',
          'How to finally walk away and free your future'
        ],
        quote: 'If he\'s not choosing you fully, he\'s already chosen someone else — himself.',
        chapters: 7
      },
      'love-vs-lust': {
        chapterTitle: 'Knowing the Difference',
        intro: [
          "He says all the right words. The chemistry is undeniable. But when the passion fades, does he show up for you — or disappear? Knowing the difference between real love and lust can save your heart years of confusion.",
          "Lust feels urgent, demanding, consuming. Love feels steady, patient, growing. One burns bright and fast, the other builds slowly and lasts. Learning to tell them apart protects your heart from beautiful lies."
        ],
        discoveries: [
          'The 4 core signs of genuine love vs. lustful desire',
          'Why lust often feels stronger than love in the beginning',
          'How to test if his actions match his promises',
          'The simple question that reveals his true intentions'
        ],
        quote: 'Real love feels steady, not rushed. Lust runs, love stays.',
        chapters: 5
      },
      'charmer-trap': {
        chapterTitle: 'When Attraction Turns Dangerous',
        intro: [
          "He's magnetic. Everyone loves him. He makes you laugh, feel seen, and believe you're special — until his charm turns into control. The hardest part? Charm blinds you before the harm begins.",
          "Charm without character is manipulation in disguise. When someone's public persona doesn't match their private behavior, pay attention. The mask always slips eventually."
        ],
        discoveries: [
          'The 5 charm tactics that should ring alarm bells',
          'How charm shifts into criticism once he "has" you',
          'Why women confuse charisma for kindness',
          'Practical steps to see behind the mask'
        ],
        quote: 'Charm is only dangerous when it hides the truth.',
        chapters: 6
      }
    };

    return previews[ebookId] || previews['trapped-in-his-game'];
  };

  const content = getPreviewContent(ebook.id);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom)',
        overscrollBehavior: 'contain'
      }}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-4xl mx-4 md:mx-auto shadow-2xl flex flex-col"
        style={{ 
          maxHeight: '90vh',
          height: '90vh',
          marginBottom: 'env(safe-area-inset-bottom)'
        }}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white rounded-t-2xl md:rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-purple-600" />
            <div>
              <h3 
                id="modal-title"
                className="text-lg md:text-xl font-bold text-gray-800"
              >
                Preview Chapter
              </h3>
              <p className="text-sm md:text-base text-gray-600">{ebook.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close preview modal"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin'
          }}
        >
          <div className="prose max-w-none">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
              Chapter 1: {content.chapterTitle}
            </h1>
            
            {content.intro.map((paragraph: string, index: number) => (
              <p key={index} className="text-base md:text-lg text-gray-700 mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
            
            <h2 className="text-lg md:text-xl font-semibold mt-6 mb-3 text-gray-800">What You'll Discover in Chapter 1:</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
              {content.discoveries.map((discovery: string, index: number) => (
                <li key={index} className="text-sm md:text-base">{discovery}</li>
              ))}
            </ul>
            
            <div className="bg-gradient-to-r from-[hsl(333,65%,95%)] to-[hsl(297,22%,95%)] border-l-4 border-[hsl(333,65%,59%)] p-4 rounded-r-lg mb-6">
              <p className="text-gray-700 italic font-medium text-sm md:text-base">
                "Remember: {content.quote}"
              </p>
            </div>
            
            <p className="text-center text-sm md:text-base italic mb-6 bg-gradient-to-r from-[hsl(297,22%,24%)] to-[hsl(333,65%,59%)] bg-clip-text text-transparent leading-relaxed">
              This is just a preview — it's not the full chapter. The complete eBook contains {content.chapters} chapters and {ebook.pages}+ pages of guidance, plus a {ebook.audioMinutes}+ minute voice summary.
            </p>

            {/* Extra content for testing scroll */}
            <div className="space-y-4 text-gray-600 text-sm md:text-base">
              <p>The complete eBook goes much deeper into these concepts, providing:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Real-world examples and case studies</li>
                <li>Step-by-step action plans</li>
                <li>Scripts for difficult conversations</li>
                <li>Self-reflection exercises</li>
                <li>Warning signs checklists</li>
                <li>Recovery and healing strategies</li>
              </ul>
              <p>Plus, you'll get the exclusive voice summary that you can listen to while commuting, exercising, or whenever you need a quick refresher on the key insights.</p>
            </div>
          </div>
        </div>
        
        {/* Sticky Footer */}
        <div 
          className="border-t border-gray-200 bg-white p-4 md:p-6 flex-shrink-0 rounded-b-2xl md:rounded-b-2xl"
          style={{ 
            paddingBottom: `calc(1rem + env(safe-area-inset-bottom))`,
            marginBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                Complete eBook: {content.chapters} chapters • {ebook.pages}+ pages • {ebook.audioMinutes}+ min voice summary
              </p>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1" aria-label={`Price: ${formatCurrency(ebook.price)}`}>
                {formatCurrency(ebook.price)}
              </div>
              <p className="text-xs md:text-sm text-gray-600">Instant download • Secure checkout</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors text-sm order-2 sm:order-1"
              >
                Close
              </button>
              {onAddToCart ? (
                <button
                  onClick={handleAddToCart}
                  className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-6 md:px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 order-1 sm:order-2 min-w-[200px]"
                  aria-label={`Add ${ebook.title} to cart for ${formatCurrency(ebook.price)}`}
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-6 md:px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all order-1 sm:order-2"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;