import React from 'react';
import { Shield, Heart, Lock } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="font-heading text-3xl font-bold bg-gradient-to-r from-[hsl(333,65%,70%)] to-[hsl(335,77%,85%)] bg-clip-text text-transparent mb-2">
              HeartWise
            </div>
            <p className="text-gray-400">Empowering women to choose love that honors them</p>
          </div>
          
          {/* Trust badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-8 pb-8 border-b border-gray-700">
            <div className="flex items-center gap-3 text-gray-300">
              <Shield size={20} className="text-green-400" />
              <span className="text-sm">Secure Checkout</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Lock size={20} className="text-green-400" />
              <span className="text-sm">Privacy Protected</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Heart size={20} className="text-green-400" />
              <span className="text-sm">Real Results</span>
            </div>
          </div>
          
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-8 mb-8 text-gray-400">
            <button className="transition-colors hover:text-[hsl(333,65%,70%)]">Privacy Policy</button>
            <button className="transition-colors hover:text-[hsl(333,65%,70%)]">Terms of Service</button>
            <button className="transition-colors hover:text-[hsl(333,65%,70%)]">Contact Support</button>
          </div>
          
          {/* Copyright */}
          <div className="text-gray-500 text-sm">
            <p>&copy; 2024 HeartWise. All rights reserved.</p>
            <p className="mt-2">Designed with love for women ready to choose themselves.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;