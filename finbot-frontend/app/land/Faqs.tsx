import React, { useState } from 'react';

const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const faqs = [
    {
      question: "Is my financial data secure on your platform?",
      answer: "Yes, we use bank-level encryption and security measures to protect your financial data. All data is encrypted both in transit and at rest, and we comply with industry standards including SOC 2 and PCI DSS compliance."
    },
    {
      question: "How quickly can we get started after signing up?",
      answer: "You can get started immediately after signing up. Our onboarding process typically takes 5-10 minutes, and you'll have access to all core features right away. Our team is also available to help you get set up faster if needed."
    },
    {
      question: "What makes your platform different from other?",
      answer: "Our platform stands out with its intuitive interface, advanced automation features, real-time analytics, and dedicated customer support. We also offer seamless integrations with major banking and accounting systems."
    },
    {
      question: "Do you offer custom solutions for large financial organizations?",
      answer: "Absolutely. We provide enterprise-grade solutions with custom features, dedicated account management, priority support, and flexible pricing structures tailored to large organizations' specific needs."
    }
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(to bottom, #D8DFFB 0%,#9ACAFF 80%, #D3D8FB 100%)' }}>
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl text-gray-700 font-light mb-4">
            Have a <span className="italic font-serif">question</span>?
          </h1>
          <p className="text-gray-600 text-lg">
            Clear answers to the most common questions about<br />
            our banking, eligibility, and costs.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-xs overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-xl font-normal text-gray-900 pr-4">
                  {faq.question}
                </span>
                <span className="text-3xl font-light text-gray-900 flex-shrink-0 transition-transform duration-300" 
                  style={{ transform: openIndex === index ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                  +
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: openIndex === index ? '500px' : '0',
                  opacity: openIndex === index ? 1 : 0
                }}
              >
                <div className="px-8 pb-6 pt-2 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQAccordion;