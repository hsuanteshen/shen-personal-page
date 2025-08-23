// scripts/build-content.mjs
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

// --------- 可調參數（也可用環境變數覆蓋）---------
const POSTS_DIR    = process.env.POSTS_DIR    || 'posts';
const PROJECTS_DIR = process.env.PROJECTS_DIR || 'projects';
const PAPERS_DIR   = process.env.PAPERS_DIR   || 'papers';

const OUT_DIR  = process.env.OUTPUT_DIR || '.'; // '.' 或 'docs'
const SITE_URL = process.env.SITE_URL   || 'https://hsuanteshen.github.io/shen-personal-page';

// -------------------------------------------------
await mkdir(OUT_DIR, { recursive: true });

// 小工具
const exists = async (p) => !!(await stat(p).catch(()=>null));
const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    if (!v.trim()) return [];
    return v.split(',').map(s=>s.trim()).filter(Boolean);
  }
  if (v == null) return [];
  return [v];
};
const iso = (d) => new Date(d).toISOString();
const firstTextLine = (s) => (s.split('\n').find(l=>l.trim())||'').slice(0,140)+'…';

function parseFrontmatter(text){
  if (!text.startsWith('---')) return { meta:{}, body:text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { meta:{}, body:text };
  const fm = text.slice(3, end).trim();
  const meta = {};
  fm.split(/\r?\n/).forEach(line=>{
    const m = line.match(/^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
    if(!m) return;
    const key = m[1].trim();
    let val = m[2].trim().replace(/^["']|["']$/g,'');
    // 簡易型別與陣列處理
    if (/^\d+$/.test(val)) val = Number(val);
    // 先不急著 split，最後統一用 toArray() 處理
    const parts = key.split('.');
    let cur = meta;
    while(parts.length > 1){
      const k = parts.shift();
      cur[k] = cur[k] || {};
      cur = cur[k];
    }
    cur[parts[0]] = val;
  });
  const body = text.slice(end+4).trim();
  return { meta, body };
}

function nameToSlugDate(name){
  let slug = name.replace(/\.mdx?$/,'');
  let date = null;
  const m = slug.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if(m){ date = `${m[1]}-${m[2]}-${m[3]}`; slug = m[4]; }
  return { slug, date };
}

async function buildIndex(dir, outName, mapItem){
  if (!(await exists(dir))) {
    console.warn(`Skip ${dir} (directory not found)`);
    return { items: [], outPath: path.join(OUT_DIR, outName) };
  }
  try{
    const files = (await readdir(dir)).filter(f=>/\.(md|mdx)$/i.test(f) && !f.startsWith('_'));
    const items = [];
    const slugs = new Set();

    for(const name of files){
      const raw = await readFile(path.join(dir, name), 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      if (String(meta.draft).toLowerCase() === 'true') {
        console.log(`- draft skipped: ${name}`);
        continue;
      }
      const nd = nameToSlugDate(name);

      // 正規化欄位
      if (meta.tags)    meta.tags = toArray(meta.tags);
      if (meta.authors) meta.authors = toArray(meta.authors);

      const rec = mapItem({ name, meta, body, nd });
      // 補 slug
      rec.slug = (meta.slug || rec.slug || nd.slug || '').toString().trim();
      if (!rec.slug){
        console.warn(`! missing slug, fallback to file stem: ${name}`);
        rec.slug = nd.slug;
      }
      // 重複 slug 警告
      if (slugs.has(rec.slug)) {
        console.warn(`! duplicate slug detected: "${rec.slug}" from ${name}`);
      }
      slugs.add(rec.slug);

      items.push(rec);
    }

    items.sort((a,b)=> new Date(b.date||0) - new Date(a.date||0));
    const outPath = path.join(OUT_DIR, outName);
    await writeFile(outPath, JSON.stringify(items, null, 2), 'utf8');
    console.log(`Wrote ${outName} with ${items.length} items`);
    return { items, outPath };
  }catch(e){
    console.warn(`Skip ${dir} (${e.message})`);
    return { items: [], outPath: path.join(OUT_DIR, outName) };
  }
}

// --------- 建三個索引 ---------

// ---------- Blog：遞迴掃描 + topics ----------

// 只給 Blog 用的遞迴列檔（回傳相對於 POSTS_DIR 的檔名，例如 "number-theory/2025-08-18-schur.md"）
import { readdir as _readdir } from 'node:fs/promises';
async function listMdFilesRecursive(root) {
  const out = [];
  async function walk(dir, prefix = "") {
    const entries = await _readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('_')) continue; // 忽略底線檔案/資料夾
      const full = path.join(dir, e.name);
      const rel  = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) {
        await walk(full, rel);
      } else if (/\.(md|mdx)$/i.test(e.name)) {
        out.push(rel);
      }
    }
  }
  if (!(await exists(root))) return [];
  await walk(root);
  return out;
}

// 1) 產生 blog.index.json（遞迴 posts/）
let blogItems = [];
try {
  const files = await listMdFilesRecursive(POSTS_DIR); // ← 改用遞迴
  const items = [];
  const slugs = new Set();

  for (const relName of files) {
    const fullPath = path.join(POSTS_DIR, relName);
    const raw = await readFile(fullPath, 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    if (String(meta.draft).toLowerCase() === 'true') {
      console.log(`- draft skipped: ${relName}`);
      continue;
    }
    // 取得 slug/date（從檔名尾段判斷）
    const stem = relName.split('/').pop();
    const nd   = nameToSlugDate(stem);

    // topic 來源：frontmatter topic > 第一層資料夾名稱 > misc
    const dirPart  = relName.includes('/') ? relName.split('/')[0] : null;
    const topicRaw = meta.topic || dirPart || 'misc';
    const topicSlug = String(topicRaw).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'misc';
    const topicName = meta.topic_name || (String(topicRaw)[0]?.toUpperCase() + String(topicRaw).slice(1));

    // 正規化欄位
    if (meta.tags)    meta.tags = toArray(meta.tags);
    if (meta.authors) meta.authors = toArray(meta.authors);

    const rec = {
      slug: (meta.slug || nd.slug || '').toString().trim(),
      file: relName, // 保留相對路徑，前端 fetch(`posts/${file}`)
      title: meta.title || nd.slug,
      date:  meta.date || nd.date || null,
      summary: meta.summary || firstTextLine(body),
      topic: { slug: topicSlug, name: topicName },
      cover: meta.cover || null
    };
    if (!rec.slug) {
      console.warn(`! missing slug, fallback to file stem: ${relName}`);
      rec.slug = nd.slug;
    }
    if (slugs.has(rec.slug)) {
      console.warn(`! duplicate slug detected: "${rec.slug}" from ${relName}`);
    }
    slugs.add(rec.slug);
    items.push(rec);
  }

  items.sort((a,b)=> new Date(b.date||0) - new Date(a.date||0));
  await writeFile(path.join(OUT_DIR, 'blog.index.json'), JSON.stringify(items, null, 2), 'utf8');
  console.log(`Wrote blog.index.json with ${items.length} items`);
  blogItems = items;
} catch (e) {
  console.warn(`Skip ${POSTS_DIR} (${e.message})`);
  blogItems = [];
}

// 2) 由 blog.index.json 聚合產出 blog.topics.json
try {
  const topicsMap = new Map();
  for (const p of blogItems) {
    const key = p.topic?.slug || 'misc';
    const cur = topicsMap.get(key) || { slug:key, name:p.topic?.name || 'Misc', count:0, cover:null, latestDate:null };
    cur.count += 1;
    if (!cur.cover && p.cover) cur.cover = p.cover;
    if (!cur.latestDate || new Date(p.date||0) > new Date(cur.latestDate||0)) cur.latestDate = p.date;
    topicsMap.set(key, cur);
  }
  const topics = Array.from(topicsMap.values()).sort(
    (a,b)=> (b.count - a.count) || (new Date(b.latestDate||0) - new Date(a.latestDate||0))
  );
  await writeFile(path.join(OUT_DIR,'blog.topics.json'), JSON.stringify(topics, null, 2), 'utf8');
  console.log(`Wrote blog.topics.json with ${topics.length} topics`);
} catch (e) {
  console.warn('Topics build skipped:', e.message);
}

// Projects
const projectsBuild = await buildIndex(PROJECTS_DIR, 'projects.index.json', ({name, meta, body, nd})=>{
  return {
    slug: nd.slug,
    file: name,
    title: meta.title || nd.slug,
    date:  meta.date || nd.date || null,
    status: Array.isArray(meta.status) ? meta.status[0] : (meta.status || '—'),
    summary: meta.summary || firstTextLine(body),
    tags: toArray(meta.tags),
    cover: meta.cover || null,
    repo: meta.repo || null
  };
});

// Papers
const papersBuild = await buildIndex(PAPERS_DIR, 'papers.index.json', ({name, meta, body, nd})=>{
  const yearFromDate = meta.date ? String(meta.date).slice(0,4) : null;
  return {
    slug: nd.slug,
    file: name,
    title: meta.title || nd.slug,
    date:  meta.date || nd.date || null,
    year:  meta.year || yearFromDate,
    venue: meta.venue || null,
    authors: toArray(meta.authors),
    doi:   meta.doi || null,
    pdf:   meta.pdf || null,
    summary: meta.summary || firstTextLine(body),
    tags: toArray(meta.tags)
  };
});

// --------- 簡單 RSS（只給 Blog）---------
try{
  const blogItems = blogBuild.items;
  if (blogItems.length === 0){
    console.warn('RSS skipped: no blog posts');
  } else {
    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"><channel>
  <title>Shen — Blog</title>
  <link>${SITE_URL}</link>
  <description>Personal notes</description>
  <lastBuildDate>${iso(new Date())}</lastBuildDate>
  ${blogItems.map(p=>`
  <item>
    <title><![CDATA[${p.title}]]></title>
    <link>${SITE_URL}/#/blog/${p.slug}</link>
    <guid>${SITE_URL}/#/blog/${p.slug}</guid>
    <pubDate>${new Date(p.date||Date.now()).toUTCString()}</pubDate>
    <description><![CDATA[${p.summary||''}]]></description>
  </item>`).join('')}
</channel></rss>`.trim();
    await writeFile(path.join(OUT_DIR,'rss.xml'), rss, 'utf8');
    console.log('Wrote rss.xml');
  }
}catch(e){
  console.warn('RSS skipped:', e.message);
}




