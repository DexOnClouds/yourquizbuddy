export default function cloudflareLoader({ src, width, quality }) {
  if (src.startsWith('https://')) return src;
  if (src.startsWith('http://')) return src;
  return `${src}?w=${width}&q=${quality || 75}`;
}
