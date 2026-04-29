/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        bg: "var(--bg)",
        card: "var(--card)",
        muted: "var(--muted)",
        bubble: "var(--bubble)",
        danger: "var(--danger)",
        success: "var(--success)",
        done: "var(--done)",
      }
    },
  },
  plugins: [],
};
