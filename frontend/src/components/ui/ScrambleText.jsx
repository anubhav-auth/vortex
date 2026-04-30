import { useEffect, useState } from "react";
import { cn } from "../../utils/cn";

const CHARS = "!<>-_\\\\/[]{}—=+*^?#________";

export function ScrambleText({ text, duration = 1.2, className }) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let iteration = 0;
    let interval = null;

    const startAnimation = () => {
      interval = setInterval(() => {
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

        if (iteration >= text.length) {
          clearInterval(interval);
        }

        iteration += 1 / (duration * 20);
      }, 30);
    };

    startAnimation();
    return () => clearInterval(interval);
  }, [text, duration]);

  return <span className={cn("inline-block", className)}>{displayText}</span>;
}
