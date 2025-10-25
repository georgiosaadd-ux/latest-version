import React from "react";
import {
  ArrowDown,
  Shield,
  Download,
  CheckCircle,
  Star,
  Users,
  Heart,
} from "lucide-react";

interface HeroProps {
  onBrowseClick: () => void;
  onBundlesClick: () => void;
  onReviewsClick: () => void; // NEW: scroll to reviews/testimonials
}

const Hero: React.FC<HeroProps> = ({
  onBrowseClick,
  onBundlesClick,
  onReviewsClick,
}) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(333,65%,59%)]/10 via-[hsl(335,77%,80%)]/10 to-pink-500/10" />
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-[hsl(333,65%,85%)] to-[hsl(335,77%,90%)] rounded-full opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-[hsl(333,65%,85%)] to-[hsl(335,77%,90%)] rounded-full opacity-20 animate-pulse delay-1000" />

      <div className="container mx-auto px-4 text-center relative z-10 pt-20 pb-10">
        <div className="max-w-1xl mx-auto">
          {/* Trust Badge - Above Title */}
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-6 animate-fade-in bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 md:px-6 md:py-3 shadow-lg w-fit mx-auto">
            {/* Stars (mobile) */}
            <div className="flex items-center gap-1 md:hidden">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={`m-${i}`}
                  size={14}
                  className="text-[hsl(333,65%,59%)] fill-[hsl(333,65%,59%)]"
                />
              ))}
            </div>
            {/* Stars (desktop/tablet) */}
            <div className="hidden md:flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={`d-${i}`}
                  size={20}
                  className="text-[hsl(333,65%,59%)] fill-[hsl(333,65%,59%)]"
                />
              ))}
            </div>
            <span className="text-gray-800 font-bold text-sm md:text-xl">
              5/5 from 2,000+ readers
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl font-bold mb-6 leading-tight">
            {/* Mobile layout */}
            <span className="md:hidden">
              <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                Understand
              </span>
              <br />
              <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                His{" "}
              </span>
              <span className="text-gray-800">Tactics</span>
            </span>

            {/* Desktop layout */}
            <span className="hidden md:inline">
              <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                Understand His
              </span>
              <br />
              <span className="text-gray-800">Tactics</span>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            From love-bombing to manipulation, from charm to control. See the
            hidden patterns men play, and finally protect your heart.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={onBrowseClick}
              className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Browse eBooks
              <ArrowDown size={20} />
            </button>
            <button
              onClick={onBundlesClick}
              className="border-2 border-purple-300 text-purple-800 px-8 py-4 rounded-full text-lg font-semibold hover:border-purple-500 hover:text-purple-600 transition-all transform hover:-translate-y-1"
            >
              See Bundles & Save
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 text-sm mb-8">
            <div className="flex items-center gap-2">
              <Download size={16} className="text-green-600" />
              <span className="text-gray-600">Instant downloads</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-600" />
              <span className="text-gray-600">Secure checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-gray-600">Real results</span>
            </div>
          </div>

          {/* Social Proof Stats — now clickable to Reviews */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto">
            {/* Box 1 */}
            <button
              onClick={onReviewsClick}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg transition 
                         hover:shadow-xl hover:-translate-y-1 active:scale-95 focus:outline-none"
              aria-label="See reader reviews"
            >
              <div className="flex items-center justify-center mb-2">
                <Users className="text-[hsl(333,65%,59%)]" size={32} />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                2,300+
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                Happy Readers
              </div>
            </button>

            {/* Box 2 */}
            <button
              onClick={onReviewsClick}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg transition 
                         hover:shadow-xl hover:-translate-y-1 active:scale-95 focus:outline-none"
              aria-label="See average rating"
            >
              <div className="flex items-center justify-center mb-2">
                <Star className="text-yellow-400 fill-yellow-400" size={32} />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                4.99/5
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                Average Rating
              </div>
            </button>

            {/* Box 3 */}
            <button
              onClick={onReviewsClick}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg transition 
                         hover:shadow-xl hover:-translate-y-1 active:scale-95 focus:outline-none"
              aria-label="See 5-star reviews"
            >
              <div className="flex items-center justify-center mb-2">
                <Heart className="text-red-500 fill-red-500" size={32} />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                2,300+
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                5-Star Reviews
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
