/* =========================
   app.js — fixed & robust
   - 動態載入 Blog / Projects / Papers (Markdown + index.json)
   - 維持原本外觀：Projects 卡片、Papers 標題+PDF/DOI
   - 點標題跳詳頁
   - setHead / afterPostRender / 錯誤護欄
   ========================= */

// ---- SEO helpers
function setHead(title, desc){
  if (title) document.title = title;
  if (typeof desc === 'string' && desc.length){
    let m = document.querySelector('meta[name="description"]');
    if (!m){
      m = document.createElement('meta');
      m.setAttribute('name','description');
      document.head.appendChild(m);
    }
    m.setAttribute('content', desc);
  }
}

// ---- After post render: math + code highlight（若 head 有載 KaTeX/Prism 會自動啟動）
function afterPostRender(){
  const root = document.querySelector('.prose');
  if (!root) return;
  if (window.renderMathInElement){
    renderMathInElement(root, {
      delimiters: [
        {left: "$$", right: "$$", display: true},
        {left: "\\(", right: "\\)", display: false}
      ]
    });
  }
  if (window.Prism){ Prism.highlightAll(); }
}

// ---- Demo DATA（CV/Projects/Papers 用到的靜態資料 & Blog fallback）
const DATA = {
  cv: {
    education: [
      { where:"Leipzig University, Germany", what:"IPSP Honours (in progress)", years:"2025–" },
      { where:"National Chengchi University, Taiwan", what:"B.S. (Suspend)", years:"2023-2025" },
      { where:"Taipei Municipal Chien Kuo High School, Taiwan", what:"High School Diploma", years:"2020-2023" }
    ],
    languages: [
      { lan:"Chinese", how:"Mother Tongue"},
      { lan:"English", how:"Fluent"},
      { lan:"German", how:"Basic"}
    ],
    publications: [
       // { title:"A Constructive Closure-Based Proof of a Schur-Type Partition Theorem", year:2025, link:"#"}
    ],
    awards: [
       // { name:"Project Gnosis Series — in progress" }
    ]
  },
  projects: [
    { title:"Project Gnosis",   status:"Active",      summary:"Number theory × constructive closure proofs; G1–G5 priority." },
    { title:"Project Lucerna",  status:"Research",    summary:"Semantic co-creation & cognitive language system." },
    { title:"Project Eidolon",  status:"Exploration", summary:"Depression × Alzheimer’s × language × neuro." }
  ],
  papers: [
    { title:"A Constructive Closure-Based Proof of a Schur-Type Partition Theorem", year:2025, venue:"Preprint", pdf:"#", doi:null },
  ],
  // 當 blog.index.json 讀不到時的範例
  blogFallback: [
    { slug:"hello-world", title:"Hybrid = Editorial × Cinematic", date:"2025-08-18",
      summary:"為什麼首頁用玻璃、內容頁走雜誌式是最佳解。",
      md:`## The Hybrid Principle

正文採用雜誌式可長讀，首頁以玻璃與景深作點綴，**Shen**。

- 內容頁：窄欄（68–74ch）、行高 1.6–1.75
- 首頁：\`glass\` 卡片 + 微動畫
- 色彩：單色冷調 + 一個點色（accent）

參考：將專案（Gnosis / Lucerna）用 **狀態標籤** 管理，論文頁提供 **PDF / DOI** 連結。
`},
  ]
};

// ---- Markdown → HTML（標題/粗斜體/連結/清單/行內 code）
function mdToHtml(md){
  let h = md.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  h = h
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g,'<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^### (.*)$/gm,'<h3>$1</h3>')
    .replace(/^## (.*)$/gm,'<h2>$1</h2>')
    .replace(/^# (.*)$/gm,'<h1>$1</h1>')
    .replace(/(?:^|\n)-( .*?)(?=\n(?!- )|$)/gs, m=>{
      const items = m.trim().split('\n').map(x=>x.replace(/^- /,'').trim()).map(li=>`<li>${li}</li>`).join('');
      return `<ul>${items}</ul>`;
    })
    .replace(/^(?!<h\d|<ul|<li|<blockquote|<p|<\/)(.+)$/gm,'<p>$1</p>');
  return h;
}

// ---- DOM refs & 基礎保障
function ensureAppRoot(){
  let el = document.getElementById('app');
  if (el) return el;
  const hero = document.querySelector('.hero');
  el = document.createElement('main');
  el.id = 'app';
  el.setAttribute('role','main');
  if (hero) {
    const footer = hero.querySelector('footer');
    hero.insertBefore(el, footer || null);
  } else {
    document.body.appendChild(el);
  }
  return el;
}
const app = ensureAppRoot();
const nav = document.getElementById('nav');

function setActive(hash){
  const links = nav ? nav.querySelectorAll('a') : [];
  links.forEach(a=>{
    const active = a.getAttribute('href')===hash;
    a.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

/* ========= Pages（維持你的外觀） ========= */
function renderHome(){
  setActive('#/');
  app.innerHTML = `
    <section class="container py-20">
      <div class="grid grid-12" style="gap:1.5rem">
        <div style="grid-column:span 7;">
          <div class="glass glass-strong card" data-accent>
            <h1>Simplicitas.</h1>
            <p class="muted mt-2" style="max-width:66ch">
              Hello, this is Shen. (haven't figured out what to write here yet)
            </p>
            <div class="mt-6">
              <a class="btn primary" href="#/projects">Explore Projects</a>
              <a class="btn" style="margin-left:.5rem" href="#/cv">View CV</a>
            </div>
          </div>

          <div class="glass card mt-8">
            <h3>Highlights</h3>
            <div class="list mt-3">
              <div class="item">
                <a href="#/blog/hello-world">Blog — Hybrid = Editorial × Cinematic</a>
                <div class="muted mt-1">2025-08-18</div>
              </div>
              <div class="item"><a href="#/papers">Paper — Schur-type Partition</a></div>
              <div class="item"><a href="#/projects">Project — Gnosis Series</a></div>
            </div>
          </div>
        </div>

        <div style="grid-column:span 5; display:grid; gap:1.25rem; align-content:start">
          <div class="glass card">
            <div class="muted">Now</div>
            <div id="clock" style="font-family:var(--font-display); font-size:1.6rem; margin-top:.25rem">--:--</div>
          </div>

          <div class="glass card">
            <div class="muted">Metrics</div>
            <div class="kpis mt-2">
              <div class="kpi">
                <div class="num">G1–G5</div>
                <div class="muted" style="font-size:.85rem">Gnosis Priority</div>
              </div>
              <div class="kpi">
                <div class="num">CV</div>
                <div class="muted" style="font-size:.85rem">Updated</div>
              </div>
              <div class="kpi">
                <div class="num">Blog</div>
                <div class="muted" style="font-size:.85rem">New Post</div>
              </div>
            </div>
          </div>

          <div class="glass-soft card">
            <div class="muted">Upcoming</div>
            <ul class="mt-2" style="padding-left:1.1rem; margin:0">
              <li>Polish G1 paper intro</li>
              <li>Projects page filters</li>
              <li>CV → PDF export</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  `;
  startClock();
  initParallax();
  setHead('Shen — Home','Shen’s personal page: CV, projects, papers, and blog.');
}

function renderCV(){
  setActive('#/cv');
  const cv = DATA.cv;
  app.innerHTML = `
    <section class="container py-16">
      <article class="prose" aria-labelledby="cv-title">
        <h1 id="cv-title">Curriculum Vitae</h1>
        <h2>Education</h2>
        <ul>
          ${cv.education.map(e=>`<li><strong>${e.where}</strong> — ${e.what} <span class="muted">(${e.years})</span></li>`).join('')}
        </ul>
        <h2>Languages</h2>
        <ul>
          ${cv.languages.map(p=>`<li><strong>${p.lan)</strong> : ${p.how}`).join('')}
        </ul>
        <h2>Publications (selected)</h2>
        <ul>
          ${cv.publications.map(p=>`<li>${p.title} <span class="muted">(${p.year})</span></li>`).join('')}
        </ul>
        <h2>Awards / Notes</h2>
        <ul>${cv.awards.map(a=>`<li>${a.name}</li>`).join('')}</ul>
      </article>
    </section>
  `;
  setHead('Shen — CV','Education, languages, publications, awards.');
}

/* ========= Blog loader ========= */
let __postsIndex = null;
async function loadPostsIndex(){
  if(__postsIndex) return __postsIndex;
  const res = await fetch(`blog.index.json?ts=${Date.now()}`, { cache: 'no-store' });
  if(!res.ok) throw new Error('找不到 blog.index.json');
  __postsIndex = await res.json();
  return __postsIndex;
}
async function loadPostBySlug(slug){
  const index = await loadPostsIndex();
  const hit = index.find(p => p.slug === slug);
  if(!hit) throw new Error('文章不存在');
  const raw = await fetch(`posts/${hit.file}?ts=${Date.now()}`, { cache: 'no-store' }).then(r=>{
    if(!r.ok) throw new Error('載入文章失敗');
    return r.text();
  });
  const body = raw.replace(/^---[\s\S]*?\n---\s*/,'').trim();
  return { title: hit.title, date: hit.date, body };
}

async function renderBlog(){
  setActive('#/blog');
  app.innerHTML = `<section class="container py-16"><h1>Blog</h1><p class="muted">Loading…</p></section>`;
  try{
    const posts = await loadPostsIndex();
    app.innerHTML = `
      <section class="container py-16">
        <h1>Blog</h1>
        <div class="list mt-3">
          ${posts.map(p=>`
            <div class="item">
              <a class="prose" href="#/blog/${p.slug}"><h3 style="margin:0">${p.title}</h3></a>
              <div class="muted">${p.date ? new Date(p.date).toLocaleDateString() : ''}</div>
              ${p.summary ? `<p class="muted mt-1" style="max-width:72ch">${p.summary}</p>`:''}
            </div>
          `).join('')}
        </div>
      </section>
    `;
    setHead('Shen — Blog','Posts by Shen.');
  }catch(e){
    // fallback：顯示內建示例文章
    const posts = DATA.blogFallback;
    app.innerHTML = `
      <section class="container py-16">
        <h1>Blog</h1>
        <p class="muted">讀取索引失敗（${e.message}）。以下為示例文章。</p>
        <div class="list mt-3">
          ${posts.map(b=>`
            <div class="item">
              <a class="prose" href="#/blog/${b.slug}"><h3 style="margin:0">${b.title}</h3></a>
              <div class="muted">${new Date(b.date).toLocaleDateString()}</div>
              ${b.summary?`<p class="muted mt-1" style="max-width:72ch">${b.summary}</p>`:""}
            </div>`).join('')}
        </div>
      </section>
    `;
    setHead('Shen — Blog (fallback)','Posts by Shen.');
  }
}

async function renderPost(slug){
  setActive('#/blog');
  app.innerHTML = `<section class="container py-16"><h1>Loading…</h1></section>`;
  try{
    const post = await loadPostBySlug(slug);
    app.innerHTML = `
      <section class="container py-16">
        <article class="prose">
          <h1>${post.title}</h1>
          ${post.date ? `<p class="muted">${new Date(post.date).toLocaleDateString()}</p>`:''}
          ${mdToHtml(post.body)}
        </article>
        <div class="container" style="max-width:72ch; margin:2rem auto 0; padding:0">
          <a class="btn" href="#/blog">← Back to Blog</a>
        </div>
      </section>
    `;
    setHead(`${post.title} — Shen`, post.body.replace(/\n+/g,' ').slice(0,150)+'…');
    afterPostRender();
  }catch(e){
    const b = DATA.blogFallback[0];
    app.innerHTML = `
      <section class="container py-16">
        <article class="prose">
          <h1>${b.title}</h1>
          <p class="muted">${new Date(b.date).toLocaleDateString()} — <em>fallback</em></p>
          ${mdToHtml(b.md)}
        </article>
        <div class="container" style="max-width:72ch; margin:2rem auto 0; padding:0">
          <a class="btn" href="#/blog">← Back to Blog</a>
        </div>
      </section>
    `;
    setHead(`${b.title} — Shen (fallback)`, b.summary || '');
    afterPostRender();
  }
}

/* ========= Projects / Papers loaders ========= */
let __projectsIndex = null;
async function loadProjectsIndex(){
  if(__projectsIndex) return __projectsIndex;
  const res = await fetch(`projects.index.json?ts=${Date.now()}`, { cache: 'no-store' });
  if(!res.ok) throw new Error('找不到 projects.index.json');
  __projectsIndex = await res.json();
  return __projectsIndex;
}
async function loadProjectBySlug(slug){
  const idx = await loadProjectsIndex();
  const hit = idx.find(p=>p.slug===slug);
  if(!hit) throw new Error('Project 不存在');
  const raw = await fetch(`projects/${hit.file}?ts=${Date.now()}`, { cache: 'no-store' }).then(r=>{
    if(!r.ok) throw new Error('載入 project 檔案失敗');
    return r.text();
  });
  const body = raw.replace(/^---[\s\S]*?\n---\s*/,'').trim(); // ← 修正：一定要有括號
  return { ...hit, body };
}

let __papersIndex = null;
async function loadPapersIndex(){
  if(__papersIndex) return __papersIndex;
  const res = await fetch(`papers.index.json?ts=${Date.now()}`, { cache: 'no-store' });
  if(!res.ok) throw new Error('找不到 papers.index.json');
  __papersIndex = await res.json();
  return __papersIndex;
}
async function loadPaperBySlug(slug){
  const idx = await loadPapersIndex();
  const hit = idx.find(p=>p.slug===slug);
  if(!hit) throw new Error('Paper 不存在');
  const raw = await fetch(`papers/${hit.file}?ts=${Date.now()}`, { cache: 'no-store' }).then(r=>{
    if(!r.ok) throw new Error('載入 paper 檔案失敗');
    return r.text();
  });
  const body = raw.replace(/^---[\s\S]*?\n---\s*/,'').trim(); // ← 修正：一定要有括號
  return { ...hit, body };
}

/* ========= Projects / Papers：保持你目前外觀 ========= */

// Projects 列表（卡片）
async function renderProjects(){
  setActive('#/projects');
  app.innerHTML = `<section class="container py-16"><h1>Projects</h1><p class="muted">Loading…</p></section>`;
  try{
    const items = await loadProjectsIndex();
    app.innerHTML = `
      <section class="container py-16">
        <h1>Projects</h1>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); margin-top:1.25rem">
          ${items.map(p=>`
            <div class="glass card">
              ${p.status?`<span class="tag">${p.status}</span>`:''}
              <h3 style="margin-top:.5rem"><a href="#/projects/${p.slug}">${p.title}</a></h3>
              <p class="muted">${p.summary||''}</p>
              ${p.repo?`<a class="btn" href="${p.repo}" target="_blank" rel="noopener">Repo</a>`:''}
            </div>`).join('')}
        </div>
      </section>
    `;
    setHead('Shen — Projects','Projects and research directions.');
  }catch(e){
    app.innerHTML = `<section class="container py-16"><h1>Projects</h1><p class="muted">讀取失敗：${e.message}</p></section>`;
  }
}

// Projects 詳頁
async function renderProject(slug){
  setActive('#/projects');
  app.innerHTML = `<section class="container py-16"><h1>Loading…</h1></section>`;
  try{
    const p = await loadProjectBySlug(slug);
    app.innerHTML = `
      <section class="container py-16">
        <article class="prose" style="max-width:72ch">
          <h1>${p.title}</h1>
          ${p.status?`<p class="muted">Status: ${p.status}</p>`:''}
          ${p.cover?`<img src="${p.cover}" alt="" style="width:100%;border-radius:16px;margin:1rem 0">`:''}
          ${mdToHtml(p.body)}
          <div class="mt-3">
            <a class="btn" href="#/projects">← Back to Projects</a>
            ${p.repo?`<a class="btn" style="margin-left:.5rem" href="${p.repo}" target="_blank" rel="noopener">Repo</a>`:''}
          </div>
        </article>
      </section>
    `;
    setHead(`${p.title} — Project`, p.summary || '');
    afterPostRender();
  }catch(e){
    app.innerHTML = `<section class="container py-16"><h1>Not found</h1><p class="muted">${e.message}</p></section>`;
  }
}

// Papers 列表（標題 + PDF/DOI）
async function renderPapers(){
  setActive('#/papers');
  app.innerHTML = `<section class="container py-16"><h1>Papers</h1><p class="muted">Loading…</p></section>`;
  try{
    const items = await loadPapersIndex();
    app.innerHTML = `
      <section class="container py-16">
        <h1>Papers</h1>
        <div class="list mt-3">
          ${items.map(p=>`
            <div class="item">
              <div class="prose"><h3 style="margin:0"><a href="#/papers/${p.slug}">${p.title}</a></h3></div>
              <div class="muted">${[p.venue, p.year].filter(Boolean).join(' • ')}</div>
              <div class="mt-2">
                ${p.pdf?`<a class="btn" href="${p.pdf}" target="_blank" rel="noopener">PDF</a>`:''}
                ${p.doi?`<a class="btn" style="margin-left:.5rem" href="https://doi.org/${p.doi}" target="_blank" rel="noopener">DOI</a>`:''}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
    setHead('Shen — Papers','Selected papers & preprints.');
  }catch(e){
    app.innerHTML = `<section class="container py-16"><h1>Papers</h1><p class="muted">讀取失敗：${e.message}</p></section>`;
  }
}

// Papers 詳頁
async function renderPaper(slug){
  setActive('#/papers');
  app.innerHTML = `<section class="container py-16"><h1>Loading…</h1></section>`;
  try{
    const p = await loadPaperBySlug(slug);
    app.innerHTML = `
      <section class="container py-16">
        <article class="prose">
          <h1>${p.title}</h1>
          <p class="muted">${[p.venue, p.year].filter(Boolean).join(' • ')}</p>
          <p>
            ${p.pdf?`<a class="btn" href="${p.pdf}" target="_blank" rel="noopener">PDF</a>`:''}
            ${p.doi?`<a class="btn" style="margin-left:.5rem" href="https://doi.org/${p.doi}" target="_blank" rel="noopener">DOI</a>`:''}
          </p>
          ${mdToHtml(p.body)}
          <div class="mt-3"><a class="btn" href="#/papers">← Back to Papers</a></div>
        </article>
      </section>
    `;
    setHead(`${p.title} — Paper`, p.summary || '');
    // 可選：結構化資料
    const ld = {
      "@context":"https://schema.org",
      "@type":"ScholarlyArticle",
      "headline": p.title,
      "datePublished": p.date || (p.year?`${p.year}-01-01`:undefined),
      "author": Array.isArray(p.authors) ? p.authors.map(a=>({ "@type":"Person", name:a })) : undefined,
      "identifier": p.doi ? `https://doi.org/${p.doi}` : undefined,
      "url": location.href
    };
    try{
      const tag = document.createElement('script');
      tag.type = 'application/ld+json';
      tag.textContent = JSON.stringify(ld);
      document.head.appendChild(tag);
    }catch(_){}
    afterPostRender();
  }catch(e){
    app.innerHTML = `<section class="container py-16"><h1>Not found</h1><p class="muted">${e.message}</p></section>`;
  }
}

/* ========= Helpers：Clock + Parallax ========= */
function startClock(){
  const el = document.getElementById('clock');
  if(!el) return;
  const fmt = new Intl.DateTimeFormat(undefined, {
    weekday:'short', year:'numeric', month:'short', day:'2-digit',
    hour:'2-digit', minute:'2-digit'
  });
  const tick = ()=> el.textContent = fmt.format(new Date());
  tick(); clearInterval(window.__clk); window.__clk = setInterval(tick, 1000);
}

function initParallax(){
  const bg = document.querySelector('.hero-bg');
  if(!bg) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;

  // 保留很輕微的左右位移；不做 Y 位移，避免背景跳動
  function move(e){
    const x = (e.clientX / window.innerWidth - 0.5) * 8;
    bg.style.backgroundPosition =
      `calc(50% + ${x}px) 25%, center center, center center`;
  }
  window.removeEventListener('mousemove', window.__mv);
  window.__mv = move;
  window.addEventListener('mousemove', window.__mv);
}

/* ========= Router ========= */
function router(){
  const h = location.hash || '#/';
  if(h==="#/" || h==="#") return renderHome();

  if(h.startsWith('#/blog/'))     return renderPost(h.split('/')[2]);
  if(h==="#/blog")                return renderBlog();

  if(h.startsWith('#/projects/')) return renderProject(h.split('/')[2]);
  if(h==="#/projects")            return renderProjects();

  if(h.startsWith('#/papers/'))   return renderPaper(h.split('/')[2]);
  if(h==="#/papers")              return renderPapers();

  if(h==="#/cv")                  return renderCV();

  renderHome();
}

/* ========= 全域錯誤護欄 ========= */
function showFatal(msg){
  const host = document.getElementById('app') || document.body;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <section class="container py-16">
      <h1>Runtime error</h1>
      <pre class="prose" style="white-space:pre-wrap">${msg}</pre>
      <a class="btn" href="#/">← Back to Home</a>
    </section>`;
  host.innerHTML = "";
  host.appendChild(wrap.firstElementChild);
}
window.addEventListener('error', (e)=>{
  showFatal((e.error && e.error.stack) || e.message);
});
window.addEventListener('unhandledrejection', (e)=>{
  showFatal(e.reason?.stack || e.reason?.message || String(e.reason));
});

/* ========= boot ========= */
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', ()=>{
  try{
    const y = document.getElementById('y');
    if (y) y.textContent = new Date().getFullYear();
    router();
  }catch(e){
    showFatal(e.stack || e.message);
    console.error(e);
  }
});



