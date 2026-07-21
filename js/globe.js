/* ==========================================================================
   ASCEND — Interactive delivery globe (three.js r128)
   Countries → arcs → Azerbaijan hub
   ========================================================================== */
(function () {
  function init() {
    if (!window.THREE) return;
    var wrap = document.getElementById("globe");
    if (!wrap) return;

    var NAMES = {
      az: { china:"Çin", turkey:"Türkiyə", iran:"İran", russia:"Rusiya", kz:"Qazaxıstan", hub:"Azərbaycan" },
      ru: { china:"Китай", turkey:"Турция", iran:"Иран", russia:"Россия", kz:"Казахстан", hub:"Азербайджан" },
      en: { china:"China", turkey:"Türkiye", iran:"Iran", russia:"Russia", kz:"Kazakhstan", hub:"Azerbaijan" }
    };
    function lang(){ var l=(localStorage.getItem("ascend_lang")||"az"); return NAMES[l]?l:"az"; }

    var W = function(){ return wrap.clientWidth; };
    var H = function(){ return wrap.clientHeight || wrap.clientWidth; };

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 3.15);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W(), H());
    wrap.appendChild(renderer.domElement);

    var root = new THREE.Group(); scene.add(root);   // holds atmosphere (no spin)
    var globe = new THREE.Group(); root.add(globe);   // spins
    var R = 1;

    // base sphere
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(R, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0x1b2f52, emissive: 0x0d1830, emissiveIntensity: 0.55, shininess: 14, specular: 0x2a4c82 })
    ));
    // atmosphere glow
    root.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.16, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x3a63ad, transparent: true, opacity: 0.10, side: THREE.BackSide })
    ));

    // graticule
    var gmat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });
    function ll(lat, lon, r) {
      var phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
      return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
    }
    var gr = R * 1.001;
    for (var lat = -60; lat <= 60; lat += 30) {
      var pts = [];
      for (var lo = 0; lo <= 360; lo += 6) pts.push(ll(lat, lo, gr));
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gmat));
    }
    for (var lon = 0; lon < 360; lon += 30) {
      var p2 = [];
      for (var la = -90; la <= 90; la += 6) p2.push(ll(la, lon, gr));
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p2), gmat));
    }

    // points
    var L = NAMES[lang()];
    var pts = [
      { k:"china",  lat:34,   lon:108,  o:1 },
      { k:"turkey", lat:39,   lon:33,   o:1 },
      { k:"iran",   lat:33,   lon:53,   o:1 },
      { k:"russia", lat:55.7, lon:37.6, o:1 },
      { k:"kz",     lat:48,   lon:68,   o:1 },
      { k:"hub",    lat:40.4, lon:47.9, o:0, hub:1 }
    ];
    var az = ll(40.4, 47.9, R);
    var labels = [];

    pts.forEach(function (p) {
      var pos = ll(p.lat, p.lon, R);
      var col = p.hub ? 0xc23439 : 0xe9b7b9;
      var m = new THREE.Mesh(
        new THREE.SphereGeometry(p.hub ? 0.032 : 0.016, 16, 16),
        new THREE.MeshBasicMaterial({ color: col })
      );
      m.position.copy(pos); globe.add(m);
      if (p.hub) {
        var ring = new THREE.Mesh(
          new THREE.RingGeometry(0.05, 0.066, 40),
          new THREE.MeshBasicMaterial({ color: 0xc23439, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
        );
        ring.position.copy(pos);
        ring.lookAt(pos.clone().multiplyScalar(2));
        globe.add(ring); p.ring = ring;
      }
      var el = document.createElement("div");
      el.className = "globe-label" + (p.hub ? " hub" : "");
      el.textContent = L[p.k];
      el.dataset.k = p.k;
      wrap.appendChild(el);
      labels.push({ el: el, pos: pos });
    });

    // arcs
    var arcs = [];
    pts.filter(function (p) { return p.o; }).forEach(function (p) {
      var a = ll(p.lat, p.lon, R), b = az.clone();
      var d = a.distanceTo(b);
      var mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R + d * 0.5);
      var curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      var cp = curve.getPoints(64);
      var line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(cp),
        new THREE.LineBasicMaterial({ color: 0xe9b7b9, transparent: true, opacity: 0.45 })
      );
      globe.add(line);
      var dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      globe.add(dot);
      arcs.push({ curve: curve, dot: dot, off: Math.random() });
    });

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    var dl = new THREE.DirectionalLight(0xffffff, 0.65); dl.position.set(2, 1.2, 3); scene.add(dl);

    // orient: bring Azerbaijan to front (+Z) with a slight upward tilt
    var base = new THREE.Quaternion().setFromUnitVectors(az.clone().normalize(), new THREE.Vector3(0, 0, 1));
    base.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.15));
    var AXIS_Y = new THREE.Vector3(0, 1, 0), AXIS_X = new THREE.Vector3(1, 0, 0);
    var qSpin = new THREE.Quaternion(), qDrag = new THREE.Quaternion();

    // interaction (drag) + gentle auto-rotate
    var spin = true, drag = false, px = 0, py = 0, ry = 0, rx = 0;
    function down(e){ drag = true; spin = false; px = (e.touches?e.touches[0]:e).clientX; py = (e.touches?e.touches[0]:e).clientY; }
    function move(e){ if(!drag) return; var c = e.touches?e.touches[0]:e; ry += (c.clientX-px)*0.006; rx += (c.clientY-py)*0.006; rx=Math.max(-0.7,Math.min(0.7,rx)); px=c.clientX; py=c.clientY; }
    function up(){ drag = false; setTimeout(function(){ spin = true; }, 2500); }
    renderer.domElement.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    renderer.domElement.addEventListener("touchstart", down, {passive:true});
    window.addEventListener("touchmove", move, {passive:true});
    window.addEventListener("touchend", up);

    // resize
    function resize(){ var w=W(), h=H(); renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); }
    window.addEventListener("resize", resize); resize();

    // relabel on language change
    var lastLang = lang();
    function maybeRelabel(){
      var cl = lang(); if (cl === lastLang) return; lastLang = cl;
      var dict = NAMES[cl];
      labels.forEach(function(o){ o.el.textContent = dict[o.el.dataset.k]; });
    }

    // visibility pause
    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function(en){ visible = en[0].isIntersecting; }, { threshold: 0.05 })
        .observe(wrap);
    }

    var tmp = new THREE.Vector3(), clock = performance.now();
    function frame() {
      requestAnimationFrame(frame);
      if (!visible) { clock = performance.now(); return; }
      var now = performance.now(), dt = Math.min((now - clock) / 1000, 0.05); clock = now;

      if (spin) ry += dt * 0.12;
      qSpin.setFromAxisAngle(AXIS_Y, ry);
      qDrag.setFromAxisAngle(AXIS_X, rx);
      globe.quaternion.copy(qDrag).multiply(base).multiply(qSpin);
      globe.updateMatrixWorld(true);

      // arc flow
      arcs.forEach(function (a) {
        a.off = (a.off + dt * 0.12) % 1;
        a.dot.position.copy(a.curve.getPoint(a.off));
      });
      // hub pulse
      pts.forEach(function (p) {
        if (p.ring) { var s = 1 + 0.25 * (0.5 + 0.5 * Math.sin(now * 0.004)); p.ring.scale.set(s, s, s); p.ring.material.opacity = 0.65 - 0.4 * (s - 1); }
      });

      renderer.render(scene, camera);

      // labels
      maybeRelabel();
      var w = W(), h = H();
      labels.forEach(function (o) {
        tmp.copy(o.pos).applyMatrix4(globe.matrixWorld);
        var normal = tmp.clone().normalize();
        var toCam = camera.position.clone().sub(tmp).normalize();
        var facing = normal.dot(toCam) > 0.05;
        tmp.project(camera);
        var x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
        o.el.style.transform = "translate(-50%,-50%) translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
        o.el.style.opacity = facing ? "1" : "0";
      });
    }
    frame();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
