import React from 'react';

const Footer = () => {
  return (
    <div className=" flex flex-col">
      {/* Main content spacer */}
      
      
      {/* CTA Section */}
      <div className="relative pt-10"  style={{ background: 'linear-gradient(to bottom, #D3D8FB 0%, #3844D1 30%, #000000 60%)' }}>
        <div className="text-center py-24 px-6">
          <h2 className="text-5xl md:text-6xl font-light text-white mb-2">
            Ready to shape the future
          </h2>
          <h2 className="text-5xl md:text-6xl font-serif italic text-white mb-12">
            in Smart investing?
          </h2>
          <button className="bg-white text-black px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-100 transition-colors">
            Start Free trail today
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
              {/* Left - Logo and Contact */}
              <div>
                                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-4 border-black rounded-full" style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }}></div>
                  </div>
                  <span className="text-white text-2xl font-light">InvestPro</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">support@investpro.com</p>
                <p className="text-white text-lg">+1 (555) 123-4567</p>
              </div>

              {/* Middle - Navigation */}
              <div className="flex gap-16">
                <div>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-white hover:text-gray-300 transition-colors">Career</a></li>
                    <li>
                      <a href="#" className="text-white hover:text-gray-300 transition-colors flex items-center gap-2">
                        Business
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </a>
                    </li>
                    <li><a href="#" className="text-white hover:text-gray-300 transition-colors">Products</a></li>
                    <li><a href="#" className="text-white hover:text-gray-300 transition-colors">Docs</a></li>
                  </ul>
                </div>
              </div>

              {/* Right - Links and Scroll */}
              <div className="flex justify-between items-start">
                <div>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-white hover:text-gray-300 transition-colors">FAQ</a></li>
                    <li><a href="#" className="text-white hover:text-gray-300 transition-colors">Delivery</a></li>
                  </ul>
                </div>
                <button className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center text-white hover:bg-gray-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Copyright */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-800">
              <p className="text-gray-400 text-sm">© 2025 — Copyright All Rights reserved</p>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;