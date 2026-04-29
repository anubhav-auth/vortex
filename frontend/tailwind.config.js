/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#002b61",
        "primary-container": "#00408b",
        "primary-fixed": "#d8e2ff",
        "primary-fixed-dim": "#adc6ff",
        "on-primary-fixed": "#001a41",
        "on-primary-fixed-variant": "#0a448f",
        "on-primary": "#ffffff",
        "on-primary-container": "#87afff",
        
        "secondary": "#006689",
        "secondary-container": "#5bcaff",
        "secondary-fixed": "#c3e8ff",
        "secondary-fixed-dim": "#78d1ff",
        "on-secondary-fixed": "#001e2c",
        "on-secondary-fixed-variant": "#004c68",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#005371",
        
        "tertiary": "#252e34",
        "tertiary-container": "#3b444a",
        "tertiary-fixed": "#dbe4ec",
        "tertiary-fixed-dim": "#bfc8cf",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#a8b1b8",
        "on-tertiary-fixed": "#141d22",
        "on-tertiary-fixed-variant": "#3f484e",
        
        "background": "#f9f9fc",
        "on-background": "#1a1c1e",
        "surface": "#f9f9fc",
        "surface-variant": "#e2e2e5",
        "surface-dim": "#dadadc",
        "surface-bright": "#f9f9fc",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f6",
        "surface-container": "#eeeef0",
        "surface-container-high": "#e8e8ea",
        "surface-container-highest": "#e2e2e5",
        "surface-tint": "#2f5da9",
        "on-surface": "#1a1c1e",
        "on-surface-variant": "#434751",
        
        "inverse-surface": "#2f3133",
        "inverse-on-surface": "#f0f0f3",
        "inverse-primary": "#adc6ff",
        
        "outline": "#737782",
        "outline-variant": "#c3c6d3",
        
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        "headline-lg": ["Space Grotesk", "sans-serif"],
        "headline-md": ["Space Grotesk", "sans-serif"],
        "headline-sm": ["Space Grotesk", "sans-serif"],
        "label-md": ["Space Grotesk", "sans-serif"],
        "label-sm": ["Space Grotesk", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"]
      },
      fontSize: {
        "headline-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["32px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-sm": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "1.1", letterSpacing: "0.1em", fontWeight: "700" }]
      }
    }
  }
}
