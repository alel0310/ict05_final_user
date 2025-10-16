// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx}",        // ← JSX로 바꿨으니 jsx 포함!
  ],
  theme: {
    extend: {
      colors: {
        // UI 토큰(배경/테두리 등)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // 우리 커스텀 컬러
        "kpi-red": "#FF6B6B",
        "kpi-orange": "#F77F00",
        "kpi-green": "#06D6A0",
        "kpi-purple": "#9D4EDD",
        "navy-sidebar": "#0F1E34",
        "light-gray": "#F3F4F6",
        "dark-gray": "#6B7280",
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
