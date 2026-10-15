// Writes an update entry with the author's text byte-for-byte.
//   node scripts/new-update.mjs --project ReBot --text-file /path/body.txt
//        [--mood win|loss|progress|stuck|idea] [--tags a,b] [--title "..."]
//        [--date YYYY-MM-DD] [--media path1,path2] [--draft]
// The body is the text file's content, untouched (only a trailing newline is
// ensured). Media is copied to public/media/updates/<id>/ and appended as
// markdown images after the text. Prints the file path and a verbatim check.
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
const flag = (k) => argv.includes(`--${k}`);

const project = opt('project');
const textFile = opt('text-file');
if (!project || !textFile) {
  console.error('required: --project <name> --text-file <path>');
  process.exit(2);
}
const MOODS = ['win', 'loss', 'progress', 'stuck', 'idea'];
const mood = opt('mood');
if (mood && !MOODS.includes(mood)) { console.error(`--mood must be one of ${MOODS.join(', ')}`); process.exit(2); }

const slugify = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const date = opt('date') ?? new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
const dir = 'src/content/updates';
fs.mkdirSync(dir, { recursive: true });
let id = `${date}-${slugify(project)}`;
for (let n = 2; fs.existsSync(path.join(dir, `${id}.md`)); n++) id = `${date}-${slugify(project)}-${n}`;

const raw = fs.readFileSync(textFile, 'utf8');
const body = raw.endsWith('\n') ? raw : `${raw}\n`;

const q = (s) => JSON.stringify(s); // YAML accepts JSON strings
const tags = (opt('tags') ?? '').split(',').map((t) => t.trim()).filter(Boolean);
const fm = [
  '---',
  'type: update',
  `project: ${q(project)}`,
  `date: ${date}`,
  opt('title') && `title: ${q(opt('title'))}`,
  mood && `mood: ${mood}`,
  tags.length && `tags: [${tags.map(q).join(', ')}]`,
  flag('draft') && 'draft: true',
  '---',
  '',
].filter((l) => l !== undefined && l !== false && l !== 0).join('\n');

let media = '';
const files = (opt('media') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
if (files.length) {
  const pub = path.join('public/media/updates', id);
  fs.mkdirSync(pub, { recursive: true });
  media = '\n' + files.map((f) => {
    const name = slugify(path.parse(f).name) + path.extname(f).toLowerCase();
    fs.copyFileSync(f, path.join(pub, name));
    return `![](/media/updates/${id}/${name})\n`;
  }).join('\n');
}

const file = path.join(dir, `${id}.md`);
fs.writeFileSync(file, fm + body + media);

// Verbatim check: the text between frontmatter and media must equal the input.
const written = fs.readFileSync(file, 'utf8');
const ok = written.slice(fm.length, fm.length + body.length) === body;
console.log(file);
console.log(ok ? 'verbatim: ok' : 'verbatim: MISMATCH');
process.exit(ok ? 0 : 1);
