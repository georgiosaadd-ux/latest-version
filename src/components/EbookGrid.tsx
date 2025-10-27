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
// --- Ensure correct import paths ---
import { EBook, CartItem } from "../types"; // Make sure '../types' is correct
import { activeCategories } from "../data/products"; // Make sure '../data/products' is correct
import PreviewModal from "./PreviewModal"; // Make sure './PreviewModal' is correct
import { formatCurrency } from "../utils/currency"; // Make sure '../utils/currency' is correct
// ------------------------------------

// 1. --- SUPABASE CLIENT DEFINITION ---
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Basic check to ensure env variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing.");
  // Optional: throw an error or handle appropriately
  // throw new Error("Supabase environment variables are not configured.");
}
// Create client only if variables exist
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
// --- If Supabase client failed to initialize, add a check before using it ---
if (!supabase) {
    console.error("Supabase client could not be initialized. Check environment variables.");
}
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
  REVIEW MODAL COMPONENT (WITH IMPROVED ERROR HANDLING)
  ======================================================
*/
function ReviewModal({
  open,
  ebookTitle,
  ebookId, // Passed from EbookGrid
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
    // Reset form when modal opens
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

  const validateEmail = (e: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// --- **REPLACED** HANDLE SUBMIT FUNCTION ---
  const handleSubmit = async () => {
     if (!supabase) { setMsg("Server connection error."); setStatus("err"); return; }

    setMsg("");
    // 1. Frontend Validation (Keep as is)
    if (!name.trim()) { setStatus("err"); setMsg("Please enter display name."); return; }
    if (!validateEmail(email)) { setStatus("err"); setMsg("Please enter a valid email."); return; }
    if (text.trim().length < 10) { setStatus("err"); setMsg("Please write at least 10 characters."); return; }

    setSubmitting(true);
    const emailTrimmed = email.trim().toLowerCase();
    const nameTrimmed = name.trim();
    const textTrimmed = text.trim();

    try {
      // 2. Verify Purchase
      console.log(`Verifying purchase: ${emailTrimmed}, ${ebookId}`);
      const { data: verifyData, error: verifyError } =
        await supabase.functions.invoke("verify-customer", {
          body: { email: emailTrimmed, product_id: ebookId },
        });

      // **Handle verify-customer function errors**
      if (verifyError) {
        console.error("verify-customer Invoke Error:", verifyError);
         // **FIX:** Check context.data.message directly
         let errMsg = "Verification failed. Please try again.";
         // Check if context and data and message exist
         if (verifyError.context?.data?.message) {
             errMsg = verifyError.context.data.message;
         } else if (verifyError.message) {
             errMsg = verifyError.message; // Fallback to generic client message
         }
         throw new Error(errMsg);
      }
      // Handle logical errors in 2xx response
      if (verifyData && verifyData.message && !verifyData.exists) { throw new Error(verifyData.message); }
      // Check verification result
      if (!verifyData?.exists) {
        setStatus("err");
        setMsg( "Sorry, we couldn't find a purchase of this specific ebook linked to that email. Reviews are for verified buyers only.");
        setSubmitting(false);
        return;
      }
      console.log("Purchase verified.");

      // 3. Save Review
      console.log(`Saving review: ${emailTrimmed}, ${ebookId}`);
      const { data: saveData, error: saveError } =
        await supabase.functions.invoke("save-review", {
          body: { /* ... review data ... */ },
        });

      // **Handle save-review function errors (including 409)**
      if (saveError) {
        console.error("save-review Invoke Error:", saveError);
        // **FIX:** Check context.data.message directly
        let errMsg = "Failed to save review. Please try again.";
        // Check if context and data and message exist
        if (saveError.context?.data?.message) {
            errMsg = saveError.context.data.message; // Catches the 409 "already reviewed" message
        } else if (saveError.message) {
            errMsg = saveError.message; // Fallback to generic client message
        }
        throw new Error(errMsg);
      }
      // Handle logical errors in 2xx response
      if (!saveData?.message || saveData.message !== "Review saved") { throw new Error(saveData?.message || "An unexpected issue occurred while saving."); }

      // 4. Success
      console.log("Review saved successfully.");
      setStatus("ok");
      setMsg("Your review was submitted successfully.");
      onSuccess?.({ stars, name: nameTrimmed, email: emailTrimmed, text: textTrimmed });

    } catch (err: any) {
      // 5. Catch ALL errors thrown
      console.error("Review submission process failed:", err);
      setStatus("err");
      setMsg(err.message || "An unknown error occurred.");

    } finally {
      // 6. Always stop loading
      setSubmitting(false);
    }
  };
  // --- END OF REPLACED HANDLE SUBMIT ---


  if (!open) return null;
  // The JSX structure of the modal remains the same
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
  REUSABLE CARD COMPONENT (No changes needed here)
  ======================================================
*/
const CARD_FIXED_H = "h-[600px]";

interface EbookGridProps {
  ebooks: EBook[];
  onAddToCart: (item: CartItem) => void; // Expects CartItem
  selectedCategory?: string;
}

const Card: React.FC<{
  ebook: EBook;
  isSelected?: boolean;
  onPreview: (e: EBook) => void;
  onAddToCart: (e: EBook) => void; // Specific handler passed down
  onWriteReview: (e: EBook) => void;
  emailInputs?: Record<string, string>;
  setEmailInputs?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  submittedEmails?: Record<string, boolean>;
  onNotify?: (e: EBook) => void;
  isSubmitting?: boolean;
  errorMessage?: string;
}> = ({
  ebook,
  isSelected,
  onPreview,
  onAddToCart, // Use the specific handler passed down
  onWriteReview,
  emailInputs = {},
  setEmailInputs,
  submittedEmails = {},
  onNotify,
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
      {/* Cover */}
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
        {/* Header/Info */}
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
        {/* Price/Chips */}
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

        {/* CTA Section */}
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
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Mail size={18} />
                  {isSubmitting ? "Adding..." : "Notify Me at Launch"}
                </button>
                {errorMessage && (
                  <p className="text-xs text-red-600 text-center -mt-2 pt-0">
                    {errorMessage}
                  </p>
                )}
              </div>
            )
          ) : (
             // --- CORRECTED: Call onAddToCart passed from Card props ---
            <button
              onClick={() => onAddToCart(ebook)} // Use the prop directly
              className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
             // ---------------------------------------------------------
          )}
        </div>
      </div>
    </div>
  );
};

/* ======================================================
  MOBILE CAROUSEL COMPONENT (CORRECTED)
  ======================================================
*/
const MobileCarousel: React.FC<{
  ebooks: EBook[];
  renderCard: (ebook: EBook, isSelected: boolean) => React.ReactNode;
}> = ({ ebooks, renderCard }) => {
  const [index, setIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Adjust index if ebooks array changes length
    setIndex((i) => Math.max(0, Math.min(i, ebooks.length - 1)));
  }, [ebooks.length]);

  // Scroll to a specific card index
  const scrollTo = (i: number) => {
    const el = cardRefs.current[i];
    if (!el || !viewportRef.current) return;

    const container = viewportRef.current;
    const containerWidth = container.offsetWidth;
    const cardRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Calculate scroll position to center the card
    const cardCenter = cardRect.left - containerRect.left + cardRect.width / 2;
    const scrollLeftTarget = container.scrollLeft + cardCenter - containerWidth / 2;

    container.scrollTo({
      left: scrollLeftTarget,
      behavior: 'smooth'
    });
    setIndex(i); // Update index after initiating scroll
  };

   // Scroll handler to update index based on viewport center
   const handleScroll = React.useCallback(() => {
     if (!viewportRef.current || cardRefs.current.length === 0) return;

     const container = viewportRef.current;
     const scrollLeft = container.scrollLeft;
     const containerWidth = container.offsetWidth;
     const containerCenter = scrollLeft + containerWidth / 2;

     let closestIndex = 0;
     let minDistance = Infinity;

     cardRefs.current.forEach((card, idx) => {
       if (!card) return;
       const cardRect = card.getBoundingClientRect();
       const containerRect = container.getBoundingClientRect();
       const cardCenter = cardRect.left - containerRect.left + cardRect.width / 2 + scrollLeft;
       const distance = Math.abs(containerCenter - cardCenter);

       if (distance < minDistance) {
         minDistance = distance;
         closestIndex = idx;
       }
     });

     // Check if the index actually changed to avoid unnecessary re-renders
     setIndex(prevIndex => prevIndex !== closestIndex ? closestIndex : prevIndex);

   }, []); // Removed dependency array as it doesn't need external variables


  // Previous/Next button handlers
  const prev = () => {
    scrollTo(Math.max(0, index - 1));
  };

  const next = () => {
    scrollTo(Math.min(ebooks.length - 1, index + 1));
  };

  return (
    <div className="md:hidden relative">
      {/* Scrollable container */}
      <div
        ref={viewportRef}
        className="overflow-x-auto snap-x snap-mandatory px-6 scroll-smooth scrollbar-none" // Added px-6 for padding consistency
        style={{
           // These paddings help center first/last items when snapping
           paddingLeft: 'calc(50% - (86% / 2))', // Adjust based on card width (w-[86%])
           paddingRight: 'calc(50% - (86% / 2))',
           scrollPaddingLeft: 'calc(50% - (86% / 2))', // For snap alignment
           scrollPaddingRight: 'calc(50% - (86% / 2))'
        }}
        onScroll={handleScroll} // Use the refined scroll handler
      >
        <div className="flex items-stretch gap-4 py-1"> {/* py-1 for slight vertical space */}
          {ebooks.map((ebook, idx) => (
            <div
              key={ebook.id}
              ref={(el) => { if (el) cardRefs.current[idx] = el; }}
              className={[
                "snap-center", // Snap alignment
                // Removed snap-end logic, rely on padding and scroll-padding
                "shrink-0 w-[86%]", // Card width
              ].join(" ")}
            >
              {renderCard(ebook, idx === index)} {/* Pass centered status */}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {ebooks.length > 1 && (
        <> {/* Use Fragment */}
          <button
            aria-label="Previous"
            onClick={prev} // Use updated prev function
            disabled={index === 0}
            className={`absolute left-1 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 shadow-md border border-gray-200 active:scale-95 transition-opacity ${
              index === 0 ? "opacity-40 pointer-events-none" : "opacity-100" // Use opacity for disabled state
            }`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Next"
            onClick={next} // Use updated next function
            disabled={index === ebooks.length - 1}
            className={`absolute right-1 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 shadow-md border border-gray-200 active:scale-95 transition-opacity ${
              index === ebooks.length - 1 ? "opacity-40 pointer-events-none" : "opacity-100" // Use opacity for disabled state
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Navigation Dots */}
      {ebooks.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4"> {/* Dots container */}
          {ebooks.map((_, idx) => (
            <button // Use button for accessibility
              key={idx}
              onClick={() => scrollTo(idx)} // Allow clicking dots
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                idx === index ? "bg-[hsl(333,65%,59%)] scale-125" : "bg-gray-300 hover:bg-gray-400" // Highlight active dot and add hover
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};


/* ======================================================
  MAIN EBOOK GRID COMPONENT
  ======================================================
*/
const EbookGrid: React.FC<EbookGridProps> = ({ ebooks, onAddToCart }) => { // onAddToCart expects CartItem
  const [previewEbook, setPreviewEbook] = useState<EBook | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingEbook, setReviewingEbook] = useState<EBook | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [activeTab, setActiveTab] = useState<string>("manipulation-toxic");
  const [showStickyTabs, setShowStickyTabs] = useState(false);
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const [submittedEmails, setSubmittedEmails] = useState<Record<string, boolean>>({});
  const [submittingWaitlist, setSubmittingWaitlist] = useState<Record<string, boolean>>({});
  const [waitlistError, setWaitlistError] = useState<Record<string, string>>({});
  const validateEmail = (e: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  // --- CORRECTED: Wrapper for Add to Cart ---
  // This function takes an EBook from the Card and converts it to the CartItem structure expected by the parent
  const handleAddToCartInternal = (ebook: EBook) => {
    // Basic check: Ensure the ebook object and price are valid
    if (!ebook || typeof ebook.price !== 'number') {
        console.error("Invalid ebook data passed to handleAddToCartInternal:", ebook);
        return; // Prevent adding invalid item
    }

    const cartItem: CartItem = {
        id: ebook.id, // Use ebook ID as the unique ID for the cart item
        item: ebook,
        quantity: 1,
        type: 'ebook', // Specify the type
        // Add metadata if needed, otherwise it can be empty or omitted if your CartItem type allows
        // metadata: {}
    };
    console.log("Adding to cart:", cartItem); // Debug log
    onAddToCart(cartItem); // Call the prop passed from the parent with the correct structure
  };
  // ------------------------------------------

  const openPreview = (ebook: EBook) => setPreviewEbook(ebook);
  const closePreview = () => setPreviewEbook(null);
  const openReviewModal = (ebook: EBook) => { setReviewingEbook(ebook); setReviewModalOpen(true); };
  const closeReviewModal = () => { setReviewModalOpen(false); setReviewingEbook(null); };
  const handleReviewSuccess = (payload: { name: string }) => { setSuccessName(payload.name); setSuccessOpen(true); closeReviewModal(); };

  // Keep the corrected handleNotifyMe
  const handleNotifyMe = async (ebook: EBook) => {
    // --- Add check for Supabase client ---
    if (!supabase) {
        setWaitlistError((prev) => ({ ...prev, [ebook.id]: "Server connection error." }));
        return;
    }
    // ------------------------------------
    const email = emailInputs[ebook.id];
    if (!email || !validateEmail(email)) {
      setWaitlistError((prev) => ({ ...prev, [ebook.id]: "Please enter a valid email." }));
      return;
    }
    setWaitlistError((prev) => ({ ...prev, [ebook.id]: "" }));
    setSubmittingWaitlist((prev) => ({ ...prev, [ebook.id]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("add-to-waitlist", { body: { email: email.trim().toLowerCase(), ebook_id: ebook.id } });
      if (error) { if (error.context?.message) throw new Error(error.context.message); throw new Error(`Waitlist function failed: ${error.message}`); } // More specific error
      if (data.message.includes("Success") || data.message.includes("already on the waitlist")) { // Handle "already on list" as success
          setSubmittedEmails((prev) => ({ ...prev, [ebook.id]: true }));
      } else {
          throw new Error(data.message || "Unknown error adding to waitlist.");
      }
    } catch (err: any) {
      console.error("handleNotifyMe error:", err); // Log error
      setWaitlistError((prev) => ({ ...prev, [ebook.id]: err.message }));
    } finally {
      setSubmittingWaitlist((prev) => ({ ...prev, [ebook.id]: false }));
    }
  };

  const getEbooksByCategory = (category: string) => ebooks.filter((ebook) => ebook.category === category);
  const getCategoryAnchor = (category: string) => category === "Manipulation & Toxic Relationships" ? "manipulation-toxic" : category === "Dating & Red Flags" ? "dating-red-flags" : "self-empowering";
  const getCategoryColors = (category: string) => ({ from: "from-[hsl(333,65%,59%)]", to: "to-[hsl(335,77%,80%)]" });

  // Scroll logic
  const scrollToCategory = (category: string) => {
    const element = document.getElementById(getCategoryAnchor(category));
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const handleScroll = () => {
      // Sticky tabs logic
      const mainSection = document.getElementById("ebooks"); // Target the main section by ID
      const mainSectionTop = mainSection ? mainSection.offsetTop : 0;
      // Show sticky tabs when scrolled past the top of the main section (adjust offset as needed)
      const offsetToShow = 100; // Pixels past the top of the section
      setShowStickyTabs(window.scrollY > mainSectionTop + offsetToShow);

      // Active tab based on scroll position
      const manipulationSection = document.getElementById("manipulation-toxic");
      const datingSection = document.getElementById("dating-red-flags");
      const selfSection = document.getElementById("self-empowering");
      const scrollY = window.scrollY;
      const offsetForActive = 150; // Offset from top to trigger tab change

      // Check sections exist before accessing offsetTop
      if (selfSection && scrollY >= selfSection.offsetTop - offsetForActive) setActiveTab("self-empowering");
      else if (datingSection && scrollY >= datingSection.offsetTop - offsetForActive) setActiveTab("dating-red-flags");
      else if (manipulationSection && scrollY >= manipulationSection.offsetTop - offsetForActive) setActiveTab("manipulation-toxic");
      // Optional: Reset if scrolling above the first section
      else if (manipulationSection && scrollY < manipulationSection.offsetTop - offsetForActive) setActiveTab(""); // Reset active tab

    };
    window.addEventListener("scroll", handleScroll, { passive: true }); // Use passive listener
    return () => window.removeEventListener("scroll", handleScroll);
  }, []); // Empty dependency array, runs once


  // Render Card function now passes the internal handler
  const renderCard = (ebook: EBook, isSelected: boolean) => (
    <Card
      ebook={ebook}
      isSelected={isSelected}
      onPreview={openPreview}
      onAddToCart={handleAddToCartInternal} // --- Pass the internal wrapper ---
      onWriteReview={openReviewModal}
      emailInputs={emailInputs}
      setEmailInputs={setEmailInputs}
      submittedEmails={submittedEmails}
      onNotify={handleNotifyMe}
      isSubmitting={submittingWaitlist[ebook.id]}
      errorMessage={waitlistError[ebook.id]}
    />
  );

  return (
    <section id="ebooks" className="py-16 bg-gradient-to-br from-gray-50 to-pink-50 scroll-mt-16 md:scroll-mt-0"> {/* Added scroll margin top */}
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
             Your day is busy, but your growth doesn't have to wait! Hear the key
             lessons anytime, anywhere.
           </p>
         </div>

         {/* Sticky Segmented Tabs (Mobile) */}
         <div
            className={`md:hidden sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-transform duration-300 ${ // Changed fixed to sticky
              showStickyTabs ? "translate-y-0" : "-translate-y-full" // Use translate-y for show/hide
            }`}
            style={{ transform: showStickyTabs ? 'translateY(0)' : 'translateY(-100%)' }} // Ensure style matches class
          >
           <div className="container mx-auto px-4 py-3">
             <div className="flex bg-gray-100 rounded-full p-1">
               <button
                 onClick={() => scrollToCategory("Manipulation & Toxic Relationships")}
                 className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all ${
                   activeTab === "manipulation-toxic"
                     ? "bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white shadow-sm"
                     : "text-gray-600 hover:text-gray-800"
                 }`}
               >
                 Manipulation
               </button>
               {/* Simplified Label for Dating */}
                <button
                 onClick={() => scrollToCategory("Dating & Red Flags")}
                 className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all ${
                   activeTab === "dating-red-flags"
                     ? "bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white shadow-sm"
                     : "text-gray-600 hover:text-gray-800"
                 }`}
               >
                 Dating {/* Changed from Self */}
               </button>
               {/* Added Self-Empowering Tab */}
                <button
                 onClick={() => scrollToCategory("Self Empowering")}
                 className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all ${
                   activeTab === "self-empowering"
                     ? "bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white shadow-sm"
                     : "text-gray-600 hover:text-gray-800"
                 }`}
               >
                 Self {/* Added Self tab */}
               </button>
             </div>
           </div>
         </div>

         {/* Categories */}
         {activeCategories.map((category) => {
           const categoryEbooks = getEbooksByCategory(category);
           const colors = getCategoryColors(category);
           const anchor = getCategoryAnchor(category);
           return (
             <div key={category} className="mb-16">
               {/* Banner with scroll margin */}
               <div id={anchor} className={`scroll-mt-20 bg-gradient-to-r ${colors.from} ${colors.to} rounded-2xl p-8 mb-8 text-white relative overflow-hidden`}> {/* Added scroll-mt-20 */}
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

               {/* Mobile Carousel - Use the corrected component */}
               <MobileCarousel ebooks={categoryEbooks} renderCard={renderCard} />

               {/* Desktop Grid */}
               <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
                 {categoryEbooks.map((ebook) => (
                   <div key={ebook.id}>{renderCard(ebook, false)}</div>
                 ))}
               </div>
             </div>
           );
         })}

         {/* Preview Modal */}
         {previewEbook && (
           <PreviewModal
              ebook={previewEbook}
              onClose={closePreview}
              onAddToCart={handleAddToCartInternal} // Use internal wrapper here too
           />
         )}
       </div>

       {/* Review Modal */}
       <ReviewModal
         open={reviewModalOpen}
         ebookTitle={reviewingEbook?.title ?? ""}
         ebookId={reviewingEbook?.id ?? ""} // Ensure ID is passed
         onClose={closeReviewModal}
         onSuccess={handleReviewSuccess}
       />
       {/* Success Overlay */}
       <ReviewSuccessOverlay
         open={successOpen}
         name={successName}
         onClose={() => setSuccessOpen(false)}
       />
     </section>
   );
 };

 export default EbookGrid;