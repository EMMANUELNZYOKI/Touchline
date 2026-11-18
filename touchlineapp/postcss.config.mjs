// The Expo app does not use the web workspace's Tailwind v4 PostCSS pipeline.
// Keeping this config local prevents Vitest from walking up to the parent
// web app config, which depends on @tailwindcss/postcss.
export default {
  plugins: {},
};
