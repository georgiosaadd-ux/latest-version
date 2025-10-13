import React from 'react';

interface CartBadgeProps {
  count: number;
}

const CartBadge: React.FC<CartBadgeProps> = ({ count }) => {
  if (count === 0) return null;

  const displayCount = count >= 9 ? '9+' : count.toString();

  return (
    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-lg">
      {displayCount}
    </span>
  );
};

export default CartBadge;