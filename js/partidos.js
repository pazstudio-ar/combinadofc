/* ===== PÁGINA PARTIDOS ===== */

let todos = [];
let posiciones = [];
let torneoActual = 'todos';
let nombres = {};
let fotos = {};
let escudos = {};

function textoGoleadores(p) {
  if (p.goles && Object.keys(p.goles).length) {
    return Object.entries(p.goles)
      .map(([id, n]) => (n > 1 ? `${nombres[id] || id} (${n})` : (nombres[id] || id)))
      .join(', ');
  }
  return p.goleadores || '';
}

// Para agrupar torneos aunque cambie una mayúscula o un espacio
const clave = t => String(t || 'Sin torneo').trim().toLowerCase();
const nombreTorneo = p => String(p.torneo || 'Sin torneo').trim();

function listarTorneos(partidos) {
  const mapa = new Map();
  partidos.forEach(p => {
    const k = clave(p.torneo);
    const f = parsearFecha(p.fecha);
    if (!mapa.has(k)) mapa.set(k, { clave: k, nombre: nombreTorneo(p), ultima: f });
    else if (f > mapa.get(k).ultima) mapa.get(k).ultima = f;
  });
  // El más reciente primero
  return [...mapa.values()].sort((a, b) => b.ultima - a.ultima);
}

function partidosFiltrados() {
  return torneoActual === 'todos'
    ? todos
    : todos.filter(p => clave(p.torneo) === torneoActual);
}

/* ----- Piezas ----- */

// Escudo del equipo: usa data/equipos.json si existe, y si no, un círculo con las iniciales
function escudoEquipo(nombre) {
  const e = escudos[clave(nombre)];
  if (e) {
    return `<img class="mc-escudo" src="${esc(e)}" alt="Escudo ${esc(nombre)}" loading="lazy"
                 onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'mc-escudo mc-iniciales',textContent:'${esc(iniciales(nombre))}'}))">`;
  }
  return `<span class="mc-escudo mc-iniciales" aria-hidden="true">${esc(iniciales(nombre))}</span>`;
}

function iniciales(nombre) {
  const pal = String(nombre).replace(/\bfc\b/ig, '').trim().split(/\s+/).filter(Boolean);
  return (pal.length > 1 ? pal[0][0] + pal[1][0] : String(nombre).slice(0, 2)).toUpperCase();
}

function filaPartido(p, mostrarTorneo) {
  const jugado = p.estado === 'jugado';
  const r = jugado ? resultadoDe(p) : null;
  const etiqueta = { V: 'Victoria', E: 'Empate', D: 'Derrota' }[r] || 'Próximo';

  const fechaTxt = fechaLarga(p.fecha) + (p.hora ? ` · ${esc(p.hora)} hs` : '');
  const cab = [esc(nombreTorneo(p)), p.lugar ? '📍 ' + esc(p.lugar) : '']
    .filter(Boolean).join(' · ');

  const centro = jugado
    ? `<div class="mc-marcador">${p.golesFavor}<span>-</span>${p.golesContra}</div>
       ${p.penales ? `<small class="mc-pen">Penales ${esc(p.penales)}</small>` : ''}`
    : `<div class="mc-vs">VS</div>`;

  const pie = [];
  const textoGol = textoGoleadores(p);
  if (jugado && p.figura) {
    const foto = fotos[p.figura];
    pie.push(`<span class="mc-figura">${foto ? `<img src="${esc(foto)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      ⭐ Figura: <b>${esc(nombres[p.figura] || p.figura)}</b></span>`);
  }
  if (jugado && textoGol) pie.push(`<span>⚽ ${esc(textoGol)}</span>`);
  if (p.noticia) pie.push(`<a href="noticia.html?id=${encodeURIComponent(p.noticia)}">Leer la crónica →</a>`);

  return `
    <article class="match-card ${r || 'prox'}">
      <header class="mc-cab">
        <span class="mc-torneo">${cab}</span>
        <span class="mc-estado">${etiqueta}</span>
      </header>
      <div class="mc-cuerpo">
        <div class="mc-equipo"><img class="mc-escudo" src="img/logo/escudo.png" alt="Escudo Combinado FC"><b>Combinado FC</b></div>
        <div class="mc-centro">${centro}</div>
        <div class="mc-equipo">${escudoEquipo(p.rival)}<b>${esc(p.rival)}</b></div>
      </div>
      <p class="mc-fecha">${fechaTxt}</p>
      ${pie.length ? `<footer class="mc-pie">${pie.join('')}</footer>` : ''}
    </article>`;
}

function htmlStats(s) {
  const items = [
    [s.pj, 'Jugados'], [s.pg, 'Ganados'], [s.pe, 'Empatados'],
    [s.pp, 'Perdidos'], [s.gf, 'Goles a favor'], [s.gc, 'Goles en contra']
  ];
  return items.map(([n, t]) => `<div class="stat"><b>${n}</b><span>${t}</span></div>`).join('');
}

function dibujarRacha(jugados) {
  const ultimos = [...jugados]
    .sort((a, b) => parsearFecha(a.fecha) - parsearFecha(b.fecha))
    .slice(-5);
  const el = document.getElementById('racha');
  el.innerHTML = ultimos.length
    ? `<small>Últimos ${ultimos.length}</small>` +
      ultimos.map(p => `<span class="badge ${resultadoDe(p)}">${resultadoDe(p)}</span>`).join('')
    : '';
}

function dibujarTabla() {
  const bloque = document.getElementById('bloque-tabla');
  const data = torneoActual === 'todos'
    ? null
    : posiciones.find(t => clave(t.torneo) === torneoActual);

  if (!data || !data.equipos || !data.equipos.length) { bloque.hidden = true; return; }

  const filas = data.equipos.map(e => {
    const pg = e.pg || 0, pe = e.pe || 0, pp = e.pp || 0;
    // Si cargás gf y gc, la diferencia se calcula sola. Si solo tenés la diferencia, usá "dg".
    const sinGoles = e.gf === undefined && e.gc === undefined && e.dg !== undefined;
    const gf = e.gf || 0, gc = e.gc || 0;
    const dg = sinGoles ? Number(e.dg) || 0 : gf - gc;
    return { nombre: e.equipo, pj: pg + pe + pp, pg, pe, pp, gf, gc, dg, sinGoles, pts: pg * 3 + pe };
  }).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);

  document.getElementById('cuerpo-tabla').innerHTML = filas.map((f, i) => `
    <tr class="${clave(f.nombre).includes('combinado') ? 'nosotros' : ''}">
      <td>${i + 1}</td>
      <td class="izq eq">${esc(f.nombre)}</td>
      <td>${f.pj}</td><td>${f.pg}</td><td>${f.pe}</td><td>${f.pp}</td>
<td>${f.dg > 0 ? '+' : ''}${f.dg}</td>
      <td class="pts">${f.pts}</td>
    </tr>`).join('');
  bloque.hidden = false;
}

/* ----- Dibujar todo según el torneo elegido ----- */

function dibujar() {
  const lista = partidosFiltrados();
  const mostrarTorneo = torneoActual === 'todos';
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

  const jugados = lista
    .filter(p => p.estado === 'jugado')
    .sort((a, b) => parsearFecha(b.fecha) - parsearFecha(a.fecha));

  const proximos = lista
    .filter(p => p.estado === 'proximo' && parsearFecha(p.fecha) >= hoy)
    .sort((a, b) => parsearFecha(a.fecha) - parsearFecha(b.fecha));

  document.getElementById('stats').innerHTML = htmlStats(calcularStats(lista));
  dibujarRacha(jugados);

  document.getElementById('bloque-proximos').hidden = proximos.length === 0;
  document.getElementById('lista-proximos').innerHTML =
    proximos.map(p => filaPartido(p, mostrarTorneo)).join('');

  dibujarTabla();

  document.getElementById('lista-resultados').innerHTML = jugados.length
    ? jugados.map(p => filaPartido(p, mostrarTorneo)).join('')
    : '<p class="mensaje-vacio">Todavía no hay resultados cargados para este torneo.</p>';
}

async function iniciarPartidos() {
  try {
        let jugs, eqs;
    [todos, posiciones, jugs, eqs] = await Promise.all([
      cargarJSON('data/partidos.json'),
      cargarJSON('data/posiciones.json').catch(() => []),
      cargarJSON('data/jugadores.json').catch(() => []),
      cargarJSON('data/equipos.json').catch(() => [])
    ]);
    jugs.forEach(j => { nombres[j.id] = j.nombre; fotos[j.id] = j.foto; });
    eqs.forEach(e => { if (e.nombre && e.escudo) escudos[clave(e.nombre)] = e.escudo; });
  } catch (e) {
    console.error(e);
    document.getElementById('lista-resultados').innerHTML =
      '<p class="mensaje-vacio">No se pudieron cargar los partidos. Revisá data/partidos.json.</p>';
    return;
  }

  // Aviso solo para vos (consola, F12): partidos que ya pasaron y siguen como "proximo"
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  todos.filter(p => p.estado === 'proximo' && parsearFecha(p.fecha) < hoy)
       .forEach(p => console.warn(`⚠️ Falta cargar el resultado de ${p.rival} (${p.fecha})`));

  const torneos = listarTorneos(todos);
  const selector = document.getElementById('selector-torneo');
  selector.innerHTML =
    torneos.map(t => `<option value="${esc(t.clave)}">${esc(t.nombre)}</option>`).join('') +
    `<option value="todos">Todos los partidos</option>`;

  // Por defecto: el torneo más reciente (o el que venga en el link)
  const pedido = new URLSearchParams(location.search).get('torneo');
  const existe = v => v === 'todos' || torneos.some(t => t.clave === v);
  torneoActual = pedido && existe(clave(pedido)) ? clave(pedido) : (torneos[0] ? torneos[0].clave : 'todos');
  selector.value = torneoActual;

  selector.addEventListener('change', () => {
    torneoActual = selector.value;
    history.replaceState(null, '', `?torneo=${encodeURIComponent(torneoActual)}`);
    dibujar();
  });

  dibujar();
}

document.addEventListener('DOMContentLoaded', iniciarPartidos);