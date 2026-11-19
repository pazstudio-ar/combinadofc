/* ===== PAPELITOS (verdes y dorados) en la portada =====
   Canvas liviano: pocas piezas, se pausa fuera de pantalla y respeta "reducir movimiento". */
(function () {
  const hero = document.querySelector('.hero, .banner');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'papelitos';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);
  const ctx = canvas.getContext('2d');

  const COLORES = ['#19c25a', '#2ee37a', '#0d6b34', '#f5b73b', '#ffd46b', '#d9a21f'];
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, dpr = 1, piezas = [], raf = 0, visible = true, ultimo = 0;

  function nueva(enTodaLaPantalla) {
    const prof = Math.random();                       // 0 = lejos, 1 = cerca
    return {
      x: Math.random() * w,
      y: enTodaLaPantalla ? Math.random() * h : -20,
      ancho: 5 + prof * 7,
      alto: 8 + prof * 10,
      vy: 18 + prof * 38,                             // px por segundo
      deriva: (Math.random() - .5) * 18,
      vaiven: 6 + Math.random() * 14,
      fase: Math.random() * Math.PI * 2,
      giro: Math.random() * Math.PI * 2,
      vgiro: 1.2 + Math.random() * 2.4,
      rot: Math.random() * Math.PI,
      color: COLORES[(Math.random() * COLORES.length) | 0],
      alfa: .35 + prof * .5
    };
  }

  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cantidad = Math.max(18, Math.min(70, Math.round((w * h) / 16000)));
    piezas = Array.from({ length: cantidad }, () => nueva(true));
  }

  function dibujar(t) {
    ctx.clearRect(0, 0, w, h);
    for (const p of piezas) {
      const x = p.x + Math.sin(t * .001 * (p.vaiven / 6) + p.fase) * p.vaiven;
      const escala = Math.cos(p.giro);                // simula que gira en el aire
      ctx.save();
      ctx.translate(x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.abs(escala) < .15 ? .15 : escala);
      ctx.globalAlpha = p.alfa;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto);
      ctx.restore();
    }
  }

  function paso(t) {
    const dt = Math.min((t - ultimo) / 1000 || 0, .05);
    ultimo = t;
    for (let i = 0; i < piezas.length; i++) {
      const p = piezas[i];
      p.y += p.vy * dt; p.x += p.deriva * dt; p.giro += p.vgiro * dt;
      if (p.y > h + 20) piezas[i] = nueva(false);
    }
    dibujar(t);
    raf = requestAnimationFrame(paso);
  }

  function arrancar() { if (!raf && visible && !document.hidden && !reducir) { ultimo = performance.now(); raf = requestAnimationFrame(paso); } }
  function parar() { cancelAnimationFrame(raf); raf = 0; }

  medir();
  if (reducir) dibujar(0); else arrancar();

  let temp;
  window.addEventListener('resize', () => { clearTimeout(temp); temp = setTimeout(() => { medir(); if (reducir) dibujar(0); }, 150); });
  document.addEventListener('visibilitychange', () => (document.hidden ? parar() : arrancar()));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? arrancar() : parar(); }).observe(hero);
  }
})();
