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
    document.querySelectorAll("[data-lang]").forEach(b=>{
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    localStorage.setItem("ascend_lang", lang);
  }

  function initLangSwitch(){
    const wrap = document.querySelector(".lang");
    if(wrap){
      const btn = wrap.querySelector(".lang-btn");
      const sync = ()=> btn.setAttribute("aria-expanded", wrap.classList.contains("open") ? "true" : "false");
      btn.addEventListener("click", e=>{ e.stopPropagation(); wrap.classList.toggle("open"); sync(); });
      document.addEventListener("click", ()=>{ wrap.classList.remove("open"); sync(); });
      document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ wrap.classList.remove("open"); sync(); } });
    }
    // bind every language button (desktop dropdown + mobile menu)
    document.querySelectorAll("[data-lang]").forEach(b=>{
      b.addEventListener("click", ()=>{
        apply(b.dataset.lang);
        if(wrap) wrap.classList.remove("open");
        document.body.classList.remove("menu-open");
      });
    });
  }

  /* nav dropdown «Xidmətlər»: десктоп — hover + фокус, тач — первый тап;
     мобильное меню — аккордеон. Паттерн повторяет initLangSwitch. */
  function initNavDrop(){
    const drop = document.querySelector(".nav-drop");
    if(drop){
      const link = drop.querySelector(".nav-drop-link");
      const coarse = ()=> !!(window.matchMedia && window.matchMedia("(hover: none)").matches);
      let skipFocus = false;
      const sync = ()=> link.setAttribute("aria-expanded", drop.classList.contains("open") ? "true" : "false");
      const open = ()=>{ drop.classList.add("open"); sync(); };
      const close = ()=>{ drop.classList.remove("open"); sync(); };
      drop.addEventListener("mouseenter", ()=>{ if(!coarse()) open(); });
      drop.addEventListener("mouseleave", ()=>{ if(!coarse() && !drop.contains(document.activeElement)) close(); });
      /* Tab внутрь пункта раскрывает список — иначе с клавиатуры до него не дойти */
      drop.addEventListener("focusin", ()=>{ if(skipFocus){ skipFocus = false; return; } open(); });
      drop.addEventListener("focusout", e=>{ if(!drop.contains(e.relatedTarget)) close(); });
      /* тач-планшет: первый тап раскрывает, второй уводит на /services */
      link.addEventListener("click", e=>{
        if(coarse() && !drop.classList.contains("open")){ e.preventDefault(); open(); }
      });
      document.addEventListener("click", e=>{ if(!drop.contains(e.target)) close(); });
      document.addEventListener("keydown", e=>{
        if(e.key === "Escape" && drop.classList.contains("open")){
          close(); skipFocus = true; link.focus();
        }
      });
    }
    document.querySelectorAll(".m-drop-btn").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const opened = btn.parentElement.classList.toggle("open");
        btn.setAttribute("aria-expanded", opened ? "true" : "false");
      });
    });
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
    const sync = ()=> burger.setAttribute("aria-expanded", document.body.classList.contains("menu-open") ? "true" : "false");
    burger.addEventListener("click", ()=>{ document.body.classList.toggle("menu-open"); sync(); });
    document.querySelectorAll(".mobile-nav a").forEach(a=>{
      a.addEventListener("click", ()=>{ document.body.classList.remove("menu-open"); sync(); });
    });
    document.addEventListener("keydown", e=>{
      if(e.key==="Escape" && document.body.classList.contains("menu-open")){
        document.body.classList.remove("menu-open"); sync(); burger.focus();
      }
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
      const item = q.parentElement;
      const a = item.querySelector(".faq-a");
      if(!a) return;
      /* когда раскрытие доиграло — снимаем фиксированную высоту. Иначе
         замороженный max-height обрезает ответ, если текст стал выше:
         при переключении языка (ru/en длиннее az) или при повороте экрана. */
      a.addEventListener("transitionend", e=>{
        if(e.propertyName === "max-height" && item.classList.contains("open")) a.style.maxHeight = "none";
      });
      const toggle = ()=>{
        const open = item.classList.contains("open");
        if(open){
          /* из "none" анимировать не с чего — возвращаем текущую высоту в пикселях */
          a.style.maxHeight = a.scrollHeight + "px";
          void a.offsetHeight;
          item.classList.remove("open");
          a.style.maxHeight = null;
        } else {
          item.classList.add("open");
          a.style.maxHeight = a.scrollHeight + "px";
        }
        q.setAttribute("aria-expanded", open ? "false" : "true");
      };
      q.addEventListener("click", toggle);
      q.addEventListener("keydown", e=>{
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); toggle(); }
      });
    });
  }

  /* contact form — real submit via Web3Forms */
  function initForm(){
    const form = document.querySelector("form[data-ajax]");
    if(!form) return;
    const status = form.querySelector("[data-status]");
    const MSG = {
      ok:  { az:"Sorğunuz göndərildi. Tezliklə əlaqə saxlayacağıq.", ru:"Заявка отправлена. Мы скоро свяжемся с вами.", en:"Request sent. We'll get back to you shortly." },
      err: { az:"Xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.", ru:"Произошла ошибка. Попробуйте ещё раз чуть позже.", en:"Something went wrong. Please try again shortly." }
    };
    function say(kind){
      if(!status) return;
      const l = (localStorage.getItem("ascend_lang")||"az");
      status.hidden = false;
      status.className = "form-status " + (kind==="ok"?"ok":"err");
      status.textContent = MSG[kind][l] || MSG[kind].az;
    }
    /* какая именно форма дала лид: скрытые поля service / page есть на страницах
       услуг и коридора; на /contact их нет — тогда остаётся "contact" */
    function formId(){
      const el = form.querySelector('input[name="service"], input[name="page"]');
      return (el && el.value) || "contact";
    }
    form.addEventListener("submit", async e=>{
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      const orig = btn.textContent;
      const lead = formId();
      btn.disabled = true; btn.textContent = "…";
      try{
        const res = await fetch(form.action, { method:"POST", body:new FormData(form), headers:{ "Accept":"application/json" } });
        const data = await res.json().catch(()=>({}));
        if(res.ok && data.success){
          say("ok"); form.reset();
          if(window.gtag) gtag("event", "generate_lead", { form: lead });
          if(window.fbq)  fbq("track", "Lead");
        }
        else { say("err"); }
      }catch(_){ say("err"); }
      finally{ btn.disabled=false; btn.textContent=orig; }
    });
  }

  /* document lightbox */
  function initLightbox(){
    const lb = document.getElementById("lightbox");
    if(!lb) return;
    const img = lb.querySelector("img");
    const closeBtn = lb.querySelector(".lb-close");
    let lastTrigger = null;
    const open = (t)=>{
      const thumbImg = t.querySelector("img");
      if(!thumbImg) return; // no image uploaded yet
      img.src = t.getAttribute("data-full");
      img.alt = thumbImg.alt || "";
      lb.classList.add("open");
      lastTrigger = t;
      if(closeBtn) closeBtn.focus();
    };
    const close = ()=>{
      if(!lb.classList.contains("open")) return;
      lb.classList.remove("open");
      if(lastTrigger){ lastTrigger.focus(); lastTrigger = null; }
    };
    document.querySelectorAll(".doc-thumb").forEach(t=>{
      if(!t.querySelector("img")) return; // skip placeholders without an uploaded image
      t.setAttribute("role", "button");
      t.setAttribute("tabindex", "0");
      if(!t.getAttribute("aria-label")){
        const im = t.querySelector("img");
        t.setAttribute("aria-label", (im && im.alt) ? im.alt : "Document");
      }
      t.addEventListener("click", ()=> open(t));
      t.addEventListener("keydown", e=>{
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); open(t); }
      });
    });
    if(closeBtn){
      closeBtn.setAttribute("role", "button");
      closeBtn.setAttribute("tabindex", "0");
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.addEventListener("keydown", e=>{
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); close(); }
      });
    }
    lb.addEventListener("click", close);
    document.addEventListener("keydown", e=>{ if(e.key === "Escape") close(); });
  }

  /* year */
  function initYear(){
    document.querySelectorAll("[data-year]").forEach(e=> e.textContent = new Date().getFullYear());
  }

  /* apply centralized site config (js/config.js) */
  function applyConfig(){
    const S = window.SITE || {};
    // Web3Forms key — пишем и value, и defaultValue: после успешной отправки
    // форма делает reset(), а он возвращает поля к defaultValue (в разметке он
    // пустой). Без второй строки вторая заявка подряд уходила бы без ключа.
    const key = document.querySelector('input[name="access_key"]');
    if(key && S.web3formsKey) key.value = key.defaultValue = S.web3formsKey;
    // phone links + display text (contact page etc.)
    document.querySelectorAll('[data-site="phone"]').forEach(el=>{
      if(!S.phone) return;
      el.setAttribute("href", "tel:" + S.phone);
      el.textContent = S.phoneDisplay || S.phone;
    });
    // phone CTA — set href only, keep translated label
    document.querySelectorAll('[data-site="phone-cta"]').forEach(el=>{
      if(S.phone) el.setAttribute("href", "tel:" + S.phone);
    });
    // WhatsApp CTA — set wa.me href from config; hide button if not configured
    document.querySelectorAll('[data-site="whatsapp-cta"]').forEach(el=>{
      if(S.whatsapp){ el.setAttribute("href", "https://wa.me/" + S.whatsapp); }
      else { el.style.display = "none"; }
    });
    // email links + display text
    document.querySelectorAll('[data-site="email"]').forEach(el=>{
      if(!S.email) return;
      el.setAttribute("href", "mailto:" + S.email);
      el.textContent = S.email;
    });
    loadAnalytics(S.analytics || {});
  }

  /* load GA4 / Meta Pixel only when IDs are configured */
  function loadAnalytics(a){
    if(a.ga4){
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + a.ga4;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){ dataLayer.push(arguments); };
      gtag("js", new Date());
      gtag("config", a.ga4);
    }
    if(a.metaPixel){
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
      fbq("init", a.metaPixel);
      fbq("track", "PageView");
    }
  }

  /* fire analytics events on WhatsApp / phone clicks — importable as Google Ads conversions */
  function initTracking(){
    document.addEventListener("click", e=>{
      const a = e.target.closest ? e.target.closest("a") : null;
      if(!a) return;
      const href = a.getAttribute("href") || "";
      if(a.matches('[data-site="whatsapp-cta"]') || href.indexOf("wa.me") !== -1 || href.indexOf("api.whatsapp.com") !== -1){
        if(window.gtag) gtag("event", "contact_whatsapp", { method: "whatsapp" });
      } else if(href.indexOf("tel:") === 0){
        if(window.gtag) gtag("event", "contact_phone", { method: "phone" });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    if(typeof window.renderChrome === "function"){
      window.renderChrome(document.body.getAttribute("data-page") || "");
    }
    apply(getLang());
    applyConfig();
    initLangSwitch();
    initNavDrop();
    initHeader();
    initMenu();
    initReveal();
    initCounters();
    initFaq();
    initForm();
    initLightbox();
    initYear();
    initTracking();
  });
})();
