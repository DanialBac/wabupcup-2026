import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroCountdownItemProps {
  value: number;
  label: string;
  isAccent?: boolean;
}

/**
 * Kotak Countdown Interaktif dengan transisi angka mulus,
 * tata letak proporsional anti-glitch, dan efek hover mikro-interaksi.
 */
export const HeroCountdownItem: React.FC<HeroCountdownItemProps> = ({
  value,
  label,
  isAccent = false,
}) => {
  const formattedValue = String(Math.max(0, value)).padStart(2, '0');

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl backdrop-blur-md cursor-default select-none ${
        isAccent
          ? 'bg-gradient-to-b from-red-500/10 via-slate-900/90 to-slate-950 border border-red-500/40 hover:border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
          : 'bg-gradient-to-b from-white/95 to-slate-100/90 dark:from-slate-900/90 dark:to-slate-950/90 border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25 shadow-md dark:shadow-inner'
      }`}
    >
      {/* Top subtle sheen / gloss line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent pointer-events-none" />

      {/* Number Display with smooth sliding roll animation */}
      <div className="h-10 sm:h-14 flex items-center justify-center relative w-full overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={formattedValue}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1], // easeOutCubic
            }}
            className={`block text-2xl sm:text-4xl lg:text-5xl font-heading font-black tabular-nums tracking-tight ${
              isAccent
                ? 'text-red-500 dark:text-red-400 drop-shadow-[0_2px_12px_rgba(239,68,68,0.4)]'
                : 'text-slate-900 dark:text-white drop-shadow-sm'
            }`}
          >
            {formattedValue}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Label Pill */}
      <div className="mt-1 w-full flex justify-center">
        <span
          className={`inline-block px-2 sm:px-2.5 py-0.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors ${
            isAccent
              ? 'bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/20'
              : 'bg-slate-200/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border border-slate-300/40 dark:border-white/5'
          }`}
        >
          {label}
        </span>
      </div>
    </div>
  );
};
