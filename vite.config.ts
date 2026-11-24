import { defineConfig } from "vite";

const codespace = process.env.CODESPACE_NAME;
const forwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: codespace && forwardingDomain ? [`${codespace}-5173.${forwardingDomain}`] : [],
  },
});
