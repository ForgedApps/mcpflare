import { defineConfig, defineCollections } from 'fumadocs-mdx/config';

export const docs = defineCollections({
  type: 'doc',
  dir: 'content/docs',
});

export const meta = defineCollections({
  type: 'meta',
  dir: 'content/docs',
});

export default defineConfig();
