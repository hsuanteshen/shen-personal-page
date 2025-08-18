/* -------- Demo data（之後可外部化成 /data/*.json 與 /posts/*.md） -------- */
const DATA = {
  cv: {
    education: [
      { where:"Leipzig University", what:"BSc Physics (in progress)", years:"2025–" },
      { where:"ENS Ulm (planned)", what:"M1/M2 Mathematics", years:"—" },
      { where:"Oxford (planned)", what:"BM BCh", years:"—" }
    ],
    publications: [
      { title:"A Constructive Closure-Based Proof of a Schur-Type Partition Theorem", year:2025, link:"#"}
    ],
    awards: [{ name:"Project Gnosis Series — in progress" }]
  },
  projects: [
    { title:"Project Gnosis",   status:"Active",      summary:"Number theory × constructive closure proofs; G1–G5 priority." },
    { title:"Project Lucerna",  status:"Research",    summary:"Semantic co-creation & cognitive language system." },
    { title:"Project Eidolon",  status:"Exploration", summary:"Depression × Alzheimer’s × language × neuro." }
  ],
  papers: [
    { title:"A Constructive Closure-Based Proof of a Schur-Type Partition Theorem", year:2025, venue:"Preprint", pdf:"#", doi:null },
  ],
  blog: [
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

/* -------- Markdown → HTML（標題/粗斜體/連結/清單/行內 code） -------- */
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

/* -------- Routing -------- */
const app = document.getElementById('app');
const nav = document.getElementById('nav');

function setActive(hash){
  const links = nav.querySelectorAll('a');
  links.forEach(a=>{
    const active = a.getAttribute('href')===hash;
    a.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

/* -------- Pages -------- */
function renderHome(){
  setActive('#/');
  app.innerHTML = `
    <section class="container py-20">
      <div class="grid grid-12" style="gap:1.5rem">
        <div style="grid-column:span 7;">
          <div class="glass glass-strong card" data-accent>
            <h1>Simplicitas.</h1>
            <p class="muted mt-2" style="max-width:66ch">
              Hello, this is Shen, and this is my personal page!
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
        <h2>Publications (selected)</h2>
        <ul>
          ${cv.publications.map(p=>`<li>${p.title} <span class="muted">(${p.year})</span></li>`).join('')}
        </ul>
        <h2>Awards / Notes</h2>
        <ul>${cv.awards.map(a=>`<li>${a.name}</li>`).join('')}</ul>
      </article>
    </section>
  `;
}

function renderProjects(){
  setActive('#/projects');
  app.innerHTML = `
    <section class="container py-16">
      <h1>Projects</h1>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); margin-top:1.25rem">
        ${DATA.projects.map(p=>`
          <div class="glass card">
            <span class="tag">${p.status}</span>
            <h3 style="margin-top:.5rem">${p.title}</h3>
            <p class="muted">${p.summary}</p>
          </div>`).join('')}
      </div>
    </section>
  `;
}

function renderPapers(){
  setActive('#/papers');
  app.innerHTML = `
    <section class="container py-16">
      <h1>Papers</h1>
      <div class="list mt-3">
        ${DATA.papers.map(p=>`
          <div class="item">
            <div class="prose"><h3 style="margin:0">${p.title}</h3></div>
            <div class="muted">${[p.venue, p.year].filter(Boolean).join(" • ")}</div>
            <div class="mt-2">
              ${p.pdf?`<a class="btn" href="${p.pdf}">PDF</a>`:""}
              ${p.doi?`<a class="btn" style="margin-left:.5rem" href="https://doi.org/${p.doi}" target="_blank" rel="noopener">DOI</a>`:""}
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
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
    setHead(`Blog — Shen`, `Posts by Shen`);
  }catch(e){
    app.innerHTML = `<section class="container py-16"><h1>Blog</h1><p class="muted">讀取失敗：${e.message}</p></section>`;
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
    afterPostRender(); // 供 KaTeX / Prism 使用（下一步）
  }catch(e){
    app.innerHTML = `<section class="container py-16"><h1>Not found</h1><p class="muted">${e.message}</p></section>`;
  }
}

/* -------- Helpers：Clock + Parallax（rAF 合併） + Router -------- */
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

  let targetX = 0, targetY = 0, scrollY = 0, ticking = false;

  function onMouse(e){
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 12;
    targetX = x; targetY = y;
    requestTick();
  }
  function onScroll(){
    scrollY = window.scrollY * 0.08;
    requestTick();
  }
  function requestTick(){
    if(!ticking){
      ticking = true;
      requestAnimationFrame(applyParallax);
    }
  }
  function applyParallax(){
    bg.style.backgroundPosition = `calc(50% + ${targetX}px) calc(50% + ${targetY}px), center center, center center`;
    bg.style.transform = `translateY(${scrollY}px)`;
    ticking = false;
  }

  window.removeEventListener('mousemove', window.__mv);
  window.removeEventListener('scroll', window.__sc);
  window.__mv = onMouse; window.__sc = onScroll;
  window.addEventListener('mousemove', window.__mv);
  window.addEventListener('scroll', window.__sc);
  onScroll();
}

function router(){
  const h = location.hash || '#/';
  if(h==="#/" || h==="#") return renderHome();
  if(h.startsWith('#/blog/')) return renderPost(h.split('/')[2]);
  if(h==="#/cv") return renderCV();
  if(h==="#/projects") return renderProjects();
  if(h==="#/papers") return renderPapers();
  if(h==="#/blog") return renderBlog();
  renderHome();
}

/* boot */
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('y').textContent = new Date().getFullYear();
  router();
});

let __postsIndex = null;

async function loadPostsIndex(){
  if(__postsIndex) return __postsIndex;
  const res = await fetch('blog.index.json', { cache: 'no-store' });
  if(!res.ok) throw new Error('找不到 blog.index.json');
  __postsIndex = await res.json();
  return __postsIndex;
}

async function loadPostBySlug(slug){
  const index = await loadPostsIndex();
  const hit = index.find(p => p.slug === slug);
  if(!hit) throw new Error('文章不存在');
  const raw = await fetch(`posts/${hit.file}`, { cache: 'no-store' }).then(r=>r.text());
  // 直接丟掉 frontmatter（我們列表已取過）
  const body = raw.replace(/^---[\s\S]*?\n---\s*/,'').trim();
  return { title: hit.title, date: hit.date, body };
}
