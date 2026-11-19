/* ===== FUNCIONES COMPARTIDAS ===== */

async function cargarJSON(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error('No se pudo cargar ' + ruta);
  return r.json();
}

// Evita que un texto con símbolos raros rompa la página
function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// "2025-10-06" -> objeto Date (sin problemas de zona horaria)
function parsearFecha(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

function fechaLarga(iso) {
  const t = parsearFecha(iso).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function fechaCorta(iso) {
  return parsearFecha(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function precio(n) {
  return '$' + Number(n).toLocaleString('es-AR');
}

// Devuelve 'V', 'E' o 'D' para un partido jugado
function resultadoDe(p) {
  if (p.golesFavor > p.golesContra) return 'V';
  if (p.golesFavor < p.golesContra) return 'D';
  return 'E'; // empate (aunque se haya definido por penales)
}

function calcularStats(partidos) {
  const jugados = partidos.filter(p => p.estado === 'jugado');
  const s = { pj: jugados.length, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 };
  jugados.forEach(p => {
    s.gf += p.golesFavor;
    s.gc += p.golesContra;
    const r = resultadoDe(p);
    if (r === 'V') s.pg++; else if (r === 'D') s.pp++; else s.pe++;
  });
  return s;
}

/* ===== CABECERA Y PIE ===== */

const PAGINAS = [
  { id: 'inicio',   texto: 'Inicio',   url: 'index.html' },
  { id: 'equipo',   texto: 'Equipo',   url: 'equipo.html' },
  { id: 'partidos', texto: 'Partidos', url: 'partidos.html' },
  { id: 'estadisticas', texto: 'Estadísticas', url: 'estadisticas.html' },
  { id: 'noticias', texto: 'Noticias', url: 'noticias.html' },
  { id: 'tienda',   texto: 'Tienda',   url: 'tienda.html' },
  { id: 'contacto', texto: 'Contacto', url: 'contacto.html' }
];

function construirCabecera(cfg) {
  const actual = document.body.dataset.pagina;
  const links = PAGINAS.map(p =>
    `<a href="${p.url}" class="${p.id === actual ? 'activo' : ''}">${p.texto}</a>`
  ).join('');

  document.getElementById('cabecera').innerHTML = `
    <div class="contenedor">
      <a href="index.html" class="marca">
        <img src="${esc(cfg.escudo)}" alt="Escudo ${esc(cfg.nombre)}">
        <span>${esc(cfg.nombre)}</span>
      </a>
      <nav class="nav" id="nav">${links}</nav>
      <button class="menu-btn" id="menu-btn" aria-label="Abrir menú">${icono('menu', 24)}</button>
    </div>`;

  document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('nav').classList.toggle('abierto');
  });
}

/* Íconos de línea (en vez de emojis) */
const ICONOS = {
  menu:      '<path d="M4 7h16M4 12h16M4 17h16"/>',
  cerrar:    '<path d="M6 6l12 12M18 6L6 18"/>',
  whatsapp:  '<path d="M4 20l1.3-4.2A8 8 0 1 1 8.2 18.8L4 20z"/><path d="M9 9.5c.3 2.5 2.5 4.7 5 5l1.2-1.2-1.7-1-.8.7a3.5 3.5 0 0 1-1.7-1.7l.7-.8-1-1.7L9 9.5z"/>',
  instagram: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".6"/>',
  youtube:   '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M10.5 9.5v5l4-2.5-4-2.5z"/>',
  mail:      '<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M4 7l8 6 8-6"/>'
};
function icono(nombre, tam = 22) {
  return `<svg class="ico-svg" viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[nombre] || ''}</svg>`;
}

function construirPie(cfg) {
  const links = PAGINAS.map(p => `<li><a href="${p.url}">${p.texto}</a></li>`).join('');
  document.getElementById('pie').innerHTML = `
    <div class="contenedor">
      <div class="pie-grid">
        <div>
          <a href="index.html" class="marca">
            <img src="${esc(cfg.escudo)}" alt="Escudo ${esc(cfg.nombre)}">
            <span>${esc(cfg.nombre)}</span>
          </a>
          <p class="desc">${esc(cfg.descripcion)}</p>
        </div>
        <div><h5>Navegación</h5><ul>${links}</ul></div>
        <div>
          <h5>Seguinos</h5>
          <ul>
            <li><a href="${esc(cfg.redes.instagram)}" target="_blank" rel="noopener">Instagram</a></li>
            <li><a href="${esc(cfg.redes.youtube)}" target="_blank" rel="noopener">YouTube</a></li>
            <li><a href="https://wa.me/${esc(cfg.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a></li>
          </ul>
        </div>
      </div>
      <p class="pie-copy">© ${new Date().getFullYear()} ${esc(cfg.nombre)} — Todos los derechos reservados</p>
    </div>`;
}

// Se ejecuta en todas las páginas
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const cfg = await cargarJSON('data/config.json');
    construirCabecera(cfg);
    construirPie(cfg);
  } catch (e) {
    console.error(e);
  }
});

/* ===== POSICIONES Y ESTADÍSTICAS DE JUGADORES ===== */

// Acepta "posiciones": ["Arquero","Defensor"] o el viejo "posicion": "Defensor"
function posicionesDe(j) {
  const lista = Array.isArray(j.posiciones) ? j.posiciones : (j.posicion ? [j.posicion] : []);
  return lista.filter(Boolean);
}

function textoPosiciones(j) {
  return posicionesDe(j).join(' / ') || 'Jugador';
}

// Suma las estadísticas de cada jugador a partir de los partidos jugados
function estadisticasJugadores(partidos) {
  const m = {};
  const get = id => m[id] || (m[id] = { pj: 0, g: 0, a: 0, am: 0, ro: 0, fig: 0, arq: 0, gc: 0, vi: 0 });

  partidos.filter(p => p.estado === 'jugado').forEach(p => {
    const goles = p.goles || {};
    const asist = p.asistencias || {};

    // Cuenta como "jugó" quien figura en cualquiera de estos campos
    const presentes = new Set([
      ...(p.jugaron || []), ...Object.keys(goles), ...Object.keys(asist),
      ...(p.amarillas || []), ...(p.rojas || [])
    ]);
    if (p.arquero) presentes.add(p.arquero);
    if (p.figura) presentes.add(p.figura);

    presentes.forEach(id => { get(id).pj++; });
    Object.entries(goles).forEach(([id, n]) => { get(id).g += Number(n) || 0; });
    Object.entries(asist).forEach(([id, n]) => { get(id).a += Number(n) || 0; });
    (p.amarillas || []).forEach(id => { get(id).am++; });
    (p.rojas || []).forEach(id => { get(id).ro++; });
    if (p.figura) get(p.figura).fig++;

    if (p.arquero) {
      const s = get(p.arquero);
      s.arq++;
      s.gc += Number(p.golesContra) || 0;
      if ((Number(p.golesContra) || 0) === 0) s.vi++;
    }
  });
  return m;
}