import React from 'react';
import { Gift } from 'lucide-react';

interface FreeEbookProgressProps {
  ebookCount: number;
  compact?: boolean;
}

const FreeEbookProgress: React.FC<FreeEbookProgressProps> = ({ ebookCount, compact = false }) => {
  const milestones = [0, 3, 6];
  const maxMilestone = 6;

  const getProgress = () => {
    if (ebookCount >= 6) return 100;
    if (ebookCount >= 3) return 50 + ((ebookCount - 3) / 3) * 50;
    return (ebookCount / 3) * 50;
  };

  const getMessage = () => {
    if (ebookCount >= 6) {
      return "Another FREE ebook unlocked 🎁";
    }
    if (ebookCount >= 3) {
      const remaining = 6 - ebookCount;
      if (remaining === 0) return "FREE ebook unlocked 🎁";
      return `You're ${remaining} ebook${remaining > 1 ? 's' : ''} away from another FREE ebook (unlocks at 6).`;
    }
    const remaining = 3 - ebookCount;
    return `You're ${remaining} ebook${remaining > 1 ? 's' : ''} away from a FREE ebook (unlocks at 3).`;
  };

  const progress = getProgress();
  const isFirstUnlocked = ebookCount >= 3;
  const isSecondUnlocked = ebookCount >= 6;

  return (
    <div className={`${compact ? 'p-3' : 'p-4'} bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border border-pink-200`}>
      <div className="flex items-center gap-2 mb-2">
        <Gift size={compact ? 16 : 18} className="text-[hsl(333,65%,59%)]" />
        <span className={`font-bold text-[hsl(333,65%,45%)] ${compact ? 'text-xs' : 'text-sm'}`}>
          {getMessage()}
        </span>
      </div>

      <div className="relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] transition-all duration-700 ease-out ${
              isFirstUnlocked || isSecondUnlocked ? 'animate-pulse' : ''
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-2">
          {milestones.map((milestone, index) => {
            const isReached = ebookCount >= milestone;
            const isUnlockPoint = milestone === 3 || milestone === 6;

            return (
              <div
                key={milestone}
                className={`flex flex-col items-center ${
                  index === 0 ? 'items-start' : index === milestones.length - 1 ? 'items-end' : 'items-center'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isReached
                      ? 'bg-gradient-to-br from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white shadow-lg scale-110'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  {isUnlockPoint && isReached ? (
                    <Gift size={14} />
                  ) : (
                    milestone
                  )}
                </div>
                {isUnlockPoint && (
                  <span
                    className={`text-xs font-semibold mt-1 ${
                      isReached ? 'text-[hsl(333,65%,45%)]' : 'text-gray-500'
                    }`}
                  >
                    FREE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FreeEbookProgress;
