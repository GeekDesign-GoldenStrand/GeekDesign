const isProd = process.env.NODE_ENV === "production";

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    ...(isProd ? { cssnano: { preset: "default" } } : {}),
  },
};

export default config;
