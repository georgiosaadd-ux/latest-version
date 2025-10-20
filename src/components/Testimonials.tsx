import React from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, Play } from 'lucide-react';

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [mediaCurrentIndex, setMediaCurrentIndex] = React.useState(0);
  const [showVideoModal, setShowVideoModal] = React.useState(false);
  const [selectedVideo, setSelectedVideo] = React.useState<string | null>(null);

  const testimonials = [
    {
      text: "OMG I didn't even know what gaslighting was until I read this. Now I can literally see every trick my ex used on me, and I'll never fall for it again.",
      author: "Layla, 27",
      location: "New York"
    },
    {
      text: "I have to say this out loud: these books EXPOSED men. The love-bombing, the lies, the fake promises… I finally feel free.",
      author: "Karina, 32", 
      location: "Miami"
    },
    {
      text: "Honestly? It felt like someone grabbed my diary and explained it back to me. Every red flag, every confusion, all laid out. I can't believe I didn't see it sooner.",
      author: "Sofia, 29",
      location: "Toronto"
    },
    {
      text: "I'm shaking writing this. I used to blame myself for everything. Reading this made me realize it wasn't me, it was his manipulation. Game over.",
      author: "Hannah, 35",
      location: "London"
    },
    {
      text: "No one ever told me what 'charm to control' really means. This guide opened my eyes so wide, now I spot it in minutes.",
      author: "Amira, 26",
      location: "Dubai"
    },
    {
      text: "I swear it felt like someone finally turned the lights on. I saw the patterns in every single guy I dated, and I felt my self-worth snap back.",
      author: "Vanessa, 31",
      location: "Sydney"
    },
    {
      text: "I kept asking myself, why do I attract the wrong men? This literally answered it. And now I know how to stop the cycle. Life-changing.",
      author: "Jasmine, 28",
      location: "Berlin"
    },
    {
      text: "I didn't want to admit it, but reading this made me cry. It exposed every silent treatment, every twisted word… and gave me the courage to walk away.",
      author: "Noura, 37",
      location: "Paris"
    },
    {
      text: "This isn't just advice, it's survival. I finally see through the fake charm and empty promises. Honestly, I wish every woman could read this.",
      author: "Elena, 40",
      location: "Los Angeles"
    }
  ];

  // Placeholder media items - replace with your actual videos/images
  const mediaItems = [
    {
      id: 1,
      type: 'video',
      thumbnail: 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=400',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      title: 'Sarah\'s Story'
    },
    {
      id: 2,
      type: 'image',
      thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Maria\'s Transformation'
    },
    {
      id: 3,
      type: 'video',
      thumbnail: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      title: 'Jessica\'s Journey'
    },
    {
      id: 4,
      type: 'image',
      thumbnail: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Anna\'s Awakening'
    },
    {
      id: 5,
      type: 'video',
      thumbnail: 'https://images.pexels.com/photos/3184639/pexels-photo-3184639.jpeg?auto=compress&cs=tinysrgb&w=400',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      title: 'Rachel\'s Recovery'
    }
  ];

  // Auto-scroll effect for testimonials
  React.useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isPaused, testimonials.length]);

  const nextTestimonial = () => {
    setIsPaused(true);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const prevTestimonial = () => {
    setIsPaused(true);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const goToTestimonial = (index: number) => {
    setIsPaused(true);
    setCurrentIndex(index);
    setTimeout(() => setIsPaused(false), 5000);
  };

  // Media carousel controls
  const nextMedia = () => {
    setMediaCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevMedia = () => {
    setMediaCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleMediaClick = (item: any) => {
    if (item.type === 'video') {
      setSelectedVideo(item.videoUrl);
      setShowVideoModal(true);
    }
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  return (
    <section id="testimonials" className="py-16 bg-gradient-to-br from-rose-50 via-pink-50 to-cream overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
              Same games, Same lies, Same confusion.<br />
              You're not the only one
            </span>
          </h2>
          <p className="text-xl text-gray-600">What helped them see the truth can help you too.</p>
        </div>

        {/* Video/Image Carousel */}
        <div className="relative max-w-6xl mx-auto mb-16">
          <div className="relative overflow-hidden">
            {/* Navigation buttons for media */}
            <button
              onClick={prevMedia}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center hover:bg-white transition-all hover:scale-110"
              style={{ color: 'hsl(333, 65%, 59%)' }}
            >
              <ChevronLeft size={20} />
            </button>
            
            <button
              onClick={nextMedia}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center hover:bg-white transition-all hover:scale-110"
              style={{ color: 'hsl(333, 65%, 59%)' }}
            >
              <ChevronRight size={20} />
            </button>

            {/* Media items */}
            <div className="flex gap-4 px-12 py-8 animate-fade-in">
              <div 
                className="flex transition-transform duration-500 ease-in-out gap-4"
                style={{ 
                  transform: `translateX(-${mediaCurrentIndex * (100 / Math.min(mediaItems.length, 3))}%)`,
                  width: `${(mediaItems.length / Math.min(mediaItems.length, 3)) * 100}%`
                }}
              >
                {mediaItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative flex-shrink-0 cursor-pointer group"
                    style={{ width: `${100 / Math.min(mediaItems.length, 3)}%` }}
                    onClick={() => handleMediaClick(item)}
                  >
                    <div className="relative aspect-video rounded-2xl overflow-hidden border-4 border-pink-200 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Overlay for videos */}
                      {item.type === 'video' && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-all">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play size={24} className="text-pink-600 ml-1" />
                          </div>
                        </div>
                      )}
                      
                      {/* Gradient overlay for images */}
                      {item.type === 'image' && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    
                    {/* Title */}
                    <p className="text-center mt-3 font-medium text-gray-700 group-hover:text-pink-600 transition-colors">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Media dots indicator */}
            <div className="flex justify-center space-x-2 mt-4">
              {mediaItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setMediaCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === mediaCurrentIndex 
                      ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)]' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Testimonial Cards Carousel */}
        <div className="relative max-w-6xl mx-auto">
          {/* Manual navigation buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-110"
            style={{ color: 'hsl(333, 65%, 59%)' }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-110"
            style={{ color: 'hsl(333, 65%, 59%)' }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <ChevronRight size={24} />
          </button>

          {/* Testimonials grid - showing 3 at a time */}
          <div className="overflow-hidden px-4 md:px-16">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ 
                transform: window.innerWidth < 768 
                  ? `translateX(-${currentIndex * 100}%)` 
                  : `translateX(-${currentIndex * (100 / 3)}%)`
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {[...testimonials, ...testimonials.slice(0, 3)].map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-[hsl(333,65%,95%)] to-[hsl(335,77%,95%)] rounded-2xl p-4 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 relative border border-[hsl(333,65%,85%)] mx-2 md:mx-4 mt-8"
                  style={{ 
                    width: window.innerWidth < 768 
                      ? 'calc(100% - 16px)' 
                      : 'calc(33.333% - 32px)', 
                    minHeight: '300px' 
                  }}
                >
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full flex items-center justify-center">
                    <Quote size={16} className="text-white" />
                  </div>
                  
                  <div className="mb-4 flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <blockquote className="text-gray-800 mb-6 text-lg leading-relaxed font-bold min-h-[140px] flex items-start">
                    <span className="text-base md:text-lg">"{testimonial.text}"</span>
                  </blockquote>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[hsl(333,65%,75%)] to-[hsl(335,77%,85%)] rounded-full flex items-center justify-center">
                      <span className="font-bold text-base md:text-lg" style={{ color: 'hsl(333, 65%, 35%)' }}>
                        {testimonial.author.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-sm md:text-base">
                        {testimonial.author}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">
                        {testimonial.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dots indicator for testimonials */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)]' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeVideoModal}
        >
          <div 
            className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeVideoModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              ×
            </button>
            <video
              src={selectedVideo}
              controls
              autoPlay
              className="w-full h-full"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </section>
  );
};

export default Testimonials;