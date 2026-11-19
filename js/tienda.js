/* ===== TIENDA ===== */

const CLAVE_CARRITO = 'combinado-carrito';
let productos = [];
let config = {};
let categoriaActual = 'Todos';
let busqueda = '';
let orden = 'relevantes';
let carrito = leerCarrito();   // [{ id, talle, cant }]

/* ----- Guardado en el celular del cliente ----- */

function leerCarrito() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}
function guardarCarrito() {
  try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito)); } catch { /* sin guardado */ }
}

/* ----- Productos ----- */

function tarjetaProducto(p) {
  const agotado = p.disponible === false;
  const talles = (p.talles || []).map(t =>
    `<button type="button" class="talle" data-talle="${esc(t)}">${esc(t)}</button>`).join('');

  const antes = Number(p.precioAnterior) > Number(p.precio) ? Number(p.precioAnterior) : 0;
  const off = antes ? Math.round((1 - p.precio / antes) * 100) : 0;

  return `
    <article class="producto ${agotado ? 'agotado' : ''}" data-id="${esc(p.id)}">
      <div class="producto-img">
        <img src="${esc(p.imagen)}" alt="${esc(p.nombre)}${p.detalle ? ' — ' + esc(p.detalle) : ''}" loading="lazy"
             onerror="this.src='img/logo/escudo.png'">
        ${agotado ? '<span class="sello">Agotado</span>' : ''}
      </div>
      <div class="producto-info">
        <small class="p-cat">${esc(p.categoria || '')}</small>
        <h3>${esc(p.nombre)}</h3>
        <p class="detalle">${esc(p.detalle || '')}</p>
        <p class="precio">${antes ? `<s>${precio(antes)}</s>` : ''}${precio(p.precio)}${off ? `<span class="off">${off}% OFF</span>` : ''}</p>
        <div class="p-accion">
          ${talles ? `<div class="talles" role="group" aria-label="Talles">${talles}</div>` : ''}
          <button class="boton agregar" ${agotado ? 'disabled' : ''}>${agotado ? 'Agotado' : 'Agregar al pedido'}</button>
          <small class="aviso" aria-live="polite"></small>
        </div>
      </div>
    </article>`;
}

function dibujarFiltros() {
  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
  const filtros = document.getElementById('filtros');
  if (!categorias.length) { filtros.innerHTML = ''; return; }
  filtros.innerHTML = ['Todos', ...categorias].map(c => {
    const cant = c === 'Todos' ? productos.length : productos.filter(p => p.categoria === c).length;
    return `<button class="filtro ${c === categoriaActual ? 'activo' : ''}" data-cat="${esc(c)}">${esc(c)}<small>${cant}</small></button>`;
  }).join('');
}

function productosVisibles() {
  const q = busqueda.trim().toLowerCase();
  let lista = productos.filter(p =>
    (categoriaActual === 'Todos' || p.categoria === categoriaActual) &&
    (!q || `${p.nombre} ${p.detalle || ''} ${p.categoria || ''}`.toLowerCase().includes(q)));
  if (orden === 'menor') lista = [...lista].sort((a, b) => a.precio - b.precio);
  if (orden === 'mayor') lista = [...lista].sort((a, b) => b.precio - a.precio);
  return lista;
}

function dibujarProductos() {
  const lista = productosVisibles();
  document.getElementById('ml-cant').textContent = `${lista.length} resultado${lista.length === 1 ? '' : 's'}`;
  document.getElementById('grid-productos').innerHTML =
    lista.map(tarjetaProducto).join('') || '<p class="mensaje-vacio">No encontramos productos con esa búsqueda.</p>';
}

/* ----- Carrito ----- */

function buscarProducto(id) { return productos.find(p => p.id === id); }

function agregarAlCarrito(id, talle) {
  const item = carrito.find(i => i.id === id && i.talle === talle);
  if (item) item.cant++; else carrito.push({ id, talle, cant: 1 });
  guardarCarrito();
  dibujarCarrito();
  const btn = document.getElementById('abrir-carrito');
  btn.classList.remove('salto'); void btn.offsetWidth; btn.classList.add('salto');
}

function cambiarCantidad(i, delta) {
  if (!carrito[i]) return;
  carrito[i].cant += delta;
  if (carrito[i].cant <= 0) carrito.splice(i, 1);
  guardarCarrito();
  dibujarCarrito();
}

function quitarItem(i) {
  carrito.splice(i, 1);
  guardarCarrito();
  dibujarCarrito();
}

function mensajeWhatsApp(lineas, total) {
  const detalle = lineas.map(l =>
    `• ${l.cant}x ${l.p.nombre}${l.talle ? ' (Talle ' + l.talle + ')' : ''} — ${precio(l.p.precio * l.cant)}`
  ).join('\n');
  return `¡Hola ${config.nombre || 'Combinado FC'}! Quiero hacer este pedido:\n\n${detalle}\n\nTotal: ${precio(total)}\n\nMi nombre es: `;
}

function dibujarCarrito() {
  // Se descartan productos que ya no existen en el catálogo
  carrito = carrito.filter(i => buscarProducto(i.id));
  const lineas = carrito.map(i => ({ ...i, p: buscarProducto(i.id) }));
  const cantidad = lineas.reduce((s, l) => s + l.cant, 0);
  const total = lineas.reduce((s, l) => s + l.p.precio * l.cant, 0);

  const cEl = document.getElementById('carrito-cant');
  cEl.textContent = cantidad;
  cEl.dataset.cero = cantidad ? '0' : '1';

  const items = document.getElementById('carrito-items');
  const pie = document.getElementById('carrito-pie');

  if (!lineas.length) {
    items.innerHTML = '<p class="carrito-vacio">Todavía no agregaste nada.<br>¡Elegí algo de la tienda!</p>';
    pie.innerHTML = '';
    return;
  }

  items.innerHTML = lineas.map((l, i) => `
    <div class="item-carrito">
      <img src="${esc(l.p.imagen)}" alt="${esc(l.p.nombre)}" onerror="this.src='img/logo/escudo.png'">
      <div>
        <h4>${esc(l.p.nombre)}</h4>
        ${l.talle ? `<small>Talle ${esc(l.talle)}</small>` : ''}
        <div class="cantidad">
          <button data-accion="menos" data-i="${i}" aria-label="Quitar uno">−</button>
          <b>${l.cant}</b>
          <button data-accion="mas" data-i="${i}" aria-label="Agregar uno">+</button>
        </div>
        <p class="sub">${precio(l.p.precio * l.cant)}</p>
      </div>
      <button class="item-quitar" data-accion="quitar" data-i="${i}" aria-label="Quitar del pedido">${icono('cerrar', 18)}</button>
    </div>`).join('');

  const link = `https://wa.me/${esc(config.whatsapp)}?text=${encodeURIComponent(mensajeWhatsApp(lineas, total))}`;
  pie.innerHTML = `
    <div class="total"><span>Total</span><b>${precio(total)}</b></div>
    <a class="boton" href="${link}" target="_blank" rel="noopener">Pedir por WhatsApp</a>
    <button class="vaciar" data-accion="vaciar">Vaciar pedido</button>`;
}

/* ----- Detalle del producto (se abre al tocar una carta) ----- */

let detalleId = null;

function abrirDetalle(id, actualizarHash = true) {
  const p = buscarProducto(id);
  if (!p) return;
  detalleId = id;
  const agotado = p.disponible === false;
  const fotos = (p.imagenes && p.imagenes.length ? p.imagenes : [p.imagen]).filter(Boolean);
  const antes = Number(p.precioAnterior) > Number(p.precio) ? Number(p.precioAnterior) : 0;
  const off = antes ? Math.round((1 - p.precio / antes) * 100) : 0;
  const talles = (p.talles || []).map(t => `<button type="button" class="talle" data-talle="${esc(t)}">${esc(t)}</button>`).join('');

  document.getElementById('pd-contenido').innerHTML = `
    <div class="pd-galeria">
      <img class="pd-foto" id="pd-foto" src="${esc(fotos[0])}" alt="${esc(p.nombre)}" onerror="this.src='img/logo/escudo.png'">
      ${fotos.length > 1 ? `<div class="pd-mini">${fotos.map((f, i) =>
        `<button type="button" class="${i ? '' : 'activa'}" data-foto="${esc(f)}" aria-label="Foto ${i + 1}"><img src="${esc(f)}" alt=""></button>`).join('')}</div>` : ''}
    </div>
    <div class="pd-info">
      <small class="pd-cat">${esc(p.categoria || '')}${p.detalle ? ' · ' + esc(p.detalle) : ''}</small>
      <h2 id="pd-titulo">${esc(p.nombre)}</h2>
      ${antes ? `<p class="precio-antes">${precio(antes)}</p>` : ''}
      <p class="pd-precio">${precio(p.precio)}${off ? `<span class="off">${off}% OFF</span>` : ''}</p>
      ${p.descripcion ? `<p class="pd-desc">${esc(p.descripcion)}</p>` : ''}
      ${talles ? `<p class="pd-label">Talle</p><div class="talles" role="group" aria-label="Talles">${talles}</div>` : ''}
      <button class="boton agregar" id="pd-agregar" ${agotado ? 'disabled' : ''}>${agotado ? 'Agotado' : 'Agregar al pedido'}</button>
      <small class="aviso" id="pd-aviso" aria-live="polite"></small>
      <ul class="pd-pasos">
        <li><b>1.</b> Elegí tu talle y agregá el producto</li>
        <li><b>2.</b> Revisá tu pedido y tocá "Pedir por WhatsApp"</li>
        <li><b>3.</b> Coordinamos pago y entrega con el club</li>
      </ul>
    </div>`;

  document.getElementById('pd').hidden = false;
  document.body.classList.add('sin-scroll');
  if (actualizarHash) history.pushState(null, '', '#' + encodeURIComponent(id));
}

function cerrarDetalle(actualizarHash = true) {
  if (detalleId === null) return;
  detalleId = null;
  document.getElementById('pd').hidden = true;
  document.body.classList.remove('sin-scroll');
  if (actualizarHash && location.hash) history.pushState(null, '', location.pathname + location.search);
}

function iniciarDetalle() {
  const pd = document.getElementById('pd');
  pd.addEventListener('click', e => {
    if (e.target === pd || e.target.closest('#pd-cerrar')) return cerrarDetalle();
    const mini = e.target.closest('[data-foto]');
    if (mini) {
      document.getElementById('pd-foto').src = mini.dataset.foto;
      pd.querySelectorAll('.pd-mini button').forEach(b => b.classList.toggle('activa', b === mini));
      return;
    }
    const talle = e.target.closest('.talle');
    if (talle) {
      pd.querySelectorAll('.talle').forEach(b => b.classList.remove('activo'));
      talle.classList.add('activo');
      document.getElementById('pd-aviso').textContent = '';
      return;
    }
    if (e.target.closest('#pd-agregar')) {
      const p = buscarProducto(detalleId);
      const aviso = document.getElementById('pd-aviso');
      const elegido = pd.querySelector('.talle.activo');
      if ((p.talles || []).length && !elegido) {
        aviso.textContent = 'Elegí un talle primero'; aviso.classList.add('error'); return;
      }
      aviso.classList.remove('error');
      agregarAlCarrito(p.id, elegido ? elegido.dataset.talle : '');
      aviso.textContent = 'Agregado a tu pedido';
      setTimeout(() => { aviso.textContent = ''; }, 2000);
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarDetalle(); });

  // Link directo: tienda.html#camiseta-titular  (y botón "atrás" del celular)
  const desdeHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id && buscarProducto(id)) abrirDetalle(id, false); else cerrarDetalle(false);
  };
  window.addEventListener('popstate', desdeHash);
  desdeHash();
}

/* ----- Abrir / cerrar panel ----- */

function abrirCarrito() {
  document.getElementById('carrito').classList.add('abierto');
  document.getElementById('carrito').setAttribute('aria-hidden', 'false');
  document.getElementById('carrito-fondo').hidden = false;
}
function cerrarCarrito() {
  document.getElementById('carrito').classList.remove('abierto');
  document.getElementById('carrito').setAttribute('aria-hidden', 'true');
  document.getElementById('carrito-fondo').hidden = true;
}

/* ----- Inicio ----- */

async function iniciarTienda() {
  try {
    [productos, config] = await Promise.all([
      cargarJSON('data/productos.json'),
      cargarJSON('data/config.json')
    ]);
  } catch (e) {
    console.error(e);
    document.getElementById('grid-productos').innerHTML =
      '<p class="mensaje-vacio">No se pudo cargar la tienda. Revisá data/productos.json.</p>';
    return;
  }

  dibujarFiltros();
  dibujarProductos();
  dibujarCarrito();
  iniciarDetalle();

  document.getElementById('filtros').addEventListener('click', e => {
    const btn = e.target.closest('.filtro');
    if (!btn) return;
    categoriaActual = btn.dataset.cat;
    dibujarFiltros();
    dibujarProductos();
  });

  document.getElementById('buscar').addEventListener('input', e => { busqueda = e.target.value; dibujarProductos(); });
  document.getElementById('orden').addEventListener('change', e => { orden = e.target.value; dibujarProductos(); });

  // Clics dentro de la grilla: elegir talle y agregar
  document.getElementById('grid-productos').addEventListener('click', e => {
    const card = e.target.closest('.producto');
    if (!card) return;
    const aviso = card.querySelector('.aviso');

    if (!e.target.closest('.talle, .agregar')) { abrirDetalle(card.dataset.id); return; }

    const talleBtn = e.target.closest('.talle');
    if (talleBtn) {
      card.querySelectorAll('.talle').forEach(b => b.classList.remove('activo'));
      talleBtn.classList.add('activo');
      aviso.textContent = '';
      return;
    }

    if (e.target.closest('.agregar')) {
      const p = buscarProducto(card.dataset.id);
      if (!p || p.disponible === false) return;

      const tieneTalles = (p.talles || []).length > 0;
      const elegido = card.querySelector('.talle.activo');
      if (tieneTalles && !elegido) {
        aviso.textContent = 'Elegí un talle primero';
        aviso.classList.add('error');
        return;
      }
      aviso.classList.remove('error');
      agregarAlCarrito(p.id, elegido ? elegido.dataset.talle : '');
      aviso.textContent = 'Agregado a tu pedido';
      setTimeout(() => { aviso.textContent = ''; }, 2000);
    }
  });

  // Clics dentro del carrito
  document.getElementById('carrito').addEventListener('click', e => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const i = Number(b.dataset.i);
    if (b.dataset.accion === 'mas') cambiarCantidad(i, 1);
    if (b.dataset.accion === 'menos') cambiarCantidad(i, -1);
    if (b.dataset.accion === 'quitar') quitarItem(i);
    if (b.dataset.accion === 'vaciar' && confirm('¿Vaciar todo el pedido?')) {
      carrito = []; guardarCarrito(); dibujarCarrito();
    }
  });

  document.getElementById('abrir-carrito').addEventListener('click', abrirCarrito);
  document.getElementById('cerrar-carrito').addEventListener('click', cerrarCarrito);
  document.getElementById('carrito-fondo').addEventListener('click', cerrarCarrito);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarCarrito(); });
}

document.addEventListener('DOMContentLoaded', iniciarTienda);