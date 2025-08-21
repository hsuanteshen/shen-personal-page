// scripts/build-content.mjs
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR   = process.env.OUTPUT_DIR || '.'; // '.' 或 'docs'
const SITE_URL  = process.env.SITE_URL || 'https://hsuanteshen.github.io/shen-personal-page';

await mkdir(OUT_DIR, { recursive: true });

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
    if (val.includes(',')) val = val.split(',').map(s=>s.trim());
    // 支援淺層 dotted key（例如 links.repo -> { links: { repo: ... } }）
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
  let slug = name.replace(/\.mdx?$/,'').replace(/\.md$/,'');
  let date = null;
  const m = slug.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if(m){ date = `${m[1]}-${m[2]}-${m[3]}`; slug = m[4]; }
  return { slug, date };
}

async function buildIndex(dir, outName, mapItem){
  try{
    const files = (await readdir(dir)).filter(f=>/\.mdx?$/.test(f));
    const items = [];
    for(const name of files){
      const raw = await readFile(path.join(dir, name), 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      const nd = nameToSlugDate(name);
      items.push(mapItem({ name, meta, body, nd }));
    }
    items.sort((a,b)=> new Date(b.date||0) - new Date(a.date||0));
    const outPath = path.join(OUT_DIR, outName);
    await writeFile(outPath, JSON.stringify(items, null, 2), 'utf8');
    console.log(`Wrote ${outName} with ${items.length} items`);
  }catch(e){
    console.warn(`Skip ${dir} (${e.message})`);
  }
}

function firstTextLine(s){ return (s.split('\n').find(l=>l.trim())||'').slice(0,140)+'…'; }

await buildIndex('posts', 'blog.index.json', ({name, meta, body, nd})=>{
  return {
    slug: nd.slug, file: name,
    title: meta.title || nd.slug,
    date:  meta.date || nd.date || null,
    summary: meta.summary || firstTextLine(body)
  };
});

await buildIndex('projects', 'projects.index.json', ({name, meta, body, nd})=>{
  return {
    slug: nd.slug, file: name,
    title: meta.title || nd.slug,
    date:  meta.date || nd.date || null,
    status: Array.isArray(meta.status) ? meta.status[0] : meta.status || '—',
    summary: meta.summary || firstTextLine(body),
    tags: meta.tags || [],
    cover: meta.cover || null,
    repo: meta.repo || null
  };
});

await buildIndex('papers', 'papers.index.json', ({name, meta, body, nd})=>{
  return {
    slug: nd.slug, file: name,
    title: meta.title || nd.slug,
    date:  meta.date || nd.date || null,
    year:  meta.year || (meta.date ? String(meta.date).slice(0,4) : null),
    venue: meta.venue || null,
    authors: meta.authors || [],
    doi:   meta.doi || null,
    pdf:   meta.pdf || null,
    summary: meta.summary || firstTextLine(body),
    tags: meta.tags || []
  };
});

// 簡單 RSS（只給 Blog）
function iso(d){ return new Date(d).toISOString(); }
try{
  const blog = JSON.parse(await readFile(path.join(OUT_DIR,'blog.index.json'), 'utf8'));
  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"><channel>
<title>Shen — Blog</title>
<link>${SITE_URL}</link>
<description>Personal notes</description>
<lastBuildDate>${iso(new Date())}</lastBuildDate>
${blog.map(p=>`
<item>
<title><![CDATA[${p.title}]]></title>
<link>${SITE_URL}/#/blog/${p.slug}</link>
<guid>${SITE_URL}/#/blog/${p.slug}</guid>
<pubDate>${new Date(p.date||Date.now()).toUTCString()}</pubDate>
<description><![CDATA[${p.summary||''}]]></description>
</item>`).join('')}
</channel></rss>`;
  await writeFile(path.join(OUT_DIR,'rss.xml'), rss.trim(), 'utf8');
  console.log('Wrote rss.xml');
}catch(e){
  console.warn('RSS skipped:', e.message);
}
