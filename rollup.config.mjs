import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");

import typescript from "rollup-plugin-typescript2";

export default {
    input: {
        main: "./src/index.ts"
    },
    output: [
        {
            dir: "dist",
            entryFileNames: "[name].mjs",
            format: "esm",
            preserveModules: true
        },
        {
            dir: "dist",
            entryFileNames: "[name].js",
            format: "cjs",
            preserveModules: true
        }
    ],
    plugins: [
        typescript({
            // Use our own version of TypeScript, rather than the one bundled with the plugin:
            typescript: require("typescript")
        })
    ],
    external: [...Object.keys(pkg.dependencies)],
};