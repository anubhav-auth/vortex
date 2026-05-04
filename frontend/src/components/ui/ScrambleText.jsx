import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn.js';

const CHARS = 'ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';

// Preserved from v1: character-by-character reveal animation. Renders an
// inline-block span sized to the final text length so layout doesn't jump.

export const ScrambleText = ({ text, duration = 0.4, className }) => {
  const [display, setDisplay] = useState(() =>
    text.split('').map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join(''),
  );

  useEffect(() => {
    let iteration = 0;
    const max = text.length;
    const id = setInterval(() => {
      setDisplay(
        text.split('').map((c, i) => (i < iteration ? c : CHARS[Math.floor(Math.random() * CHARS.length)])).join(''),
      );
      if (iteration >= max) clearInterval(id);
      iteration += max / (duration * 60);
    }, 20);
    return () => clearInterval(id);
  }, [text, duration]);

  return <span className={cn('inline-block font-mono min-w-[1ch]', className)}>{display}</span>;
};
