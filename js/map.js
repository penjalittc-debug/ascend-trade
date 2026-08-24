/* ==========================================================================
   ASCEND — Flat world map with animated routes to/from Azerbaijan (D3)
   ========================================================================== */
(function () {
  var WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";

  var NAMES = {
    az: { china:"Çin", russia:"Rusiya", kz:"Qazaxıstan", hub:"Azərbaycan" },
    ru: { china:"Китай", russia:"Россия", kz:"Казахстан", hub:"Азербайджан" },
    en: { china:"China", russia:"Russia", kz:"Kazakhstan", hub:"Azerbaijan" }
  };
  function lang(){ var l=localStorage.getItem("ascend_lang")||"az"; return NAMES[l]?l:"az"; }

  var HUB = { k:"hub", ll:[49.85, 40.41] };
  var ORIGINS = [
    { k:"china",  ll:[110, 35] },
    { k:"russia", ll:[37.6, 55.8] },
    { k:"kz",     ll:[71.4, 51.1] }
  ];
  // outgoing (hub -> world): Europe, Gulf, Central/East
  var OUT = [ [13.4, 52.5], [55.3, 25.3], [100, 30] ];

  var HL = { China:1, Russia:1, Kazakhstan:1 };

  function build(el) {
    var d3 = window.d3, topojson = window.topojson;
    if (!d3 || !topojson) return;
    var w = el.clientWidth, h = el.clientHeight || Math.round(el.clientWidth * 0.72);

    var svg = d3.select(el).append("svg")
      .attr("width", "100%").attr("height", "100%")
      .attr("viewBox", "0 0 " + w + " " + h)
      .attr("preserveAspectRatio", "xMidYMid meet");

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var vis = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }, { threshold: 0.01 }).observe(el);
    }
    d3.json(WORLD_URL).then(function (world) {
      var feats = topojson.feature(world, world.objects.countries).features;
      var region = { type:"Polygon", coordinates:[[[6,74],[142,74],[142,0],[6,0],[6,74]]] };
      var proj = d3.geoNaturalEarth1().fitSize([w, h], region);
      var path = d3.geoPath(proj);

      // land
      svg.append("g").selectAll("path").data(feats).join("path")
        .attr("d", path)
        .attr("fill", function (d) {
          var n = d.properties && d.properties.name;
          if (n === "Azerbaijan") return "#b3252b";
          return HL[n] ? "#2c5290" : "#1c355e";
        })
        .attr("stroke", "rgba(255,255,255,.14)")
        .attr("stroke-width", 0.6);

      // arcs
      function arc(a, b, color, r) {
        var inter = d3.geoInterpolate(a, b);
        var steps = d3.range(0, 1.0001, 0.02).map(function (t) { return inter(t); });
        var line = { type:"LineString", coordinates: steps };
        var p = svg.append("path").attr("d", path(line))
          .attr("fill", "none").attr("stroke", color)
          .attr("stroke-width", 1.4).attr("stroke-dasharray", "3 5")
          .attr("stroke-linecap", "round").attr("opacity", 0.7);
        if (reduce) return;
        var node = p.node(); var len = node.getTotalLength() || 1;
        var dot = svg.append("circle").attr("r", r).attr("fill", "#fff");
        var off = Math.random();
        function tick() {
          if (vis) {
            off = (off + 0.0045) % 1;
            var pt = node.getPointAtLength(off * len);
            dot.attr("cx", pt.x).attr("cy", pt.y);
          }
          requestAnimationFrame(tick);
        }
        tick();
      }
      OUT.forEach(function (o) { arc(HUB.ll, o, "#5c8fd6", 2.0); });
      ORIGINS.forEach(function (p) { arc(p.ll, HUB.ll, "#e9b7b9", 2.4); });

      // markers + labels
      var L = NAMES[lang()];
      ORIGINS.concat([HUB]).forEach(function (pt) {
        var xy = proj(pt.ll); if (!xy) return;
        var g = svg.append("g").attr("data-k", pt.k);
        if (pt.k === "hub" && !reduce) {
          var ring = g.append("circle").attr("cx", xy[0]).attr("cy", xy[1]).attr("r", 6)
            .attr("fill", "none").attr("stroke", "#c23439").attr("stroke-width", 1.5).attr("opacity", 0.7);
          var t0 = performance.now();
          (function pulse() {
            if (vis) {
              var s = (performance.now() - t0) % 1800 / 1800;
              ring.attr("r", 6 + s * 10).attr("opacity", 0.7 * (1 - s));
            }
            requestAnimationFrame(pulse);
          })();
        }
        g.append("circle").attr("cx", xy[0]).attr("cy", xy[1])
          .attr("r", pt.k === "hub" ? 5 : 3.4)
          .attr("fill", pt.k === "hub" ? "#e23b41" : "#f0c3c5")
          .attr("stroke", "#0e1a30").attr("stroke-width", 1);
        g.append("text").attr("x", xy[0]).attr("y", xy[1] - 9)
          .attr("text-anchor", "middle")
          .attr("class", "map-lbl" + (pt.k === "hub" ? " hub" : ""))
          .text(L[pt.k]);
      });

      // relabel on language change
      var last = lang();
      setInterval(function () {
        var cl = lang(); if (cl === last) return; last = cl;
        var dict = NAMES[cl];
        svg.selectAll("g[data-k]").each(function () {
          var g = d3.select(this), k = g.attr("data-k");
          g.select("text").text(dict[k]);
        });
      }, 400);
    }).catch(function () { el.classList.add("map-failed"); });
  }

  function init() {
    var els = document.querySelectorAll(".world-map");
    if (!els.length) return;
    els.forEach(build);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
