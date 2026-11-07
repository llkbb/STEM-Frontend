import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      // Word creates locked temporary files during document rendering.
      ignored: ['**/tmp/**', '**/output/**', '**/docs/**', '**/*.pdf', '**/*.docx'],
    },
  },
});
