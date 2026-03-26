import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        include: ["frontend/static/js/**/__tests__/**/*.test.js"],
        setupFiles: ["frontend/static/js/__tests__/setup.js"],
        globals: true,
    },
});
