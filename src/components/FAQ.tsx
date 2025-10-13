import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I receive my eBook?",
      answer: "You'll get an instant download link by email and on the order confirmation page immediately after purchase. No waiting required."
    },
    {
      question: "What format do I get?",
      answer: "All eBooks come as PDF files, readable on your phone, tablet, computer, or any device with a PDF reader. They're optimized for easy reading on all screen sizes."
    },
    {
      question: "What about refunds?",
      answer: "If you're not satisfied within 7 days of purchase, contact our support team and we'll help make it right. Your satisfaction is our priority."
    },
    {
      question: "Can I gift an eBook?",
      answer: "Absolutely! Just add the recipient's email in the checkout notes section, and we'll send the download link directly to them with a lovely gift message."
    },
    {
      question: "Do I need an app to read these?",
      answer: "No special app needed. Any PDF reader works - your phone and computer already have one built in. Simple and convenient."
    },
    {
      question: "Will my information be safe?",
      answer: "Yes, we protect your data with bank-level security and never sell your email address. Your privacy is sacred to us."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 bg-gradient-to-br from-gray-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
              Questions & Answers
            </span>
          </h2>
          <p className="text-xl text-gray-600">Everything you need to know</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 mb-4"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800 pr-4">
                  {faq.question}
                </h3>
                {openIndex === index ? (
                  <ChevronUp size={24} className="flex-shrink-0 text-[hsl(333,65%,59%)]" />
                ) : (
                  <ChevronDown size={24} className="text-[hsl(333,65%,59%)] flex-shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-8 pb-6">
                  <div className="h-px bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] mb-4"></div>
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;