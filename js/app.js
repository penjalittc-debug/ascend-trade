/* ==========================================================================
   Ascend Trade & Logistics — App logic: i18n, header, menu, reveal, counters, FAQ
   ========================================================================== */
(function(){
  const LANGS = ["az","ru","en"];
  const FLAGS = {az:"🇦🇿", ru:"🇷🇺", en:"🇬🇧"};
  const NAMES = {az:"Azərbaycan", ru:"Русский", en:"English"};

  function getLang(){
    let l = localStorage.getItem("ascend_lang");
    if(!l){
      const nav = (navigator.language||"en").slice(0,2).toLowerCase();
      l = LANGS.includes(nav) ? nav : "az";
    }
    return LANGS.includes(l) ? l : "az";
  }

  function apply(lang){
    const dict = window.I18N[lang] || window.I18N.az;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const key = el.getAttribute("data-i18n");
      if(dict[key] !== undefined){
        if(el.hasAttribute("data-i18n-html") || dict[key].includes("<")){
          el.innerHTML = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(el=>{
      const key = el.getAttribute("data-i18n-ph");
      if(dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
    });
    // update lang button label + active states
    const lbl = document.querySelector(".lang-btn .lang-cur");
    if(lbl) lbl.textContent = FLAGS[lang] + " " + lang.toUpperCase();
    document.querySelectorAll(".lang-menu button").forEach(b=>{
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    localStorage.setItem("ascend_lang", lang);
  }

  function initLangSwitch(){
    const wrap = document.querySelector(".lang");
    if(!wrap) return;
    const btn = wrap.querySelector(".lang-btn");
    btn.addEventListener("click", e=>{ e.stopPropagation(); wrap.classList.toggle("open"); });
    wrap.querySelectorAll(".lang-menu button").forEach(b=>{
      b.addEventListener("click", ()=>{ apply(b.dataset.lang); wrap.classList.remove("open"); });
    });
    document.addEventListener("click", ()=> wrap.classList.remove("open"));
  }

  /* header scroll + on-dark */
  function initHeader(){
    const header = document.querySelector(".header");
    if(!header) return;
    const startsDark = header.hasAttribute("data-dark");
    function upd(){
      const y = window.scrollY;
      if(y > 40){
        header.classList.add("scrolled");
        header.classList.remove("on-dark");
      } else {
        header.classList.remove("scrolled");
        if(startsDark) header.classList.add("on-dark");
      }
    }
    upd();
    window.addEventListener("scroll", upd, {passive:true});
  }

  /* mobile menu */
  function initMenu(){
    const burger = document.querySelector(".burger");
    if(!burger) return;
    burger.addEventListener("click", ()=> document.body.classList.toggle("menu-open"));
    document.querySelectorAll(".mobile-nav a").forEach(a=>{
      a.addEventListener("click", ()=> document.body.classList.remove("menu-open"));
    });
  }

  /* reveal on scroll */
  function initReveal(){
    const els = document.querySelectorAll("[data-reveal]");
    if(!("IntersectionObserver" in window)){ els.forEach(e=>e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
    }, {threshold:.14, rootMargin:"0px 0px -40px 0px"});
    els.forEach(e=>io.observe(e));
  }

  /* animated counters */
  function initCounters(){
    const nums = document.querySelectorAll("[data-count]");
    if(!nums.length) return;
    const run = (el)=>{
      const target = parseFloat(el.getAttribute("data-count"));
      const dur = 1400; const t0 = performance.now();
      const step = (t)=>{
        const p = Math.min((t-t0)/dur, 1);
        const eased = 1 - Math.pow(1-p, 3);
        el.textContent = Math.round(target*eased).toString();
        if(p<1) requestAnimationFrame(step);
        else el.textContent = target.toString();
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{ if(en.isIntersecting){ run(en.target); io.unobserve(en.target); } });
    }, {threshold:.5});
    nums.forEach(n=>io.observe(n));
  }

  /* FAQ accordion */
  function initFaq(){
    document.querySelectorAll(".faq-q").forEach(q=>{
      q.addEventListener("click", ()=>{
        const item = q.parentElement;
        const open = item.classList.contains("open");
        item.classList.toggle("open");
        const a = item.querySelector(".faq-a");
        a.style.maxHeight = open ? null : a.scrollHeight + "px";
      });
    });
  }

  /* contact form (demo) */
  function initForm(){
    const form = document.querySelector("form[data-demo]");
    if(!form) return;
    form.addEventListener("submit", e=>{
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      const orig = btn.textContent;
      btn.textContent = "✓";
      btn.disabled = true;
      setTimeout(()=>{ btn.textContent = orig; btn.disabled = false; form.reset(); }, 2200);
    });
  }

  /* year */
  function initYear(){
    document.querySelectorAll("[data-year]").forEach(e=> e.textContent = new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    if(typeof window.renderChrome === "function"){
      window.renderChrome(document.body.getAttribute("data-page") || "");
    }
    apply(getLang());
    initLangSwitch();
    initHeader();
    initMenu();
    initReveal();
    initCounters();
    initFaq();
    initForm();
    initYear();
  });
})();
