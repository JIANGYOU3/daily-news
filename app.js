(async function(){
  let data = window.NEWS_DATA;
  try{ // 通过 http 打开时优先读 data.json（最新），file:// 下回落到 data.js
    const r = await fetch('data.json',{cache:'no-store'}); if(r.ok) data = await r.json();
  }catch(e){}
  const $ = s=>document.querySelector(s);
  const main=$('#main'), datesEl=$('#dates'), tagsEl=$('#tags');
  if(!data||!data.days){main.innerHTML='<p class="empty">未能加载数据</p>';return;}
  const cats=data.categories, catMap=Object.fromEntries(cats.map(c=>[c.id,c]));
  const days=[...data.days].sort((a,b)=>b.date.localeCompare(a.date));
  const WK='日一二三四五六';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const host=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return ''}};
  const label=c=>(c.group?c.group+'·':'')+c.label;
  const params=new URLSearchParams(location.hash.slice(1));
  let curDate=params.get('d')||'all', curCat=params.get('c')||'all';

  // 主题
  const root=document.documentElement, saved=localStorage.getItem('theme');
  if(saved) root.dataset.theme=saved;
  $('#theme').onclick=()=>{
    const dark = root.dataset.theme ? root.dataset.theme==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark?'light':'dark'; localStorage.setItem('theme',root.dataset.theme);
  };
  $('#sub').textContent=`${data.owner?data.owner+' · ':''}已推送内容 · ${days.length} 天 · ${days.at(-1).date.slice(5)} – ${days[0].date.slice(5)}`;

  function renderNav(){
    datesEl.innerHTML=['all',...days.map(d=>d.date)].map(d=>{
      if(d==='all') return `<button data-d="all" aria-pressed="${curDate==='all'}"><b>全部</b><small>${days.length}天</small></button>`;
      const dt=new Date(d+'T00:00:00'), n=days.find(x=>x.date===d).entries.length;
      return `<button data-d="${d}" aria-pressed="${curDate===d}"><b>${d.slice(5).replace('-','/')}</b><small>周${WK[dt.getDay()]} · ${n}</small></button>`;
    }).join('');
    let h=`<button data-c="all" aria-pressed="${curCat==='all'}">全部分类</button><span class="sep"></span>`;
    h+=cats.map(c=>`<button data-c="${c.id}" style="--c:var(--c-${c.id})" aria-pressed="${curCat===c.id}"><i></i>${esc(label(c))}</button>`).join('');
    tagsEl.innerHTML=h;
  }
  function card(e,i){
    const c=catMap[e.category]||{}, oss=e.category==='oss';
    return `<a class="card ${oss?'oss':''}" style="--c:var(--c-${e.category})" href="${esc(e.url)}" target="_blank" rel="noopener">
      ${oss&&!e.tag?`<span class="rk">${String(i+1).padStart(2,'0')}</span>`:''}
      <h3>${esc(e.title)}${e.tag?`<span class="pill">${esc(e.tag)}</span>`:''}</h3>
      <p>${esc(e.summary)}</p>
      <div class="ft"><span class="src">↗ ${esc(e.source||host(e.url))}</span>${e.meta?`<span class="meta">${esc(e.meta)}</span>`:''}</div></a>`;
  }
  function renderMain(){
    const list=days.filter(d=>curDate==='all'||d.date===curDate);
    let html='';
    for(const d of list){
      const sel=curCat==='all'?cats:cats.filter(c=>c.id===curCat);
      let body='';
      for(const c of sel){
        const es=d.entries.filter(e=>e.category===c.id);
        const showCards=c.id==='oss'&&d.cards&&d.cards.length;
        if(!es.length&&!showCards) continue;
        let inner=`<div class="grid">${es.map(card).join('')}</div>`;
        if(showCards) inner=`<div class="oss-wrap">${inner}<div>${d.cards.map(src=>`<figure class="poster"><img loading="lazy" src="${esc(src)}" alt="${d.date} 开源日榜图卡"><figcaption>日榜图卡 · 点击放大</figcaption></figure>`).join('')}</div></div>`;
        body+=`<div class="sec" style="--c:var(--c-${c.id})">${esc(label(c))} · ${es.length}</div>${inner}`;
      }
      if(!body) continue;
      const dt=new Date(d.date+'T00:00:00');
      html+=`<section class="day" id="d-${d.date}"><div class="day-h"><h2>${d.date.replace(/-/g,'.')}</h2><span class="wk">星期${WK[dt.getDay()]}</span>${d.weather&&(curCat==='all'||curCat.startsWith('news'))?`<span class="weather">☀︎ ${esc(d.weather)}</span>`:''}</div>${d.note?`<p class="note">${esc(d.note)}</p>`:''}${body}</section>`;
    }
    main.innerHTML=html||'<p class="empty">该日期下没有此分类的内容</p>';
  }
  function update(){
    location.replace('#'+new URLSearchParams({d:curDate,c:curCat}));
    renderNav();renderMain();
  }
  datesEl.onclick=e=>{const b=e.target.closest('button');if(b){curDate=b.dataset.d;update();scrollTo({top:0,behavior:'smooth'});}};
  tagsEl.onclick=e=>{const b=e.target.closest('button');if(b){curCat=b.dataset.c;update();}};
  const lb=$('#lb');
  main.onclick=e=>{const f=e.target.closest('.poster');if(f){lb.querySelector('img').src=f.querySelector('img').src;lb.hidden=false;}};
  lb.onclick=()=>lb.hidden=true;
  document.onkeydown=e=>{if(e.key==='Escape')lb.hidden=true;};
  renderNav();renderMain();
})();
