/* ===== PÁGINA DE INICIO ===== */

function tarjetaProximo(p) {
  if (!p) {
    return `
      <article class="partido-card">
        <span class="etiqueta">Próximo partido</span>
        <h3>A confirmar</h3>
        <p class="meta">Todavía no hay un partido programado. ¡Seguinos en redes!</p>
      </article>`;
  }
  const partes = [`📅 ${fechaLarga(p.fecha)}`];
  if (p.hora) partes.push(`🕖 ${esc(p.hora)} hs`);
  if (p.lugar) partes.push(`📍 ${esc(p.lugar)}`);
  return `
    <article class="partido-card">
      <span class="etiqueta">Próximo partido</span>
      <h3>Combinado FC <span class="vs">vs</span> ${esc(p.rival)}</h3>
      <p class="meta">${partes.join(' &nbsp;·&nbsp; ')}</p>
      <p class="torneo">${esc(p.torneo)}</p>
    </article>`;
}

function tarjetaUltimo(p) {
  if (!p) {
    return `
      <article class="partido-card">
        <span class="etiqueta">Último resultado</span>
        <h3>Sin partidos jugados</h3>
      </article>`;
  }
  const pen = p.penales ? `<small>Penales: ${esc(p.penales)}</small>` : '';
  return `
    <article class="partido-card">
      <span class="etiqueta">Último resultado</span>
      <h3>Combinado FC <span class="vs">vs</span> ${esc(p.rival)}</h3>
      <div class="marcador ${resultadoDe(p)}">${p.golesFavor} - ${p.golesContra}
        <span class="badge ${resultadoDe(p)}">${resultadoDe(p)}</span>${pen}
      </div>
      <p class="meta">${fechaLarga(p.fecha)}</p>
      <p class="torneo">${esc(p.torneo)}</p>
    </article>`;
}

function htmlStats(s) {
  const items = [
    [s.pj, 'Jugados'], [s.pg, 'Ganados'], [s.pe, 'Empatados'],
    [s.pp, 'Perdidos'], [s.gf, 'Goles a favor'], [s.gc, 'Goles en contra']
  ];
  return items.map(([n, t]) => `<div class="stat"><b>${n}</b><span>${t}</span></div>`).join('');
}

function htmlJugador(j) {
  const tieneNum = j.numero !== undefined && j.numero !== null && j.numero !== '';
  return `
    <article class="jugador">
      <img src="${esc(j.foto)}" alt="${esc(j.nombre)}, ${esc(textoPosiciones(j))} de Combinado FC" loading="lazy"
           onerror="this.src='img/logo/escudo.png'">
      ${tieneNum ? `<span class="numero">#${esc(j.numero)}</span>` : ''}
      <div class="info"><h4>${esc(j.nombre)}</h4><p>${esc(textoPosiciones(j))}</p></div>
    </article>`;
}

function htmlNoticia(n) {
  return `
    <a class="noticia" href="noticia.html?id=${encodeURIComponent(n.id)}">
      <img src="${esc(n.imagen)}" alt="${esc(n.titulo)}" loading="lazy"
           onerror="this.src='img/logo/escudo.png'">
      <div class="cuerpo">
        <span class="cat">${esc(n.categoria)}</span>
        <h3>${esc(n.titulo)}</h3>
        <p>${esc(n.resumen)}</p>
        <span class="fecha">${fechaCorta(n.fecha)}</span>
      </div>
    </a>`;
}

/* ===== PORTADA CON MOVIMIENTO ===== */

function slideUltimo(p, porId) {
  if (!p) return '';
  const r = resultadoDe(p);
  const f = p.figura && porId[p.figura];
  const etiqueta = { V: 'Victoria', E: 'Empate', D: 'Derrota' }[r];
  return `
    <article class="slide slide-partido ${r}">
      <span class="slide-etq">Último partido · ${etiqueta}</span>
      <div class="sp-linea">
        <span class="sp-eq">Combinado FC</span>
        <b class="sp-goles">${p.golesFavor} - ${p.golesContra}</b>
        <span class="sp-eq">${esc(p.rival)}</span>
      </div>
      <p class="slide-meta">${fechaLarga(p.fecha)} · ${esc(p.torneo)}</p>
      ${f ? `<p class="sp-figura"><img src="${esc(f.foto)}" alt="" onerror="this.remove()"> ⭐ Figura: <b>${esc(f.nombre)}</b></p>` : ''}
      <a class="boton" href="${p.noticia ? 'noticia.html?id=' + encodeURIComponent(p.noticia) : 'partidos.html'}">
        ${p.noticia ? 'Leer la crónica' : 'Ver todos los partidos'}</a>
    </article>`;
}

function slideProximo(p) {
  if (!p) return '';
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const esHoy = parsearFecha(p.fecha).getTime() === hoy.getTime();
  const partes = [fechaLarga(p.fecha)];
  if (p.hora) partes.push(`${esc(p.hora)} hs`);
  if (p.lugar) partes.push(`📍 ${esc(p.lugar)}`);
  return `
    <article class="slide slide-partido prox">
      <span class="slide-etq">${esHoy ? '¡Hoy juega Combinado!' : 'Próximo partido'}</span>
      <div class="sp-linea">
        <span class="sp-eq">Combinado FC</span>
        <b class="sp-goles">VS</b>
        <span class="sp-eq">${esc(p.rival)}</span>
      </div>
      <p class="slide-meta">${partes.join(' · ')}</p>
      <p class="slide-meta">${esc(p.torneo)}</p>
      <a class="boton" href="partidos.html">Ver partidos</a>
    </article>`;
}

function slideNoticia(n) {
  if (!n) return '';
  return `
    <article class="slide slide-noticia">
      <img class="slide-fondo" src="${esc(n.imagen)}" alt="" onerror="this.remove()">
      <div class="slide-velo"></div>
      <div class="slide-texto">
        <span class="slide-etq">${esc(n.categoria)} · ${fechaCorta(n.fecha)}</span>
        <h2>${esc(n.titulo)}</h2>
        <p>${esc(n.resumen)}</p>
        <a class="boton" href="noticia.html?id=${encodeURIComponent(n.id)}">Leer más</a>
      </div>
    </article>`;
}

function iniciarPortada(slides) {
  const lista = slides.filter(Boolean);
  const cont = document.getElementById('portada');
  if (!cont || !lista.length) return;

  const pista = document.getElementById('portada-pista');
  const puntos = document.getElementById('portada-puntos');
  pista.innerHTML = lista.join('');
  puntos.innerHTML = lista.map((_, i) => `<button aria-label="Ir a la diapositiva ${i + 1}" data-i="${i}"></button>`).join('');
  cont.hidden = false;

  let actual = 0, timer = null;
  const total = lista.length;

  function ir(i) {
    actual = (i + total) % total;
    pista.style.transform = `translateX(-${actual * 100}%)`;
    [...pista.children].forEach((s, k) => s.setAttribute('aria-hidden', k === actual ? 'false' : 'true'));
    [...puntos.children].forEach((b, k) => b.classList.toggle('activo', k === actual));
  }
  function iniciarAuto() {
    detener();
    if (total < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer = setInterval(() => ir(actual + 1), 6000);
  }
  function detener() { clearInterval(timer); timer = null; }

  if (total < 2) {
    document.getElementById('portada-ant').hidden = true;
    document.getElementById('portada-sig').hidden = true;
    puntos.hidden = true;
  }

  document.getElementById('portada-ant').addEventListener('click', () => { ir(actual - 1); iniciarAuto(); });
  document.getElementById('portada-sig').addEventListener('click', () => { ir(actual + 1); iniciarAuto(); });
  puntos.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) { ir(Number(b.dataset.i)); iniciarAuto(); }
  });

  // Pausa al pasar el mouse o enfocar con teclado
  cont.addEventListener('mouseenter', detener);
  cont.addEventListener('mouseleave', iniciarAuto);
  cont.addEventListener('focusin', detener);
  cont.addEventListener('focusout', iniciarAuto);

  // Deslizar con el dedo
  let x0 = 0;
  cont.addEventListener('touchstart', e => { x0 = e.changedTouches[0].clientX; detener(); }, { passive: true });
  cont.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) ir(actual + (dx < 0 ? 1 : -1));
    iniciarAuto();
  }, { passive: true });

  ir(0);
  iniciarAuto();
}

async function iniciarInicio() {
  try {
    const [partidos, jugadores, noticias] = await Promise.all([
      cargarJSON('data/partidos.json'),
      cargarJSON('data/jugadores.json'),
      cargarJSON('data/noticias.json')
    ]);

    // Próximo partido: el más cercano que todavía no pasó
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const proximo = partidos
      .filter(p => p.estado === 'proximo' && parsearFecha(p.fecha) >= hoy)
      .sort((a, b) => parsearFecha(a.fecha) - parsearFecha(b.fecha))[0];

    // Último resultado: el jugado más reciente
    const ultimo = partidos
      .filter(p => p.estado === 'jugado')
      .sort((a, b) => parsearFecha(b.fecha) - parsearFecha(a.fecha))[0];

    document.getElementById('partidos-destacados').innerHTML =
      tarjetaProximo(proximo) + tarjetaUltimo(ultimo);

    document.getElementById('stats').innerHTML = htmlStats(calcularStats(partidos));

    document.getElementById('plantel').innerHTML =
      jugadores.slice(0, 4).map(htmlJugador).join('');

    const ultimas = [...noticias]
      .sort((a, b) => parsearFecha(b.fecha) - parsearFecha(a.fecha))
      .slice(0, 3);

    // Portada con movimiento: último partido, noticia, próximo partido, otra noticia
    const porId = {}; jugadores.forEach(x => { porId[x.id] = x; });
    iniciarPortada([slideUltimo(ultimo, porId), slideNoticia(ultimas[0]), slideProximo(proximo), slideNoticia(ultimas[1])]);
    document.getElementById('noticias').innerHTML = ultimas.map(htmlNoticia).join('');

  } catch (e) {
    console.error(e);
    document.getElementById('partidos-destacados').innerHTML =
      '<p class="mensaje-vacio">No se pudieron cargar los datos. Revisá los archivos de la carpeta data.</p>';
  }
}

document.addEventListener('DOMContentLoaded', iniciarInicio);