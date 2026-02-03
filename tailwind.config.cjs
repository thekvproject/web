/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
				display: ['"Fraunces"', 'serif']
			}
		}
	},
	plugins: []
};
