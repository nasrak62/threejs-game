import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
    plugins: [glsl(), wasm()],
    base: '/threejs-game/',
});
