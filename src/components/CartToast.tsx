import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface CartToastProps {
  show: boolean;
  message: string;
  onHide: () => void;
}

const CartToast: React.FC<CartToastProps> = ({ show, message, onHide }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in">
      <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-sm">
        <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
        <p className="text-sm font-medium text-gray-800">{message}</p>
      </div>
    </div>
  );
};

export default CartToast;