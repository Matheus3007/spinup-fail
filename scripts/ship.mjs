// Ships a draft post (both languages): draft: true -> false, publishedAt -> today.
//   node scripts/ship.mjs <en-slug | translationKey> [--keep-date]
// Matches every post whose file id or translationKey equals the argument.
import fs from 'node:fs';
import path from 'node:path';

const [key] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const keepDate = process.argv.includes('--keep-date');
if (!key) { console.error('usage: node scripts/ship.mjs <slug|translationKey>'); process.exit(2); }

const dir = 'src/content/posts';
const today = new Date().toLocaleDateString('en-CA');
const fmOf = (src) => src.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
const field = (fm, k) => fm.match(new RegExp(`^${k}:\\s*["']?([^"'\\n]+)`, 'm'))?.[1]?.trim();

const en = path.join(dir, `${key}.mdx`);
const enKey = fs.existsSync(en) ? field(fmOf(fs.readFileSync(en, 'utf8')), 'translationKey') : undefined;

const hits = fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f)).filter((f) => {
  const fm = fmOf(fs.readFileSync(path.join(dir, f), 'utf8'));
  const id = f.replace(/\.mdx?$/, '');
  const tk = field(fm, 'translationKey');
  return id === key || tk === key || (enKey && tk === enKey);
});
if (!hits.length) { console.error(`no post matches "${key}"`); process.exit(1); }

for (const f of hits) {
  const p = path.join(dir, f);
  let src = fs.readFileSync(p, 'utf8');
  const fm = fmOf(src);
  let next = fm.replace(/^draft:\s*true\s*$/m, 'draft: false');
  if (!keepDate) next = next.replace(/^publishedAt:.*$/m, `publishedAt: ${today}`);
  src = src.replace(fm, next);
  fs.writeFileSync(p, src);
  console.log(`shipped ${p}${next === fm ? ' (was already live)' : ''}`);
}
