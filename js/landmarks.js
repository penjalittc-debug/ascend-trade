/* ==========================================================================
   ASCEND — Landmark line-art (blueprint contours) per country
   Fills any element with [data-landmark]
   ========================================================================== */
(function () {
  var S = 'viewBox="0 0 120 84" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"';

  var ART = {
    // China — Great Wall + watchtower
    china:
      '<svg ' + S + '>' +
      '<path d="M4 70 Q28 48 52 66 T116 58" opacity=".35"/>' +
      '<path d="M6 78 L6 62 L18 58 L30 62 L30 54 L44 50"/>' +
      '<path d="M44 78 L44 34 L74 34 L74 78"/>' +
      '<path d="M40 34 L78 34 L71 23 L47 23 Z"/>' +
      '<path d="M53 23 L53 16 L65 16 L65 23"/>' +
      '<rect x="52" y="44" width="14" height="16"/>' +
      '<path d="M74 50 L88 46 L88 55 L100 51 L100 43 L114 39 L114 78"/>' +
      '<path d="M4 78 L116 78"/>' +
      '</svg>',

    // Russia — Spasskaya Tower (Kremlin)
    russia:
      '<svg ' + S + '>' +
      '<path d="M6 78 L6 60 L14 60 L14 55 L22 55 L22 60 L30 60 L30 78"/>' +
      '<path d="M90 78 L90 60 L98 60 L98 55 L106 55 L106 60 L114 60 L114 78"/>' +
      '<path d="M40 78 L40 42 L80 42 L80 78"/>' +
      '<circle cx="60" cy="54" r="7"/>' +
      '<path d="M60 54 L60 49 M60 54 L64 54"/>' +
      '<path d="M44 42 L44 34 L76 34 L76 42"/>' +
      '<path d="M50 34 L50 28 L70 28 L70 34"/>' +
      '<path d="M50 28 L60 12 L70 28"/>' +
      '<path d="M60 12 L60 5"/>' +
      '<path d="M56 8 L64 8 M57.5 5.5 L62.5 10.5 M62.5 5.5 L57.5 10.5"/>' +
      '<path d="M4 78 L116 78"/>' +
      '</svg>',

    // Kazakhstan — Bayterek Tower (Astana)
    kz:
      '<svg ' + S + '>' +
      '<path d="M40 78 L80 78"/>' +
      '<path d="M50 78 C50 60 44 46 60 38"/>' +
      '<path d="M70 78 C70 60 76 46 60 38"/>' +
      '<path d="M60 78 L60 40"/>' +
      '<path d="M49 64 L71 64 M50 56 L70 56 M53 48 L67 48" opacity=".5"/>' +
      '<circle cx="60" cy="28" r="12"/>' +
      '<path d="M60 16 L60 8"/>' +
      '<path d="M52 28 L68 28" opacity=".5"/>' +
      '</svg>'
  };

  function fill() {
    document.querySelectorAll("[data-landmark]").forEach(function (el) {
      var k = el.getAttribute("data-landmark");
      if (ART[k]) el.innerHTML = ART[k];
    });
  }
  window.LANDMARKS = ART;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill);
  else fill();
})();
