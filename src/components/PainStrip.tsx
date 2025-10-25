import React from 'react';

interface PainStripProps {
  onCategoryClick?: (category: string) => void;
}

const PainStrip: React.FC<PainStripProps> = ({ onCategoryClick = () => {} }) => {
  const scenarios = [
        {
      story: " He disappears the moment you start to feel safe.",
      highlight: "Learn why Men only love the chase"
    },

      {
      story: " He wants physical things fast, but avoids talking about feelings.",
      highlight: "Learn the difference between LOVE and LUST"
    },
    
  {
      story: " See how modern dating in the social media era sells illusions, not intimacy and keeps you chasing what’s fake.",
      highlight: "See through modern manipulation"
    },

     {
      story: " He says he’s not ready for a relationship, but never stops flirting with you.",
      highlight: "Learn how they manipulate, and understand their mixed signals."
    },

    
    {
      story: " He gives you all his time, all his attention. Then just like that, he disappears for days, leaving you broken and addicted to his return.",
      highlight: "Learn the toxic push–pull cycle"
    },
    {
      story: " You apologize for things he did.",
      highlight: "See how gaslighting really works"
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