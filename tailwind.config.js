import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './lib/**/*.{js,ts,jsx,tsx,mdx}',
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Sora', ...defaultTheme.fontFamily.sans],
                display: ['"Space Grotesk"', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                moka: {
                    bg: '#0F0F0F',
                    card: '#1A1A1A',
                    line: '#2C2C2C',
                    ink: '#F5F5F5',
                    muted: '#BFAF86',
                    primary: '#D4AF37',
                    accent: '#C79B2E',
                    success: '#59A36F',
                    soft: '#232323',
                },
            },
            boxShadow: {
                card: '0 24px 44px -26px rgba(0, 0, 0, 0.72)',
            },
        },
    },

    plugins: [forms],
};
