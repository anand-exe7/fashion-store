// One-off: shrink the big photos already in the 'images' bucket.
//
//   node scripts/compress-images.mjs                 dry run: lists what it WOULD do, changes nothing
//   node scripts/compress-images.mjs --apply         uploads WebP copies and repoints the database
//   node scripts/compress-images.mjs --apply --delete-old   also removes the old originals
//   (add --delete-orphans to also remove big files nothing in the database points to)
//   Size knobs: --width=1080 --quality=72 --format=webp|avif  (these are the defaults)
//
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local. Back up the database first
// (Supabase -> Database -> Backups). Originals are only deleted with --delete-old,
// and only after the new copy is uploaded and every row has been repointed.
import fs from 'fs';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const argv = process.argv.slice(2);
const args = new Set(argv);
const opt = (name, dflt) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? dflt;
const WIDTH = Number(opt('width', 1080));
const QUALITY = Number(opt('quality', 72));
const FORMAT = opt('format', 'webp');
if (!['webp', 'avif'].includes(FORMAT)) throw new Error('--format must be webp or avif');
const APPLY = args.has('--apply');
const DELETE_OLD = args.has('--delete-old');
const DELETE_ORPHANS = args.has('--delete-orphans');
const MIN_BYTES = 300 * 1024; // leave anything already small alone
const BUCKET = 'images';
const SKIP_DIRS = new Set(['category-images', 'settings']); // category photo = newest file in folder; settings are JSON

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const pub = (path) => sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

async function listAll(prefix = '') {
  const out = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await sb.storage.from(BUCKET).list(prefix, { limit: 100, offset });
    if (error) throw error;
    for (const f of data) {
      const path = prefix ? `${prefix}/${f.name}` : f.name;
      if (f.id === null) { if (!SKIP_DIRS.has(f.name)) out.push(...(await listAll(path))); }
      else out.push({ path, size: f.metadata?.size ?? 0, type: f.metadata?.mimetype ?? '' });
    }
    if (data.length < 100) break;
  }
  return out;
}

const REFS = [['products', 'image'], ['product_images', 'url'], ['reviews', 'image_url']];
const kb = (n) => `${Math.round(n / 1024)} KB`;

const files = (await listAll()).filter((f) => /^image\/(png|jpe?g|webp)$/.test(f.type) && f.size >= MIN_BYTES);
files.sort((a, b) => b.size - a.size);
console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} (${FORMAT}, max ${WIDTH}px, q${QUALITY}): ${files.length} image(s) at or above ${kb(MIN_BYTES)}\n`);

let saved = 0;
for (const f of files) {
  const url = pub(f.path);
  const used = [];
  for (const [table, col] of REFS) {
    const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true }).eq(col, url);
    if (error) { console.log(`  ! could not check ${table}.${col}: ${error.message}`); used.push(['?', 1]); }
    else if (count) used.push([table, count]);
  }
  const tag = used.length ? `used by ${used.map(([t, c]) => `${t}(${c})`).join(', ')}` : 'ORPHAN (nothing points to it)';
  console.log(`${kb(f.size).padStart(8)}  ${f.path}  -> ${tag}`);

  if (!APPLY) continue;
  if (!used.length) {
    if (DELETE_ORPHANS) { await sb.storage.from(BUCKET).remove([f.path]); console.log('          deleted orphan'); saved += f.size; }
    continue;
  }
  if (used.some(([t]) => t === '?')) { console.log('          skipped (could not verify usage)'); continue; }

  const { data: blob, error: dlErr } = await sb.storage.from(BUCKET).download(f.path);
  if (dlErr) { console.log(`          skipped: download failed (${dlErr.message})`); continue; }
  const out = await sharp(Buffer.from(await blob.arrayBuffer())).rotate().resize({ width: WIDTH, height: WIDTH, fit: 'inside', withoutEnlargement: true }).toFormat(FORMAT, { quality: QUALITY }).toBuffer();
  if (out.length >= f.size) { console.log('          skipped: not smaller'); continue; }

  const newPath = f.path.replace(/\.[^./]+$/, '') + `_c.${FORMAT}`;
  const { error: upErr } = await sb.storage.from(BUCKET).upload(newPath, out, { contentType: `image/${FORMAT}`, cacheControl: '31536000', upsert: false });
  if (upErr && !/exists/i.test(upErr.message)) { console.log(`          skipped: upload failed (${upErr.message})`); continue; }

  let ok = true;
  for (const [table, col] of REFS) {
    const { error } = await sb.from(table).update({ [col]: pub(newPath) }).eq(col, url);
    if (error) { ok = false; console.log(`          ! update ${table} failed: ${error.message}`); }
  }
  if (!ok) { console.log('          old file kept (some rows failed to update)'); continue; }
  console.log(`          -> ${newPath} (${kb(out.length)})`);
  if (DELETE_OLD) { await sb.storage.from(BUCKET).remove([f.path]); saved += f.size - out.length; }
}
console.log(APPLY ? `\nDone. Freed about ${kb(saved)}.` : '\nDry run only - nothing changed. Re-run with --apply to do it.');
