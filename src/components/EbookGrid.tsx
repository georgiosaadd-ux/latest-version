// File: EbookGrid.tsx

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import {
  ShoppingCart,
  BookOpen,
  Volume2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Mail,
  Star,
  X,
  ShieldCheck,
  LockKeyhole,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  User2,
} from "lucide-react";
import { EBook, CartItem } from "../types";
import { activeCategories } from "../data/products";
import PreviewModal from "./PreviewModal";
import { formatCurrency } from "../utils/currency";

// 1. --- SUPABASE CLIENT DEFINITION ---
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// ------------------------------------

/* ---------- Star rating (display) ---------- */
const StarRating: React.FC<{ rating: number; reviewCount?: number }> = ({
  rating,
  reviewCount,
}) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={16}
          className={
            i < Math.floor(rating)
              ? "text-[hsl(333,65%,59%)] fill-[hsl(333,65%,59%)]"
              : "text-gray-300"
          }
        />
      ))}
    </div>
    <span className="text-sm font-semibold text-gray-700">
      {rating.toFixed(1)}
    </span>
    {typeof reviewCount === "number" && (
      <span className="text-xs text-gray-500">({reviewCount})</span>
    )}
  </div>
);

/* ---------- Success Overlay (sticky until user closes) ---------- */
function ReviewSuccessOverlay({
  open,
  name,
  onClose,
}: {
  open: boolean;
  name: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-emerald-500 to-emerald-400">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_35%),radial-gradient(circle_at_70%_60%,white,transparent_35%)]" />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-lg animate-pulse">
              <CheckCircle2 className="text-emerald-600" size={44} />
            </div>
          </div>
        </div>
        <div className="pt-14 px-6 pb-6 text-center">
          <h3 className="text-xl font-extrabold tracking-tight text-gray-900">
            Thanks, {name || "friend"}! 🎉
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Your review is locked in. Real voices make this library smarter and
            kinder.
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-2xl bg-emerald-500 text-white font-semibold py-3 hover:bg-emerald-600 transition shadow"
          >
            Close
          </button>
        </div>
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/70 hover:bg-white"
        >
          <X size={16} className="text-gray-700" />
        </button>
      </div>
    </div>
  );
}

/* ======================================================
  REVIEW MODAL COMPONENT (no changes from before)
  ======================================================
*/
function ReviewModal({
  open,
  ebookTitle,
  ebookId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  ebookTitle: string;
  ebookId: string;
  onClose: () => void;
  onSuccess?: (payload: {
    stars: number;
    name: string;
    email: string;
    text: string;
  }) => void;
}) {
  const [stars, setStars] = useState(5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    if (open) {
      setStars(5);
      setName("");
      setEmail("");
      setText("");
      setSubmitting(false);
      setStatus("idle");
      setMsg("");
    }
  }, [open]);

  const validateEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleSubmit = async () => {
    setMsg("");
    if (!name.trim()) {
      setStatus("err");
      setMsg("Please enter the name you want to display with your review.");
      return;
    }
    if (!validateEmail(email)) {
      setStatus("err");
      setMsg("Please enter a valid email.");
      return;
    }
    if (text.trim().length < 10) {
      setStatus("err");
      setMsg("Please write at least 10 characters to help other readers.");
      return;
    }
    setSubmitting(true);
    const emailTrimmed = email.trim().toLowerCase();
    const nameTrimmed = name.trim();
    const textTrimmed = text.trim();
    try {
      const { data: verifyData, error: verifyError } =
        await supabase.functions.invoke("verify-customer", {
          body: { email: emailTrimmed },
        });
      if (verifyError)
        throw new Error(`Verification failed: ${verifyError.message}`);
      if (verifyData && verifyData.message)
        throw new Error(verifyData.message);
      if (!verifyData || !verifyData.exists) {
        setStatus("err");
        setMsg(
          "Reviews are for verified buyers. We couldn't find a purchase with this email."
        );
        setSubmitting(false);
        return;
      }
      const { data: saveData, error: saveError } =
        await supabase.functions.invoke("save-review", {
          body: {
            email: emailTrimmed,
            product_id: ebookId,
            rating: stars,
            review_text: textTrimmed,
            display_name: nameTrimmed,
          },
        });
      if (saveError) throw new Error(`Save failed: ${saveError.message}`);
      if (!saveData || saveData.message !== "Review saved")
        throw new Error(saveData.message || "Failed to save review.");
      setStatus("ok");
      setMsg("Your review was submitted successfully.");
      onSuccess?.({
        stars,
        name: nameTrimmed,
        email: emailTrimmed,
        text: textTrimmed,
      });
    } catch (err: any) {
      console.error("Review submission error:", err);
      setStatus("err");
      if (
        err.message.includes("verified buyers") ||
        err.message.includes("Missing fields")
      ) {
        setMsg(err.message);
      } else {
        setMsg("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="relative">
          <div className="h-24 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)]" />
          <div className="absolute inset-0 flex items-center gap-3 px-6">
            <div className="relative">
              <span className="absolute -inset-2 rounded-full blur-xl opacity-70 bg-white/20" />
              <ShieldCheck className="relative text-white" size={28} />
            </div>
            <div className="text-white">
              <h3 className="text-lg font-extrabold tracking-tight">
                Verified Reviews Only
              </h3>
              <p className="text-sm opacity-90">Real readers, real experiences</p>
            </div>
          </div>
          <button
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/20 active:scale-95 transition"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} className="text-white drop-shadow" />
          </button>
        </div>
        {/* Body */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="text-[hsl(333,65%,59%)] mt-0.5" size={18} />
            <div>
              <div className="text-base font-bold">{`Review: ${ebookTitle}`}</div>
              <div className="text-xs text-gray-500">
                Your review helps others decide with confidence
              </div>
            </div>
          </div>
          {/* Stars */}
          <div className="flex items-center gap-2 my-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={() => setStars(i)}
                className="p-1 rounded-lg hover:bg-gray-100 active:scale-95 transition"
                aria-label={`Rate ${i}`}
              >
                <Star
                  size={26}
                  className={
                    i <= stars
                      ? "text-[hsl(333,65%,59%)] fill-[hsl(333,65%,59%)] drop-shadow-sm"
                      : "text-gray-300"
                  }
                />
              </button>
            ))}
            <span className="ml-1 text-sm text-gray-600">{stars} stars</span>
          </div>
          {/* Display name */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display name
          </label>
          <div className="relative mb-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Layla M."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400"
            />
            <User2
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
          {/* Email */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email used for purchase
          </label>
          <div className="relative mb-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400"
            />
            <LockKeyhole
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
          {/* Review text */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your review
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What did you love, learn, or wish was different?"
            className="w-full border-2 border-gray-200 rounded-2xl p-3 text-sm focus:outline-none focus:border-pink-400"
            rows={5}
          />
          {/* Status */}
          {status === "ok" && (
            <div className="mt-3 flex items-center gap-2 text-emerald-600 text-sm font-semibold">
              <CheckCircle2 size={18} />
              <span>{msg}</span>
            </div>
          )}
          {status === "err" && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm font-semibold">
              <AlertTriangle size={18} />
              <span>{msg}</span>
            </div>
          )}
          {/* Actions */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-2xl font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
  REUSABLE CARD COMPONENT (NOW WITH LOADING/ERROR STATES)
  ======================================================
*/
const CARD_FIXED_H = "h-[600px]";

interface EbookGridProps {
  ebooks: EBook[];
  onAddToCart: (item: CartItem) => void;
  selectedCategory?: string;
}

const Card: React.FC<{
  ebook: EBook;
  isSelected?: boolean;
  onPreview: (e: EBook) => void;
  onAddToCart: (e: EBook) => void;
  onWriteReview: (e: EBook) => void;
  emailInputs?: Record<string, string>;
  setEmailInputs?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  submittedEmails?: Record<string, boolean>;
  onNotify?: (e: EBook) => void;
  // --- NEW PROPS FOR WAITLIST ---
  isSubmitting?: boolean;
  errorMessage?: string;
}> = ({
  ebook,
  isSelected,
  onPreview,
  onAddToCart,
  onWriteReview,
  emailInputs = {},
  setEmailInputs,
  submittedEmails = {},
  onNotify,
  // --- NEW PROPS FOR WAITLIST ---
  isSubmitting,
  errorMessage,
}) => {
  return (
    <div
      className={[
        "bg-white rounded-2xl shadow-lg transition-all duration-300 overflow-hidden flex flex-col relative",
        CARD_FIXED_H,
        isSelected ? "translate-y-1 shadow-xl" : "hover:-translate-y-1",
      ].join(" ")}
    >
      {/* Cover (no changes) */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={ebook.cover}
          alt={ebook.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {ebook.badges?.length ? (
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
        ) : null}
      </div>

      <div className="p-6 flex flex-col flex-1">
        {/* Header/Info (no changes) */}
        <h4 className="font-heading text-xl font-bold mb-2">
          <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
            {ebook.title}
          </span>
        </h4>
        {typeof ebook.rating === "number" && (
          <StarRating rating={ebook.rating} reviewCount={ebook.reviewCount} />
        )}
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          {ebook.description}
        </p>
        <div className="mb-3">
          <button
            onClick={() => onPreview(ebook)}
            className="flex items-center gap-2 font-medium text-sm transition-colors hover:underline"
            style={{ color: "hsl(333, 65%, 59%)" }}
          >
            Preview <ExternalLink size={14} />
          </button>
        </div>
        {!ebook.comingSoon && (
          <div className="mb-3">
            <button
              onClick={() => onWriteReview(ebook)}
              className="
         group w-full flex items-center rounded-2xl px-4 py-3
         border-2 border-pink-200 bg-pink-50 hover:bg-pink-100 transition
         md:justify-between
       "
            >
              <span
                className="
         flex items-center gap-1.5 
         text-[hsl(333,65%,35%)] font-semibold 
         text-xs md:text-sm
       "
              >
                <Star
                  size={14}
                  className="text-[hsl(333,65%,59%)] fill-[hsl(333,65%,59%)] md:h-4 md:w-4"
                />
                Write a review
              </span>
              <span
                className="
         ml-auto md:ml-0 flex items-center gap-1
         uppercase tracking-wide
         text-[8px] md:text-[10px] text-[hsl(333,65%,45%)]
       "
              >
                <ShieldCheck size={12} className="md:h-3.5 md:w-3.5" />
                Verified only
              </span>
            </button>
          </div>
        )}
        {/* Price/Chips (no changes) */}
        <div className="mt-auto pt-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1">
              <BookOpen size={12} /> {ebook.pages}+ Pages
            </span>
            <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1">
              <Volume2 size={12} /> {ebook.audioMinutes}+ Min Voice
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(ebook.price)}
          </div>
        </div>

        {/* --- MODIFIED CTA SECTION --- */}
        <div className="mt-4">
          {ebook.comingSoon ? (
            submittedEmails?.[ebook.id] ? (
              <div className="bg-green-50 border-2 border-green-200 text-green-700 py-3 rounded-full text-center font-semibold text-sm">
                ✓ You're on the list!
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email for early access"
                  value={emailInputs?.[ebook.id] || ""}
                  onChange={(e) =>
                    setEmailInputs?.((prev) => ({
                      ...prev,
                      [ebook.id]: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-full text-sm focus:outline-none focus:border-pink-400 transition-colors"
                />
                <button
                  onClick={() => onNotify?.(ebook)}
                  disabled={isSubmitting} // <-- Add disabled state
                  className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60" // <-- Add disabled style
                >
                  <Mail size={18} />
                  {isSubmitting ? "Adding..." : "Notify Me at Launch"} {/* <-- Change text */}
                </button>
                {/* --- ADD ERROR MESSAGE --- */}
                {errorMessage && (
                  <p className="text-xs text-red-600 text-center -mt-2 pt-0">
                    {errorMessage}
                  </p>
                )}
              </div>
            )
          ) : (
            <button
              onClick={() => onAddToCart(ebook)}
              className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Mobile Carousel (no changes) ---------- */
const MobileCarousel: React.FC<{
  ebooks: EBook[];
  renderCard: (ebook: EBook, isSelected: boolean) => React.ReactNode;
}> = ({ ebooks, renderCard }) => {
  const [index, setIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  useEffect(() => {
    setIndex((i) => Math.max(0, Math.min(i, ebooks.length - 1)));
  }, [ebooks.length]);
  const scrollTo = (i: number) => {
    const el = cardRefs.current[i];
    if (!el) return;
    el.scrollIntoView({
      behavior: "smooth",
      inline: i === ebooks.length - 1 ? "end" : ("center" as ScrollLogicalPosition),
      block: "nearest",
    });
    setIndex(i);
  };
  return (
    <div className="md:hidden relative">
      <div
        ref={viewportRef}
        className="overflow-x-auto snap-x snap-mandatory px-6 scroll-smooth scrollbar-none"
        onScroll={() => {
          const viewport = viewportRef.current;
          if (!viewport) return;
          const center = viewport.scrollLeft + viewport.clientWidth / 2;
          let closest = 0;
          let dist = Infinity;
          cardRefs.current.forEach((card, idx) => {
            if (!card) return;
            const rect = card.getBoundingClientRect();
            const vpRect = viewport.getBoundingClientRect();
            const cardCenter =
              rect.left - vpRect.left + rect.width / 2 + viewport.scrollLeft;
            const d = Math.abs(cardCenter - center);
            if (d < dist) {
              dist = d;
              closest = idx;
            }
          });
          setIndex(closest);
        }}
      >
        <div className="flex items-stretch gap-4 py-1">
          {ebooks.map((ebook, idx) => (
            <div
              key={ebook.id}
              ref={(el) => {
                if (el) cardRefs.current[idx] = el;
              }}
              className={[
                "snap-center",
                idx === ebooks.length - 1 ? "snap-end pr-2" : "",
                "shrink-0 w-[86%]",
              ].join(" ")}
            >
              {renderCard(ebook, idx === index)}
            </div>
          ))}
        </div>
      </div>
      {ebooks.length > 1 && (
        <>
          <button
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              scrollTo(Math.max(0, index - 1));
            }}
            disabled={index === 0}
            className={`absolute left-1 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 shadow-md border border-gray-200 active:scale-95 ${
              index === 0 ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              scrollTo(Math.min(ebooks.length - 1, index + 1));
            }}
            disabled={index === ebooks.length - 1}
            className={`absolute right-1 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 shadow-md border border-gray-200 active:scale-95 ${
              index === ebooks.length - 1 ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
      {ebooks.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {ebooks.map((_, idx) => (
            <span
              key={idx}
              className={`h-2 w-2 rounded-full ${
                idx === index ? "bg-[hsl(333,65%,59%)]" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================
   Main EbookGrid component
   ========================= */
const EbookGrid: React.FC<EbookGridProps> = ({ ebooks, onAddToCart }) => {
  const [previewEbook, setPreviewEbook] = useState<EBook | null>(null);

  // Global review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingEbook, setReviewingEbook] = useState<EBook | null>(null);

  // Success overlay state
  const [successOpen, setSuccessOpen] = useState(false);
  const [successName, setSuccessName] = useState("");

  // Sticky tabs etc
  const [activeTab, setActiveTab] = useState<string>("manipulation-toxic");
  const [showStickyTabs, setShowStickyTabs] = useState(false);
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const [submittedEmails, setSubmittedEmails] = useState<
    Record<string, boolean>
  >({});

  // --- NEW STATE FOR WAITLIST ---
  const [submittingWaitlist, setSubmittingWaitlist] = useState<
    Record<string, boolean>
  >({});
  const [waitlistError, setWaitlistError] = useState<Record<string, string>>(
    {}
  );
  // Simple email validation
  const validateEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  // ------------------------------

  const handleAddToCart = (ebook: EBook) => onAddToCart(ebook);
  const openPreview = (ebook: EBook) => setPreviewEbook(ebook);
  const closePreview = () => setPreviewEbook(null);

  const openReviewModal = (ebook: EBook) => {
    setReviewingEbook(ebook);
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setReviewingEbook(null);
  };

  const handleReviewSuccess = (payload: {
    stars: number;
    name: string;
    email: string;
    text: string;
  }) => {
    setSuccessName(payload.name);
    setSuccessOpen(true);
    closeReviewModal();
  };

  /* =================================
   * MODIFIED HANDLE NOTIFY ME FUNCTION
   * ================================= */
  const handleNotifyMe = async (ebook: EBook) => {
    const email = emailInputs[ebook.id];

    // 1. Frontend validation
    if (!email || !validateEmail(email)) {
      setWaitlistError((prev) => ({
        ...prev,
        [ebook.id]: "Please enter a valid email.",
      }));
      return;
    }

    // 2. Reset error, set loading state
    setWaitlistError((prev) => ({ ...prev, [ebook.id]: "" }));
    setSubmittingWaitlist((prev) => ({ ...prev, [ebook.id]: true }));

    try {
      // 3. Call the new edge function
      const { data, error } = await supabase.functions.invoke(
        "add-to-waitlist",
        {
          body: {
            email: email.trim().toLowerCase(),
            ebook_id: ebook.id,
          },
        }
      );

      if (error) {
        // Network or function-level error (e.g., 500)
        throw new Error(error.message);
      }

      // 4. Handle success or "already on list"
      if (data.message.includes("Success")) {
        // This is a new, successful signup
        setSubmittedEmails((prev) => ({ ...prev, [ebook.id]: true }));
      } else if (data.message.includes("already on the waitlist")) {
        // Also a "success" - they are on the list
        setSubmittedEmails((prev) => ({ ...prev, [ebook.id]: true }));
      } else {
        // Any other message from the function is an error
        throw new Error(data.message || "An unknown error occurred.");
      }
    } catch (err: any) {
      // 5. Handle errors
      setWaitlistError((prev) => ({
        ...prev,
        [ebook.id]: err.message || "An unexpected error occurred.",
      }));
    } finally {
      // 6. Stop loading
      setSubmittingWaitlist((prev) => ({ ...prev, [ebook.id]: false }));
    }
  };
  /* =================================
   * END OF MODIFIED FUNCTION
   * ================================= */

  const getEbooksByCategory = (category: string) =>
    ebooks.filter((ebook) => ebook.category === category);

  const getCategoryAnchor = (category: string) =>
    category === "Manipulation & Toxic Relationships"
      ? "manipulation-toxic"
      : category === "Dating & Red Flags"
      ? "dating-red-flags"
      : "self-empowering";

  const getCategoryColors = (category: string) => ({
    from: "from-[hsl(333,65%,59%)]",
    to: "to-[hsl(335,77%,80%)]",
  });

  const scrollToCategory = (category: string) => {
    const element = document.getElementById(getCategoryAnchor(category));
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector("section");
      const heroBottom = heroSection
        ? (heroSection as HTMLElement).offsetTop +
          (heroSection as HTMLElement).offsetHeight
        : 0;
      setShowStickyTabs(window.scrollY > heroBottom + 200);

      const manipulationSection = document.getElementById("manipulation-toxic");
      const datingSection = document.getElementById("dating-red-flags");
      const selfSection = document.getElementById("self-empowering");
      if (manipulationSection && datingSection && selfSection) {
        const manipulationTop = manipulationSection.offsetTop - 150;
        const datingTop = datingSection.offsetTop - 150;
        const selfTop = selfSection.offsetTop - 150;
        if (window.scrollY >= selfTop) setActiveTab("self-empowering");
        else if (window.scrollY >= datingTop) setActiveTab("dating-red-flags");
        else if (window.scrollY >= manipulationTop)
          setActiveTab("manipulation-toxic");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* =================================
   * MODIFIED RENDER CARD FUNCTION
   * ================================= */
  const renderCard = (ebook: EBook, isSelected: boolean) => (
    <Card
      ebook={ebook}
      isSelected={isSelected}
      onPreview={openPreview}
      onAddToCart={handleAddToCart}
      onWriteReview={openReviewModal}
      emailInputs={emailInputs}
      setEmailInputs={setEmailInputs}
      submittedEmails={submittedEmails}
      onNotify={handleNotifyMe}
      // --- Pass new props down ---
      isSubmitting={submittingWaitlist[ebook.id]}
      errorMessage={waitlistError[ebook.id]}
    />
  );
  /* =================================
   * END OF MODIFIED FUNCTION
   * ================================= */

  return (
    <section
      id="ebooks"
      className="py-16 bg-gradient-to-br from-gray-50 to-pink-50"
    >
      <div className="container mx-auto px-4">
        {/* Audio Hook Section (no changes) */}
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
            Your day is busy, but your growth doesn't have to wait! Hear the key
            lessons anytime, anywhere.
          </p>
        </div>

        {/* Sticky Segmented Tabs (Mobile) (no changes) */}
        <div
          className={`md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-all duration-300 ${
            showStickyTabs ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() =>
                  scrollToCategory("Manipulation & Toxic Relationships")
                }
                className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === "manipulation-toxic"
                    ? "bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Manipulation
              </button>
              <button
                onClick={() => scrollToCategory("Dating & Red Flags")}
                className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === "dating-red-flags"
                    ? "bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Self
              </button>
            </div>
          </div>
        </div>

        {/* Categories (no changes) */}
        {activeCategories.map((category) => {
          const categoryEbooks = getEbooksByCategory(category);
          const colors = getCategoryColors(category);
          const anchor = getCategoryAnchor(category);

          return (
            <div key={category} className="mb-16">
              <div
                id={anchor}
                className={`bg-gradient-to-r ${colors.from} ${colors.to} rounded-2xl p-8 mb-8 text-white relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10">
                  <h3 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold mb-2">
                    {category}
                  </h3>
                  <p className="text-xl md:text-2xl opacity-90 mb-2">
                    {category === "Manipulation & Toxic Relationships"
                      ? "Recognize the patterns, protect your peace"
                      : category === "Dating & Red Flags"
                      ? "Navigate modern dating with confidence"
                      : "Build unshakeable confidence and self-worth"}
                  </p>
                </div>
              </div>

              {(category === "Manipulation & Toxic Relationships" ||
                category === "Self Empowering") && (
                <MobileCarousel ebooks={categoryEbooks} renderCard={renderCard} />
              )}

              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
                {categoryEbooks.map((ebook) => (
                  <div key={ebook.id}>{renderCard(ebook, false)}</div>
                ))}
              </div>
            </div>
          );
        })}

        {previewEbook && (
          <PreviewModal
            ebook={previewEbook}
            onClose={closePreview}
            onAddToCart={handleAddToCart}
          />
        )}
      </div>

      {/* Modals (no changes) */}
      <ReviewModal
        open={reviewModalOpen}
        ebookTitle={reviewingEbook?.title ?? ""}
        ebookId={reviewingEbook?.id ?? ""}
        onClose={closeReviewModal}
        onSuccess={handleReviewSuccess}
      />
      <ReviewSuccessOverlay
        open={successOpen}
        name={successName}
        onClose={() => setSuccessOpen(false)}
      />
    </section>
  );
};

export default EbookGrid;