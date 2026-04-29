# React + Vite Context for Tech Xpress (SOA University Railways Division)

## 1. Project Overview
This project is "Tech Xpress | SOA University Railways Division". It uses a highly stylized, "Vande Bharat Aesthetic" which merges the legacy of Indian Railways with high-speed modern transit. The visual language is high-tech corporate, utilizing sharp edges, track-oriented linear motifs, and a distinct "nose-cone" accent on components.

## 2. Tech Stack
- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **Icons**: Material Symbols Outlined (Google Fonts)
- **Typography**: 
  - `Space Grotesk` (Headings, Labels) 
  - `Inter` (Body Text)

## 3. Design System Tokens (tailwind.config.js)

When initializing the Vite project, update the tailwind config with the following:

```javascript
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
```

## 4. Global CSS (`src/index.css`)

Add these global utility classes needed to achieve the "machined", rail-inspired look:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .track-divider {
    position: relative;
    height: 2px;
    background: repeating-linear-gradient(90deg, #00408B, #00408B 10px, transparent 10px, transparent 20px);
  }
  .track-divider::before, .track-divider::after {
    content: '';
    position: absolute;
    top: -3px;
    width: 8px;
    height: 8px;
    background: #00408B;
    transform: rotate(45deg);
    border-radius: 0;
  }
  .track-divider::before { left: 0; }
  .track-divider::after { right: 0; }

  .machined-card {
    box-shadow: 4px 4px 0px 0px rgba(0, 64, 139, 0.1);
    border: 1px solid #e2e2e5;
  }

  .nose-cone {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 20% 100%);
  }

  .nose-cone-accent {
    clip-path: polygon(100% 0, 100% 100%, 0 0);
    background: #00408B;
    width: 40px;
    height: 40px;
    position: absolute;
    top: 0;
    right: 0;
  }
  
  .pulse-red {
    box-shadow: 0 0 0 0 rgba(186, 26, 26, 0.7);
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(186, 26, 26, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(186, 26, 26, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(186, 26, 26, 0); }
  }
}

body {
  min-height: max(884px, 100dvh);
}
```

## 5. Core Reusable Components

1.  **`TopAppBar`**: 
    - Sticky top navigation with the train icon, "TECH XPRESS" title, navigation links, and user profile picture.
    - Uses bottom double-borders (`border-b-4 border-double border-[#00408B]`) and sharp shadows to look like a machined component.

2.  **`NavigationDrawer` (Sidebar)**:
    - Fixed left sidebar for desktop (`lg:flex`) titled "CONTROL CENTER".
    - Active states highlighted with a cyan left-border and `bg-[#00408B]` for primary focus.

3.  **`Footer`**:
    - Bottom fixed component with `bg-[#00408B]`, white text, and double top borders. Includes copyright and support links.

4.  **`TrackDivider`**:
    - A custom `<hr />` substitute using the `.track-divider` utility class.

5.  **`MachinedCard`**:
    - A sharp-edged card wrapper applying `.machined-card` and `.nose-cone` (or `.nose-cone-accent`) utilities.

## 6. Key Screens & Phase Logic to Scaffold

### Phase 1: Individual Registration (Round 1)
Create a registration page titled "Campus Registration" (`/register`) for individual applicants. The form must capture:
- Full Name
- Campus/University Name
- Registration Number (ID)
- Email Address
- Phone Number
- Domain/Theme Selection: (A dropdown of specific hackathon tracks).

### Phase 2: Shortlisting & Team Formation (Round 2)
Only shortlisted candidates proceed to this dashboard (`/crew`).
- **Status Check**: Users can view a list of all shortlisted participants.
- **Team Building Logic**:
  - **Action**: Shortlisted users can either Create a Team or Join a Team via the platform.
  - **Constraints**: Team members must be from the same selected Domain.
  - **Diversity Rule**: At least one woman per team is mandatory.
  - **Locking Mechanism**: Once a team is finalized, the leader marks it as "Done". After this, no further membership changes are allowed.
- **Project Management**:
  - Teams can submit and edit their Problem Statement.
  - **Constraint**: The Problem Statement must remain within the originally selected Domain; no switching domains is permitted.

### Phase 3: Final Evaluation
- **Leaderboard** (`/leaderboard`): A dynamic page that displays the rankings and updates in real-time as the final round progresses.

## 7. UI / Layout Principles
-   **Fixed-Column Grid**: Uses the Tailwind grid (`grid-cols-12` on larger screens).
-   **High-Tech Corporate**: 0px border radiuses. Sharp, aggressive geometry instead of soft rounded corners.
-   **Elevation via Linear Shadows**: `box-shadow: 4px 4px 0px 0px rgba(0, 64, 139, 0.1)`. No blurry ambient glows.
-   **Typography Application**: `font-headline-*` and `font-label-*` are almost exclusively used for uppercase, highly tracked UI elements. `font-body-*` is reserved for standard sentence-case text.
