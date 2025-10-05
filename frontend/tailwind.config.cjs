module.exports = {
  // include both purge and content to cover v3/v4 differences
  purge: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    "bg-white","shadow","shadow-lg","rounded-xl","rounded-md","p-4","px-3","px-4","py-1",
    "text-indigo-600","hover:underline","hover:shadow-lg","space-x-2","space-y-4","text-lg",
    "font-semibold","min-h-screen","bg-gray-100","text-gray-900","font-sans"
  ],
  theme: { extend: {} },
  plugins: [],
};
