/* ==========================================================================
   Ascend Trade & Logistics — Shared header / footer (injected)
   ========================================================================== */
(function(){
  const PAGES = [
    {href:"/",              key:"nav.home",       id:"home"},
    {href:"/about",     key:"nav.about",      id:"about"},
    {href:"/services",  key:"nav.services",   id:"services"},
    {href:"/directions",key:"nav.directions", id:"directions"},
    {href:"/blog",      key:"nav.blog",       id:"blog"},
    {href:"/contact",   key:"nav.contact",    id:"contact"}
  ];
  const ICON = {
    chevron:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg>',
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z"/></svg>',
    mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    linkedin:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1a4.2 4.2 0 0 1 3.8-2c4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z"/></svg>',
    instagram:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    whatsapp:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.6-.3.3c-.2.2-.3.4-.1.7.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.6 1.6.3.1.5.1.7-.1l.9-1c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.1.1.6-.1 1.2z"/></svg>',
    telegram:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.5 20c-.2 1-.9 1.3-1.8.8l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.2-8.3c.4-.4-.1-.6-.6-.2L5.6 13.2l-4.9-1.5c-1-.3-1.1-1 .2-1.5L20.5 2.9c.9-.3 1.6.2 1.4 1.4z"/></svg>'
  };

  function header(active){
    const links = PAGES.map(p=>
      `<a class="nav-link ${p.id===active?'active':''}" href="${p.href}" data-i18n="${p.key}"></a>`
    ).join("");
    const mlinks = PAGES.map(p=>
      `<a class="${p.id===active?'active':''}" href="${p.href}" data-i18n="${p.key}"></a>`
    ).join("");
    const langBtns = [["az","🇦🇿"],["ru","🇷🇺"],["en","🇬🇧"]].map(([l,f])=>
      `<button data-lang="${l}"><span class="flag">${f}</span> ${({az:'Azərbaycan',ru:'Русский',en:'English'})[l]}</button>`
    ).join("");

    return `
    <header class="header" data-dark>
      <div class="container header-inner">
        <a class="logo" href="/" aria-label="Ascend Trade & Logistics">
          <img class="logo-dark" src="assets/logo-main.png" alt="Ascend Trade & Logistics">
          <img class="logo-light" src="assets/logo-white.png" alt="Ascend Trade & Logistics">
        </a>
        <nav class="nav">
          <div class="nav-links">${links}</div>
        </nav>
        <div class="nav-right">
          <div class="lang">
            <button class="lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="Language"><span class="lang-cur">🇦🇿 AZ</span> ${ICON.chevron}</button>
            <div class="lang-menu">${langBtns}</div>
          </div>
          <a class="btn btn-primary" href="/contact" data-i18n="nav.cta"></a>
          <button class="burger" aria-label="Menu" aria-controls="mobile-nav" aria-expanded="false"><span></span><span></span><span></span></button>
        </div>
      </div>
    </header>
    <div class="mobile-nav" id="mobile-nav">
      ${mlinks}
      <div class="mobile-lang">
        <button data-lang="az"><span class="flag">🇦🇿</span> AZ</button>
        <button data-lang="ru"><span class="flag">🇷🇺</span> RU</button>
        <button data-lang="en"><span class="flag">🇬🇧</span> EN</button>
      </div>
      <a class="btn btn-primary" href="/contact" data-i18n="nav.cta"></a>
    </div>`;
  }

  function footer(){
    const S = window.SITE || {};
    const svc = [["ft.svc1","/services"],["ft.svc2","/services"],["ft.svc3","/services"],["ft.svc4","/services"]]
      .map(([k,h])=>`<li><a href="${h}" data-i18n="${k}"></a></li>`).join("");
    const nav = PAGES.map(p=>`<li><a href="${p.href}" data-i18n="${p.key}"></a></li>`).join("");

    // socials — render only the ones that are configured (no dead "#" links)
    const soc = [];
    if(S.social && S.social.instagram) soc.push(`<a href="${S.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${ICON.instagram}</a>`);
    if(S.social && S.social.linkedin)  soc.push(`<a href="${S.social.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">${ICON.linkedin}</a>`);
    if(S.whatsapp) soc.push(`<a href="https://wa.me/${S.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICON.whatsapp}</a>`);
    if(S.telegram) soc.push(`<a href="https://t.me/${S.telegram}" target="_blank" rel="noopener" aria-label="Telegram">${ICON.telegram}</a>`);
    const socials = soc.join("");

    const phoneLi = S.phone ? `<li>${ICON.phone}<a href="tel:${S.phone}">${S.phoneDisplay||S.phone}</a></li>` : "";
    const mailLi  = S.email ? `<li>${ICON.mail}<a href="mailto:${S.email}">${S.email}</a></li>` : "";
    return `
    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <div>
            <img class="f-logo" src="assets/logo-white.png" alt="Ascend Trade & Logistics">
            <p class="f-about" data-i18n="ft.about"></p>
            <div class="socials">${socials}</div>
          </div>
          <div>
            <h4 data-i18n="ft.nav"></h4>
            <ul class="f-links">${nav}</ul>
          </div>
          <div>
            <h4 data-i18n="ft.services"></h4>
            <ul class="f-links">${svc}</ul>
          </div>
          <div>
            <h4 data-i18n="ft.contact"></h4>
            <ul class="f-contact">
              ${phoneLi}
              ${mailLi}
              <li>${ICON.pin}<span data-i18n="ct.addrv"></span></li>
              <li>${ICON.clock}<span data-i18n="ft.hours"></span></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© <span data-year></span> Ascend Trade & Logistics. <span data-i18n="ft.rights"></span></span>
          <a href="/privacy" data-i18n="ft.privacy"></a>
        </div>
      </div>
    </footer>`;
  }

  function waFloat(){
    const S = window.SITE || {};
    if(!S.whatsapp || document.querySelector(".wa-float")) return;
    const a = document.createElement("a");
    a.className = "wa-float";
    a.href = "https://wa.me/" + S.whatsapp;
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "WhatsApp");
    a.innerHTML = ICON.whatsapp;
    document.body.appendChild(a);
  }

  window.renderChrome = function(active){
    const h = document.getElementById("site-header");
    const f = document.getElementById("site-footer");
    if(h) h.outerHTML = header(active);
    if(f) f.outerHTML = footer();
    waFloat();
  };
  window.ICONS = ICON;
})();
