import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroCountdownItemProps {
  value: number;
  label: string;
  isAccent?: boolean;
}

/**
 * Kotak Countdown dengan animasi slide-down / fade flip halus saat nilai berganti.
 * Menggunakan AnimatePresence mode="popLayout" untuk transisi angka yang presisi tanpa layout shift.
 */
export const HeroCountdownItem: React.FC<HeroCountdownItemProps> = ({
  value,
  label,
  isAccent = false,
}) => {
  const formattedValue = String(value).padStart(2, '0');

  return (
    <div className="bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 sm:p-3 relative overflow-hidden backdrop-blur-sm group hover:border-slate-400 dark:hover:border-slate-700 transition-colors">
      <div className="h-8 sm:h-10 flex items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={formattedValue}
            initial={{ y: -20, opacity: 0, filter: 'blur(2px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: 20, opacity: 0, filter: 'blur(2px)' }}
            transition={{
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1], // easeOutCubic
            }}
            className={`block text-2xl sm:text-4xl font-heading font-bold tabular-nums select-none ${
              isAccent
                ? 'text-red-600 dark:text-red-500'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {formattedValue}
          </motion.span>
        </AnimatePresence>
      </div>

      <span className="block text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5 select-none">
        {label}
      </span>
    </div>
  );
};
