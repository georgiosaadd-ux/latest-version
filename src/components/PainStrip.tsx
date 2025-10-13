import React from 'react';

interface PainStripProps {
  onCategoryClick?: (category: string) => void;
}

const PainStrip: React.FC<PainStripProps> = ({ onCategoryClick = () => {} }) => {
  const scenarios = [
    {
      story: "He gives you all his time, all his attention, calling, texting, making you feel chosen. Then just like that, he disappears for days, leaving you broken and addicted to his return.",
      highlight: "Learn the toxic push–pull cycle"
    },
    {
      story: "You catch him lying, the messages, the late nights, the inconsistencies. But somehow he spins it around and makes you feel guilty for even asking questions.",
      highlight: "Discover how manipulators flip the blame"
    },
    {
      story: "He makes you feel crazy for remembering things exactly as they happened, and somehow you're apologizing for something he did. That's manipulation.",
      highlight: "See how gaslighting really works"
    },
    {
      story: "He swears he wants a future with you, but months turn into years… and you're still waiting for a ring, still waiting for commitment, still waiting for him to choose you.",
      highlight: "Stop wasting your best years on empty promises"
    },
    {
      story: "Every man looks different, but the stories feel the same. The same games, the same red flags, the same heartbreak… and you're starting to wonder if it's you.",
      highlight: "Break the cycle once and for all"
    }
  ];

  const scrollToEbooks = () => {
    const element = document.getElementById('ebooks');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 bg-gradient-to-r from-gray-50 to-pink-50 transition-all duration-300 ease-out">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-16 leading-tight">
          <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
            Does this feel way too familiar?
          </span>
        </h2>
        
        <div className="max-w-4xl mx-auto space-y-8">
          {scenarios.map((scenario, index) => (
            <button
              key={index}
              onClick={scrollToEbooks}
              className="w-full bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-left group border border-gray-100"
            >
              <div className="space-y-4">
                <p className="text-gray-700 text-lg leading-relaxed">
                  "{scenario.story}"
                </p>
                
                <div className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-2xl">→</span>
                  <span className="font-bold text-xl md:text-2xl bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] bg-clip-text text-transparent group-hover:underline decoration-2 underline-offset-4">
                    {scenario.highlight}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainStrip;