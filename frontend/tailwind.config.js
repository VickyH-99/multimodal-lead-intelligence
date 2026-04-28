export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                ink: "#0F172A",
                canvas: "#F4F7FB",
                primary: "#0B5FFF",
                accent: "#0F766E",
                warning: "#D97706",
                surface: "#FFFFFF",
                line: "#D7E2F0"
            },
            boxShadow: {
                panel: "0 18px 45px rgba(15, 23, 42, 0.08)"
            },
            fontFamily: {
                sans: ["IBM Plex Sans", "Segoe UI", "system-ui", "sans-serif"],
                mono: ["IBM Plex Mono", "SFMono-Regular", "monospace"]
            },
            backgroundImage: {
                "mesh-grid": "radial-gradient(circle at top left, rgba(11,95,255,0.14), transparent 38%), radial-gradient(circle at top right, rgba(15,118,110,0.14), transparent 30%), linear-gradient(180deg, #F8FBFF 0%, #EEF4FB 100%)"
            }
        }
    },
    plugins: []
};
