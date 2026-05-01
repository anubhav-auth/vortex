import { useEffect, useState } from "react";
import { cn } from "../../utils/cn";

const CHARS = "ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";

export function ScrambleText({ text, duration = 0.4, className }) {
  const [displayText, setDisplayText] = useState(() => 
    text.split("").map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
  );

  useEffect(() => {
    let iteration = 0;
    const maxIterations = text.length;
    
    const interval = setInterval(() => {
      setDisplayText((prev) =>
        text
          .split("")
          .map((char, index) => {
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (iteration >= maxIterations) {
        clearInterval(interval);
      }

      // Faster reveal: reveal ~2 characters per frame if needed, or at least 1 every few frames
      // Adjusted to be snappy but still have the scramble effect
      iteration += maxIterations / (duration * 60); 
    }, 20);

    return () => clearInterval(interval);
  }, [text, duration]);

  return (
    <span className={cn("inline-block font-mono min-w-[1ch]", className)}>
      {displayText}
    </span>
  );
}
