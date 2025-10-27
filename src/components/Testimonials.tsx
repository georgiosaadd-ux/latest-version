// File: Testimonials.tsx

import React from "react";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  ChevronDown,
  Play,
  Volume2,
  VolumeX,
  ImageIcon,
} from "lucide-react";
// import importedReviews from "./testimonials.json"; // <-- REMOVED

// 1. --- SUPABASE CLIENT DEFINITION ---
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// ------------------------------------


/* =========================
   Types
   ========================= */
// UPDATED Review type to match our database
type Review = { 
  text: string; 
  author: string; 
  rating: number 
};

type MediaItem =
  | { url: string; type: "image" | "video"; filename: string }
  | { type: "placeholder"; label: string };

/* =========================
   Stories Rail (No Changes)
   ========================= */
const StoriesRail: React.FC = () => {
  const media = React.useMemo<MediaItem[]>(() => {
    const mods = import.meta.glob(
      "../assets/feedbacks/*.{jpg,jpeg,png,webp,mp4,webm}",
      {
        eager: true,
        query: "?url",
        import: "default",
      }
    ) as Record<string, string>;

    const items = Object.entries(mods).map(([path, url]) => {
      const lower = path.toLowerCase();
      const isVideo = lower.endsWith(".mp4") || lower.endsWith(".webm");
      const filename = path.split("/").pop() || "media";
      return { url, type: isVideo ? "video" : "image", filename } as MediaItem;
    });

    items.sort((a, b) =>
      ("filename" in a ? a.filename : "").localeCompare(
        "filename" in b ? b.filename : ""
      )
    );

    const MIN = 4;
    if (items.length < MIN) {
      const needed = MIN - items.length;
      const pads: MediaItem[] = Array.from({ length: needed }).map(() => ({
        type: "placeholder" as const,
        label: "Add media",
      }));
      return [...items, ...pads];
    }
    return items;
  }, []);

  const infiniteMedia = [...media, ...media, ...media];
  const [centerIndex, setCenterIndex] = React.useState(media.length);
  const [showLightbox, setShowLightbox] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!scrollRef.current || isInitialized) return;
    
    const container = scrollRef.current;
    const cardWidth = 216; // 200px width + 16px gap
    const containerWidth = container.offsetWidth;
    const offset = (containerWidth / 2) - (200 / 2); // Center the 200px card
    const scrollPosition = (centerIndex * cardWidth) - offset;
    
    container.scrollLeft = scrollPosition;
    setIsInitialized(true);
  }, [centerIndex, isInitialized]);

  const handleScroll = React.useCallback(() => {
    if (!scrollRef.current || !isInitialized) return;
    
    const container = scrollRef.current;
    const cardWidth = 216;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.offsetWidth;
    const offset = (containerWidth / 2) - (200 / 2);
    
    const newIndex = Math.round((scrollLeft + offset) / cardWidth);
    
    if (newIndex <= media.length / 2) {
      const jumpToIndex = media.length + newIndex;
      setCenterIndex(jumpToIndex);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = (jumpToIndex * cardWidth) - offset;
        }
      }, 50);
    } else if (newIndex >= media.length * 2.5) {
      const jumpToIndex = media.length + (newIndex % media.length);
      setCenterIndex(jumpToIndex);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = (jumpToIndex * cardWidth) - offset;
        }
      }, 50);
    } else {
      setCenterIndex(newIndex);
    }
  }, [media.length, isInitialized]);

  const prev = () => {
    if (!scrollRef.current) return;
    const cardWidth = 216;
    scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  };

  const next = () => {
    if (!scrollRef.current) return;
    const cardWidth = 216;
    scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
  };

  const openLightbox = (idx: number) => {
    if (isDragging) return;
    const item = infiniteMedia[idx];
    if (item.type === "placeholder") return;
    setShowLightbox(true);
    setCenterIndex(idx);
  };

  return (
    <div className="mb-10">
      {/* Rail header */}
      <div className="flex items-center justify-between max-w-6xl mx-auto px-4 mb-4">
        <div className="text-sm font-semibold text-gray-700">
          Real photos & video reviews
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition"
            aria-label="Previous story"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition"
            aria-label="Next story"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Stories rail */}
      <div className="relative max-w-6xl mx-auto overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={() => setIsDragging(false)}
          onMouseMove={(e) => {
            if (e.buttons === 1) setIsDragging(true);
          }}
          onMouseUp={() => setTimeout(() => setIsDragging(false), 100)}
          className="flex gap-4 overflow-x-scroll snap-x snap-mandatory cursor-grab active:cursor-grabbing"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingLeft: 'calc(50% - 100px)',
            paddingRight: 'calc(50% - 100px)',
          }}
        >
          <style>{`
            .overflow-x-scroll::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {infiniteMedia.map((m, idx) => {
            const distance = Math.abs(idx - centerIndex);
            const isCenter = distance === 0;
            
            const scale = isCenter ? 1 : 0.88;
            const opacity = isCenter ? 1 : 0.4;
            const blur = isCenter ? 0 : 5;
            
            return (
              <button
                key={idx}
                onClick={() => openLightbox(idx)}
                className="relative snap-center shrink-0 rounded-2xl overflow-hidden border transition-all duration-300"
                style={{
                  width: '200px',
                  height: '355px',
                  transform: `scale(${scale})`,
                  opacity: opacity,
                  filter: `blur(${blur}px)`,
                  borderColor: isCenter ? 'rgb(244 114 182 / 0.8)' : 'rgb(244 114 182 / 0.2)',
                  boxShadow: isCenter 
                    ? '0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 3px rgb(244 114 182 / 0.3)' 
                    : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                aria-label="Open story"
              >
                {m.type === "image" && "url" in m ? (
                  <img 
                    src={m.url} 
                    alt={m.filename} 
                    className="w-full h-full object-cover pointer-events-none select-none" 
                    draggable="false"
                  />
                ) : m.type === "video" && "url" in m ? (
                  <video
                    src={m.url}
                    muted
                    playsInline
                    loop
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 flex flex-col items-center justify-center">
                    <div className="h-14 w-14 rounded-2xl bg-white/70 border border-pink-200 flex items-center justify-center shadow">
                      <ImageIcon className="text-pink-500" size={24} />
                    </div>
                    <div className="mt-3 text-[11px] font-semibold text-pink-700">
                      Add media
                    </div>
                    <div className="text-[10px] text-pink-600/80">
                      /src/assets/feedbacks
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent pointer-events-none" />
                {m.type !== "placeholder" && (
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="text-[10px] font-semibold text-white/95 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-[1px]">
                      {m.type === "video" ? "Video review" : "Photo review"}
                    </div>
                    {"url" in m && m.type === "video" && (
                      <Play size={16} className="text-white/90" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lightbox (No Changes) */}
      {showLightbox && (() => {
        const item = infiniteMedia[centerIndex];
        if (item.type === "placeholder") return null;
        return (
          <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <button
              onClick={prev}
              className="absolute left-3 md:left-5 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 md:right-5 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
            <div className="w-full max-w-[420px] sm:max-w-[480px] md:max-w-[560px] lg:max-w-[680px] aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl relative">
              {item.type === "video" ? (
                <>
                  <button
                    onClick={() => setMuted(m => !m)}
                    className="absolute top-3 left-3 z-10 text-white/90 bg-black/40 hover:bg-black/60 rounded-full p-2"
                    aria-label={muted ? "Unmute" : "Mute"}
                  >
                    {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <video
                    key={item.url}
                    src={item.url}
                    controls
                    autoPlay
                    playsInline
                    muted={muted}
                    className="w-full h-full object-contain bg-black"
                  />
                </>
              ) : (
                <img
                  src={item.url}
                  alt={item.filename}
                  className="w-full h-full object-contain bg-black"
                />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

/* ========================================================
   Main Testimonials section (MODIFIED)
   ======================================================== */
const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // --- NEW: State for loading reviews from DB ---
  const [allReviews, setAllReviews] = React.useState<Review[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // --- NEW: useEffect to fetch reviews ---
  React.useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase.functions.invoke('get-approved-reviews');
        
        if (error) {
          // Handle non-2xx responses
          if (error.context && error.context.message) {
            throw new Error(error.context.message); 
          }
          throw new Error(error.message);
        }

        setAllReviews(data as Review[]);
      } catch (err: any) {
        console.error("Failed to fetch reviews:", err);
        setError("Could not load reviews at this time.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []); // Runs once on component mount

  // --- MODIFIED: Use the first 9 reviews for the carousel ---
  const carouselReviews = allReviews.slice(0, 9);

  // --- MODIFIED: Use dynamic carousel length ---
  React.useEffect(() => {
    if (isPaused || carouselReviews.length === 0) return;
    const id = setInterval(() => setCurrentIndex((p) => (p + 1) % carouselReviews.length), 2500);
    return () => clearInterval(id);
  }, [isPaused, carouselReviews.length]);

  const next = () => {
    if (carouselReviews.length === 0) return;
    setIsPaused(true);
    setCurrentIndex((p) => (p + 1) % carouselReviews.length);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const prev = () => {
    if (carouselReviews.length === 0) return;
    setIsPaused(true);
    setCurrentIndex((p) => (p - 1 + carouselReviews.length) % carouselReviews.length);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const scrollToReviews = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("reviews-grid");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener?.("change", set);
    return () => mq.removeEventListener?.("change", set);
  }, []);

  // --- NEW: Calculate average rating ---
  const averageRating = React.useMemo(() => {
    if (allReviews.length === 0) return 4.9; // Default fallback
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / allReviews.length).toFixed(1);
  }, [allReviews]);

  return (
    <section className="py-16 bg-gradient-to-br from-rose-50 via-pink-50 to-cream overflow-hidden scroll-smooth">
      <div className="container mx-auto px-4 text-center">
        {/* --- MODIFIED: HEADER --- */}
        <div className="mb-10">
          <div className="flex justify-center mb-3">
            {/* Show stars based on average */}
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={40} 
                className={i < Math.floor(Number(averageRating)) ? "text-[hsl(333,65%,59%)] fill-[hsl(333,65%,59%)]" : "text-gray-300"}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap mb-1">
            <h3 className="text-5xl font-extrabold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
              {averageRating}/5
            </h3>
            <a
              href="#reviews-grid"
              onClick={scrollToReviews}
              className="inline-flex items-center gap-1 text-[hsl(333,65%,59%)] text-sm font-semibold hover:text-[hsl(333,65%,50%)] transition animate-bounce"
            >
              See reviews
              <ChevronDown size={18} className="animate-pulse" />
            </a>
          </div>

          {/* --- MODIFIED: Show dynamic review count --- */}
          <p className="text-gray-600 font-semibold">
            {isLoading ? "Loading verified reviews..." : `Based on ${allReviews.length} verified reviews`}
          </p>
        </div>

        <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
          Same games, Same lies, Same confusion.
          <br /> You're not the only one
        </h2>
        <p className="text-gray-600 mb-5">What helped them see the truth can help you too.</p>

        <StoriesRail />

        <div id="reviews-grid" className="scroll-mt-24" />

        {/* --- MODIFIED: Written testimonials carousel --- */}
        <div className="relative max-w-6xl mx-auto mt-2">
          {carouselReviews.length > 0 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 transition"
              >
                <ChevronLeft size={24} className="text-[hsl(333,65%,59%)]" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 transition"
              >
                <ChevronRight size={24} className="text-[hsl(333,65%,59%)]" />
              </button>
            </>
          )}

          <div className="overflow-hidden px-6">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: isMobile
                  ? `translateX(-${currentIndex * 100}%)`
                  : `translateX(-${currentIndex * (100 / (isMobile ? 1 : 3))}%)`,
              }}
            >
              {isLoading && (
                <div className="text-gray-600 w-full text-center p-10">Loading reviews...</div>
              )}
              {error && (
                <div className="text-red-600 w-full text-center p-10">{error}</div>
              )}
              {!isLoading && !error && carouselReviews.map((t, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-[hsl(333,65%,95%)] to-[hsl(335,77%,95%)] rounded-2xl p-6 m-3 shadow-md border border-pink-100 flex-shrink-0"
                  style={{ width: isMobile ? "100%" : "33.333%" }}
                >
                  {/* --- MODIFIED: Dynamic Stars --- */}
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={16} className={j < t.rating ? "text-yellow-400 fill-current" : "text-gray-300 fill-current"} />
                    ))}
                  </div>
                  <blockquote className="text-gray-800 mb-4 text-base leading-relaxed font-medium">
                    "{t.text}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-700">
                      {t.author.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                        {t.author}
                        <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} /> Verified
                        </span>
                      </div>
                      {/* --- REMOVED Location --- */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- MODIFIED: All reviews modal trigger --- */}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isLoading || allReviews.length === 0}
          className="mt-10 px-6 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          See all reviews ({allReviews.length})
        </button>
      </div>

      {/* --- MODIFIED: All reviews Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl max-h-[85vh] rounded-3xl overflow-y-auto shadow-2xl relative border border-pink-200">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-xl font-bold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                All Verified Reviews ({allReviews.length})
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allReviews.map((r, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-pink-100 bg-gradient-to-br from-rose-50 to-pink-50 p-4 shadow"
                >
                  {/* --- MODIFIED: Dynamic Stars --- */}
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14} className={j < r.rating ? "text-yellow-400 fill-current" : "text-gray-300 fill-current"} />
                    ))}
                  </div>
                  <blockquote className="text-gray-800 text-sm mb-2">"{r.text}"</blockquote>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-700 text-xs">
                      {r.author.charAt(0)}
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-800">{r.author}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} /> Verified
                        </span>
                      </div>
                      {/* --- REMOVED Location --- */}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center py-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 rounded-full text-white font-semibold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] shadow hover:shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Testimonials;