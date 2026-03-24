import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			injectRegister: "autoUpdate",
			manifest: {
				name: "نظام إدارة طوارئ الحوادث",
				short_name: "طوارئ الإسعاف",
				description: "نظام ذكي لإدارة طوارئ الحوادث وتوجيه سيارات الإسعاف",
				theme_color: "#dc2626",
				background_color: "#111827",
				display: "standalone",
				display_override: ["window-controls-overlay"],
				lang: "ar",
				dir: "rtl",
				icons: [
					{
						src: "ambulance-icon.svg",
						sizes: "any",
						type: "image/svg+xml",
						purpose: "any maskable",
					},
					{
						src: "ambulance-icon.svg",
						sizes: "192x192 512x512",
						type: "image/svg+xml",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "google-fonts-cache",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "gstatic-fonts-cache",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
			},
		}),
	],
});
