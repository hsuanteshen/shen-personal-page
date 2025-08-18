import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const POSTS_DIR = 'posts';
const OUT_INDEX = 'blog.index.json';
const OUT_RSS = 'rss.xml';
const SITE_URL = process.env.SITE_URL || 'https://github.com/hsuanteshen/shen-personal-page';

function parseFrontmatter(text){
  if(text.startsWith('---')){
    const end = text.indexOf('\n---', 3);
    if(end !== -1){
      const fm = text.slice(3, end).trim();
      const meta = {};
      fm.split(/\r?\n/).forEach(line=>{
        const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
        if(m){ meta[m[1]] = m[2].replace(/^["']|["']$/g,''); }
      });
      return { meta, body: text.slice(end+4).trim() };
    }
  }
  return { meta:{}, body:text };
}
function nameToSlugDate(name){
  let slug = name.replace(/\.mdx?$/,'');
  let date = null;
  const m = slug.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if(m){ date = `${m[1]}-${m[2]}-${m[3]}`; slug = m[4]; }
  return { slug, date };
}
function iso(d){ return new Date(d).toISOString(); }

const files = (await readdir(POSTS_DIR)).filter(f=>/\.mdx?$/.test(f));
const items = [];
for(const name of files){
  const raw = await readFile(path.join(POSTS_DIR, name), 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const nd = nameToSlugDate(name);
  const title = meta.title || nd.slug;
  const date  = meta.date || nd.date || new Date().toISOString().slice(0,10);
  const summary = meta.summary || (body.split('\n').find(l=>l.trim())||'').slice(0,140)+'…';
  items.push({ slug: nd.slug, title, date, summary, file: name });
}
items.sort((a,b)=> new Date(b.date) - new Date(a.date));
await writeFile(OUT_INDEX, JSON.stringify(items, null, 2), 'utf8');

// RSS
const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Shen — Blog</title>
  <link>${SITE_URL}</link>
  <description>Personal notes</description>
  <lastBuildDate>${iso(new Date())}</lastBuildDate>
  ${items.map(p=>`
  <item>
    <title><![CDATA[${p.title}]]></title>
    <link>${SITE_URL}/#/blog/${p.slug}</link>
    <guid>${SITE_URL}/#/blog/${p.slug}</guid>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <description><![CDATA[${p.summary}]]></description>
  </item>`).join('')}
</channel>
</rss>`;
await writeFile(OUT_RSS, rss.trim(), 'utf8');
console.log(`Wrote ${OUT_INDEX} & ${OUT_RSS} with ${items.length} posts`);