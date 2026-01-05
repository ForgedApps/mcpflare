import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Note: For static export (GitHub Pages), uncomment below and disable API search
  // output: 'export',
  // images: { unoptimized: true },
  // trailingSlash: true,
};

export default withMDX(config);



