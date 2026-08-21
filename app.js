(() => {
  'use strict';

  const list = document.getElementById('sectionList');
  const topbar = document.getElementById('topbar');
  const pill = document.getElementById('activePill');
  const verseLayer = document.getElementById('verseLayer');
  let z = 300;
  let activeItem = null;

  if (Array.isArray(SECTIONS)) {
    if (SECTIONS[6]) SECTIONS[6].title = 'Discurso · Cómo recuperar la paz en la familia';
    if (SECTIONS[9]) SECTIONS[9].title = 'Video musical · Tú vales más que los gorriones';
  }

  const musicLayoutFix = document.createElement('style');
  musicLayoutFix.textContent = `
    .music-beats>div{
      grid-template-columns:minmax(0,1fr);
      gap:4px;
      min-width:0;
    }
    .music-beats span,
    .music-beats p{
      min-width:0;
      max-width:100%;
      overflow-wrap:anywhere;
    }
    @media (min-width:600px){
      .music-beats>div{
        grid-template-columns:86px minmax(0,1fr);
        gap:10px;
      }
    }
  `;
  document.head.appendChild(musicLayoutFix);

  const esc = value => String(value)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  list.innerHTML = SECTIONS.map((s,i) => `
    <article class="accordion" id="section-${i+1}">
      <button class="accordion-trigger" aria-expanded="false" aria-controls="panel-${i+1}">
        <span class="section-number">${i+1}</span>
        <span class="section-title-wrap"><span class="section-title">${esc(s.title)}</span><span class="section-time">${esc(s.time)}</span></span>
        <span class="chevron" aria-hidden="true"></span>
      </button>
      <div class="accordion-panel" id="panel-${i+1}" role="region" aria-label="${esc(s.title)}">
        <div class="accordion-inner">${s.html}</div>
      </div>
    </article>`).join('');

  const items = [...document.querySelectorAll('.accordion')];

  function closeItem(item){
    if(!item) return;
    item.classList.remove('active');
    item.querySelector('.accordion-trigger').setAttribute('aria-expanded','false');
  }

  function setPill(item){
    if(!item){ pill.hidden = true; pill.textContent = ''; return; }
    const n = item.querySelector('.section-number').textContent;
    const title = item.querySelector('.section-title').textContent;
    pill.textContent = `${n} · ${title}`;
    pill.hidden = false;
  }

  function scrollAfterOpen(item){
    const panel = item.querySelector('.accordion-panel');
    let done = false;
    const finish = () => {
      if(done || !item.classList.contains('active')) return;
      done = true;
      const offset = topbar.getBoundingClientRect().height + 10;
      const top = item.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
    };
    const onEnd = e => {
      if(e.target === panel && (e.propertyName === 'grid-template-rows' || e.propertyName.includes('grid'))){
        panel.removeEventListener('transitionend',onEnd); finish();
      }
    };
    panel.addEventListener('transitionend',onEnd);
    window.setTimeout(() => { panel.removeEventListener('transitionend',onEnd); finish(); }, 430);
  }

  items.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    trigger.addEventListener('click',() => {
      const wasOpen = item.classList.contains('active');
      if(wasOpen){ closeItem(item); activeItem = null; setPill(null); return; }
      items.forEach(closeItem);
      item.classList.add('active');
      trigger.setAttribute('aria-expanded','true');
      activeItem = item;
      setPill(item);
      scrollAfterOpen(item);
    });
  });

  function initCarousels(){
    document.querySelectorAll('.media-carousel').forEach(carousel => {
      const track = carousel.querySelector('.carousel-track');
      const slides = [...carousel.querySelectorAll('.media-slide')];
      const count = carousel.querySelector('.carousel-count');
      const dots = carousel.querySelector('.carousel-dots');
      let index = 0;
      dots.innerHTML = slides.map((_,i)=>`<i class="${i===0?'active':''}"></i>`).join('');
      const render = () => {
        track.style.transform = `translateX(${-index*100}%)`;
        count.textContent = `${index+1} de ${slides.length}`;
        [...dots.children].forEach((d,i)=>d.classList.toggle('active',i===index));
      };
      const go = delta => { index = (index + delta + slides.length) % slides.length; render(); };
      carousel.querySelector('.prev').addEventListener('click',()=>go(-1));
      carousel.querySelector('.next').addEventListener('click',()=>go(1));
      let startX = null;
      carousel.querySelector('.carousel-viewport').addEventListener('pointerdown',e=>{startX=e.clientX;});
      carousel.querySelector('.carousel-viewport').addEventListener('pointerup',e=>{
        if(startX===null) return;
        const dx=e.clientX-startX; startX=null;
        if(Math.abs(dx)>42) go(dx<0?1:-1);
      });
      carousel.querySelector('.carousel-viewport').addEventListener('pointercancel',()=>{startX=null;});
      render();
    });
  }
  initCarousels();

  const plannerKey = 'jw-estudio-personal-familia-plan';
  const need = document.getElementById('needInput');
  const topic = document.getElementById('topicInput');
  const video = document.getElementById('videoInput');
  const apply = document.getElementById('applyInput');
  const state = document.getElementById('saveState');
  const saved = (()=>{try{return JSON.parse(localStorage.getItem(plannerKey)||'null')}catch{return null}})();
  if(saved){ need.value=saved.need||''; topic.value=saved.topic||''; video.value=saved.video||''; apply.value=saved.apply||''; }
  let stateTimer;
  const flashState = text => { clearTimeout(stateTimer); state.textContent=text; stateTimer=setTimeout(()=>state.textContent='',1600); };
  document.getElementById('savePlanner').addEventListener('click',()=>{
    localStorage.setItem(plannerKey,JSON.stringify({need:need.value,topic:topic.value,video:video.value,apply:apply.value}));
    flashState('Guardado');
  });
  document.getElementById('clearPlanner').addEventListener('click',()=>{
    need.value='';topic.value='';video.value='';apply.value='';localStorage.removeItem(plannerKey);flashState('Limpiado');
  });

  const clamp = (v,min,max) => Math.min(Math.max(v,min),Math.max(min,max));
  function bringFront(card){ card.style.zIndex = String(++z); }
  function keepInViewport(card,x,y){
    const r=card.getBoundingClientRect();
    const maxX=window.innerWidth-r.width-8;
    const maxY=window.innerHeight-r.height-8;
    return {x:clamp(x,8,maxX),y:clamp(y,8,maxY)};
  }
  function positionCard(card,anchor){
    const all=[...document.querySelectorAll('.verse-card')];
    const slot=(all.length-1)%6;
    const r=card.getBoundingClientRect();
    let x,y;
    if(anchor){
      const a=anchor.getBoundingClientRect();
      x=a.left + slot*10;
      y=Math.min(a.bottom+10,window.innerHeight-r.height-10)+slot*7;
    }else{
      x=14+slot*10; y=90+slot*12;
    }
    const p=keepInViewport(card,x,y); card.style.left=`${p.x}px`;card.style.top=`${p.y}px`;
  }
  function makeDraggable(card){
    let drag=null;
    card.addEventListener('pointerdown',e=>{
      if(e.target.closest('.verse-close')) return;
      bringFront(card);
      const r=card.getBoundingClientRect();
      drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};
      card.classList.add('dragging');
      try{card.setPointerCapture(e.pointerId)}catch{}
      e.preventDefault();
    });
    card.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId) return;
      const p=keepInViewport(card,e.clientX-drag.dx,e.clientY-drag.dy);
      card.style.left=`${p.x}px`;card.style.top=`${p.y}px`;
      e.preventDefault();
    });
    const end=e=>{
      if(!drag||drag.id!==e.pointerId) return;
      drag=null;card.classList.remove('dragging');
      try{card.releasePointerCapture(e.pointerId)}catch{}
    };
    card.addEventListener('pointerup',end);card.addEventListener('pointercancel',end);
  }
  function openVerse(key,anchor){
    const data=VERSES[key]; if(!data) return;
    const card=document.createElement('article');
    card.className='verse-card';
    card.innerHTML=`<div class="verse-card-head"><div><p class="verse-label">Texto bíblico</p><div class="verse-ref">${esc(data.ref)}</div></div><button class="verse-close" aria-label="Cerrar">×</button></div><div class="verse-text">${esc(data.text)}</div>${data.note?`<p class="verse-note">${esc(data.note)}</p>`:''}`;
    verseLayer.appendChild(card);bringFront(card);positionCard(card,anchor);makeDraggable(card);
    card.addEventListener('pointerdown',()=>bringFront(card),{capture:true});
    card.querySelector('.verse-close').addEventListener('click',e=>{e.stopPropagation();card.remove();});
  }
  list.addEventListener('click',e=>{
    const chip=e.target.closest('.verse-chip'); if(chip) openVerse(chip.dataset.verse,chip);
  });

  function reClampCards(){
    document.querySelectorAll('.verse-card').forEach(card=>{
      const r=card.getBoundingClientRect();const p=keepInViewport(card,r.left,r.top);card.style.left=`${p.x}px`;card.style.top=`${p.y}px`;
    });
  }
  window.addEventListener('resize',reClampCards,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(reClampCards,100),{passive:true});
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape') return;
    const cards=[...document.querySelectorAll('.verse-card')];
    if(!cards.length) return;
    cards.sort((a,b)=>(Number(a.style.zIndex)||0)-(Number(b.style.zIndex)||0)).at(-1).remove();
  });

  ['gesturestart','gesturechange','gestureend'].forEach(type=>document.addEventListener(type,e=>e.preventDefault(),{passive:false}));
  document.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey)e.preventDefault();},{passive:false});
  let lastTouchEnd=0;
  document.addEventListener('touchend',e=>{const now=Date.now();if(now-lastTouchEnd<=300)e.preventDefault();lastTouchEnd=now;},{passive:false});
})();
