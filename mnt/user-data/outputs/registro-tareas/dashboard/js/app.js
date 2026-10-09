/* ==========================================================
   Dashboard · Registro de tareas diarias en estaciones
   Estructura de los datos que entrega el Apps Script:
     registros: [id, cargado, fecha, estacion, turno, legajo, nombre, observaciones]
     detalle:   [id, fecha, estacion, turno, tarea, codigo]
   ========================================================== */

(function () {
  "use strict";

  const $ = function (id) { return document.getElementById(id); };
  const CODIGOS = CONFIG.CODIGOS;
  const CLAVE_SESION = "reg.clave";

  // Posiciones dentro de cada fila de "detalle"
  const D = { ID: 0, FECHA: 1, ESTACION: 2, TURNO: 3, TAREA: 4, CODIGO: 5 };
  // Posiciones dentro de cada fila de "registros"
  const R = { ID: 0, FECHA: 2, OBS: 7 };

  const estado = {
    clave: "",
    mes: "",
    listas: CONFIG.LISTAS_POR_DEFECTO,
    registros: [],
    detalle: []
  };

  /* ---------- Utilidades ---------- */

  function el(tag, clase, texto) {
    const n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }

  function porcentaje(parte, total) {
    return total > 0 ? Math.round(parte * 1000 / total) / 10 : null;
  }

  function textoPorcentaje(p) {
    return p === null ? "—" : p.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " %";
  }

  function numero(n) { return n.toLocaleString("es-AR"); }

  function fechaCorta(iso) {
    const p = iso.split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
  }

  function mesActualISO() {
    const h = new Date();
    return h.getFullYear() + "-" + String(h.getMonth() + 1).padStart(2, "0");
  }

  function nombreDelMes(mes) {
    const p = mes.split("-").map(Number);
    return new Date(p[0], p[1] - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  }

  function codigoInfo(codigo) {
    return CODIGOS.filter(function (c) { return c.codigo === codigo; })[0];
  }

  /* ---------- Comunicación con Apps Script ---------- */

  async function pedir(cuerpo) {
    const r = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(cuerpo)
    });
    return r.json();
  }

  async function cargar() {
    estado.mes = $("f-mes").value || mesActualISO();
    $("f-mes").value = estado.mes;
    const msg = $("estado-carga");
    msg.textContent = "Cargando datos…";
    $("btn-actualizar").disabled = true;
    try {
      const d = await pedir({ accion: "datos", clave: estado.clave, mes: estado.mes });
      if (!d.ok) throw new Error(d.error || "No se pudieron leer los datos.");
      estado.listas = d.listas;
      estado.registros = d.registros;
      estado.detalle = d.detalle;
      poblarFiltros();
      dibujar();
      msg.textContent = "Datos de " + nombreDelMes(estado.mes) + " · actualizado a las " +
        new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) + " h";
    } catch (e) {
      msg.textContent = "";
      throw e;
    } finally {
      $("btn-actualizar").disabled = false;
    }
  }

  /* ---------- Acceso ---------- */

  function guardarSesion(clave) {
    try { sessionStorage.setItem(CLAVE_SESION, clave); } catch (e) { /* sin almacenamiento */ }
  }
  function leerSesion() {
    try { return sessionStorage.getItem(CLAVE_SESION) || ""; } catch (e) { return ""; }
  }
  function borrarSesion() {
    try { sessionStorage.removeItem(CLAVE_SESION); } catch (e) { /* nada */ }
  }

  function mostrarPanel(si) {
    $("acceso").hidden = si;
    $("panel").hidden = !si;
  }

  async function ingresar(ev) {
    ev.preventDefault();
    const error = $("error-acceso");
    error.hidden = true;
    const clave = $("clave").value;
    if (!clave) {
      error.textContent = "Escribí la clave para continuar.";
      error.hidden = false;
      $("clave").focus();
      return;
    }
    if (!CONFIG.API_URL) {
      error.textContent = "El tablero todavía no está conectado a Google Sheets (API_URL en js/config.js).";
      error.hidden = false;
      return;
    }

    const boton = $("btn-acceso");
    boton.disabled = true;
    boton.textContent = "Verificando…";
    estado.clave = clave;
    try {
      await cargar();
      guardarSesion(clave);
      $("clave").value = "";
      mostrarPanel(true);
    } catch (e) {
      error.textContent = e instanceof TypeError
        ? "No hay conexión. Revisá tu internet e intentá de nuevo."
        : e.message;
      error.hidden = false;
      $("clave").select();
    } finally {
      boton.disabled = false;
      boton.textContent = "Ingresar";
    }
  }

  function salir() {
    borrarSesion();
    estado.clave = "";
    estado.registros = [];
    estado.detalle = [];
    mostrarPanel(false);
    $("clave").focus();
  }

  /* ---------- Filtros ---------- */

  function poblarFiltros() {
    llenarSelect($("f-estacion"), estado.listas.estaciones);
    llenarSelect($("f-turno"), estado.listas.turnos);
  }

  function llenarSelect(sel, valores) {
    const actual = sel.value;
    const primero = sel.options[0];
    sel.replaceChildren(primero);
    valores.forEach(function (v) {
      const o = el("option", "", v);
      o.value = v;
      sel.append(o);
    });
    if (valores.indexOf(actual) !== -1) sel.value = actual;
  }

  function filtrar() {
    const est = $("f-estacion").value;
    const tur = $("f-turno").value;
    const por = function (usarEst, usarTur) {
      return estado.detalle.filter(function (d) {
        return (!usarEst || !est || d[D.ESTACION] === est) && (!usarTur || !tur || d[D.TURNO] === tur);
      });
    };
    return {
      est: est,
      tur: tur,
      det: por(true, true),          // ambos filtros
      detSoloTurno: por(false, true),   // para el panel por estación
      detSoloEstacion: por(true, false), // para el panel por turno
      reg: estado.registros.filter(function (r) {
        return (!est || r[3] === est) && (!tur || r[4] === tur);
      })
    };
  }

  /* ---------- Cálculos ---------- */

  function contar(filas) {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0 };
    filas.forEach(function (f) { c[f[D.CODIGO]] = (c[f[D.CODIGO]] || 0) + 1; });
    return c;
  }

  // Cumplimiento = realizadas / (realizadas + no realizadas + cubiertas por otra estación)
  function cumplimiento(c) {
    const base = c[1] + c[2] + c[3];
    return { p: porcentaje(c[1], base), base: base };
  }

  function jornadasEsperadas(est, tur) {
    const partes = estado.mes.split("-").map(Number);
    const hoy = new Date();
    const k = partes[0] * 12 + partes[1];
    const kHoy = hoy.getFullYear() * 12 + hoy.getMonth() + 1;
    let dias;
    if (k === kHoy) dias = hoy.getDate();
    else if (k > kHoy) dias = 0;
    else dias = new Date(partes[0], partes[1], 0).getDate();
    const nEst = est ? 1 : estado.listas.estaciones.length;
    const nTur = tur ? 1 : estado.listas.turnos.length;
    return dias * nEst * nTur;
  }

  /* ---------- Dibujo ---------- */

  function dibujar() {
    const f = filtrar();
    dibujarIndicadores(f);
    dibujarBarras($("por-estacion"), resumen(estado.listas.estaciones, D.ESTACION, f.detSoloTurno));
    dibujarBarras($("por-turno"), resumen(estado.listas.turnos, D.TURNO, f.detSoloEstacion));
    dibujarBarras($("por-tarea"), resumen(estado.listas.tareas, D.TAREA, f.det));
    dibujarGrilla(f);
    dibujarIncidencias(f);
  }

  function resumen(nombres, indice, filas) {
    return nombres.map(function (n) {
      const c = contar(filas.filter(function (d) { return d[indice] === n; }));
      const cu = cumplimiento(c);
      return { nombre: n, p: cu.p, detalle: numero(c[1]) + " de " + numero(cu.base) };
    });
  }

  function dibujarIndicadores(f) {
    const c = contar(f.det);
    const cu = cumplimiento(c);
    const esperadas = jornadasEsperadas(f.est, f.tur);
    const pCarga = porcentaje(f.reg.length, esperadas);

    const items = [
      { clase: "", etiqueta: "Cumplimiento", valor: textoPorcentaje(cu.p),
        nota: cu.base ? numero(c[1]) + " de " + numero(cu.base) + " tareas aplicables" : "Sin registros en el período" },
      { clase: "", etiqueta: "Jornadas cargadas", valor: numero(f.reg.length),
        nota: esperadas ? "de " + numero(esperadas) + " esperadas (" + textoPorcentaje(pCarga) + ")" : "Período sin días para cargar" },
      { clase: "kpi--c2", etiqueta: "Tareas no realizadas", valor: numero(c[2]),
        nota: "Código 2 de la planilla" },
      { clase: "kpi--c3", etiqueta: "Cubiertas por otra estación", valor: numero(c[3]),
        nota: "Código 3 de la planilla" }
    ];

    $("kpis").replaceChildren.apply($("kpis"), items.map(function (it) {
      const k = el("div", "kpi " + it.clase);
      k.append(el("p", "kpi__etiqueta", it.etiqueta), el("p", "kpi__valor", it.valor), el("p", "kpi__nota", it.nota));
      return k;
    }));
  }

  function dibujarBarras(ul, items) {
    ul.replaceChildren.apply(ul, items.map(function (it) {
      const li = el("li", "barra" + (it.p === null ? " barra--vacia" : ""));
      li.append(el("span", "barra__nombre", it.nombre));

      const pista = el("div", "barra__pista");
      pista.setAttribute("aria-hidden", "true");
      const relleno = el("div", "barra__relleno");
      relleno.style.width = (it.p === null ? 0 : it.p) + "%";
      pista.append(relleno);

      const valor = el("span", "barra__valor");
      if (it.p === null) {
        valor.textContent = "Sin registros";
      } else {
        valor.append(document.createTextNode(textoPorcentaje(it.p)), el("small", "", it.detalle));
      }
      li.append(pista, valor);
      return li;
    }));
  }

  function leyendaCodigos() {
    const ul = el("ul", "leyenda");
    CODIGOS.forEach(function (c) {
      const li = el("li");
      li.append(el("span", "num g" + c.codigo, String(c.codigo)), el("span", "", c.largo));
      ul.append(li);
    });
    return ul;
  }

  function dibujarGrilla(f) {
    const cont = $("grilla");
    if (!f.est || !f.tur) {
      cont.replaceChildren(el("p", "vacio", "Elegí una estación y un turno para ver el mes completo, igual que en la planilla en papel."));
      return;
    }
    if (!f.det.length) {
      cont.replaceChildren(el("p", "vacio", "Todavía no hay registros de " + f.est + ", turno " + f.tur.toLowerCase() + ", en " + nombreDelMes(estado.mes) + "."));
      return;
    }

    const partes = estado.mes.split("-").map(Number);
    const dias = new Date(partes[0], partes[1], 0).getDate();
    const mapa = new Map();
    f.det.forEach(function (d) { mapa.set(Number(d[D.FECHA].slice(8, 10)) + "|" + d[D.TAREA], d[D.CODIGO]); });

    const tabla = el("table", "grilla");
    tabla.append(el("caption", "", f.est + " · Turno " + f.tur.toLowerCase() + " · " + nombreDelMes(estado.mes)));

    const fila = el("tr");
    const th0 = el("th", "", "Tarea");
    th0.scope = "col";
    fila.append(th0);
    for (let dia = 1; dia <= dias; dia++) {
      const th = el("th", "", String(dia));
      th.scope = "col";
      fila.append(th);
    }
    const thead = el("thead");
    thead.append(fila);

    const tbody = el("tbody");
    estado.listas.tareas.forEach(function (tarea) {
      const tr = el("tr");
      const th = el("th", "", tarea);
      th.scope = "row";
      tr.append(th);
      for (let dia = 1; dia <= dias; dia++) {
        const codigo = mapa.get(dia + "|" + tarea);
        const td = el("td", codigo ? "g" + codigo : "", codigo ? String(codigo) : "");
        const info = codigo ? codigoInfo(codigo) : null;
        td.title = "Día " + dia + ": " + (info ? info.corto : "sin registro");
        tr.append(td);
      }
      tbody.append(tr);
    });
    tabla.append(thead, tbody);

    const scroll = el("div", "grilla-scroll");
    scroll.tabIndex = 0;
    scroll.setAttribute("role", "region");
    scroll.setAttribute("aria-label", "Grilla mensual de tareas, desplazable");
    scroll.append(tabla);

    cont.replaceChildren(scroll, leyendaCodigos());
  }

  function dibujarIncidencias(f) {
    const cont = $("incidencias");
    const obs = new Map(estado.registros.map(function (r) { return [r[R.ID], r[R.OBS]]; }));
    const filas = f.det
      .filter(function (d) { return d[D.CODIGO] === 2 || d[D.CODIGO] === 3; })
      .sort(function (a, b) {
        return b[D.FECHA].localeCompare(a[D.FECHA]) || a[D.ESTACION].localeCompare(b[D.ESTACION]);
      });

    if (!filas.length) {
      cont.replaceChildren(el("p", "vacio", "No hay tareas sin realizar en el período y filtros elegidos."));
      return;
    }

    const LIMITE = 150;
    const tabla = el("table", "tabla");
    const cab = el("tr");
    ["Fecha", "Estación", "Turno", "Tarea", "Estado", "Observaciones"].forEach(function (t) {
      const th = el("th", "", t);
      th.scope = "col";
      cab.append(th);
    });
    const thead = el("thead");
    thead.append(cab);

    const tbody = el("tbody");
    filas.slice(0, LIMITE).forEach(function (d) {
      const tr = el("tr");
      const info = codigoInfo(d[D.CODIGO]);
      const tdEstado = el("td");
      tdEstado.append(el("span", "chip chip--" + d[D.CODIGO], info ? info.corto : String(d[D.CODIGO])));
      tr.append(
        el("td", "", fechaCorta(d[D.FECHA])),
        el("td", "", d[D.ESTACION]),
        el("td", "", d[D.TURNO]),
        el("td", "", d[D.TAREA]),
        tdEstado,
        el("td", "obs", obs.get(d[D.ID]) || "—")
      );
      tbody.append(tr);
    });
    tabla.append(thead, tbody);

    const scroll = el("div", "tabla-scroll");
    scroll.tabIndex = 0;
    scroll.setAttribute("role", "region");
    scroll.setAttribute("aria-label", "Tareas no realizadas, desplazable");
    scroll.append(tabla);

    const nodos = [scroll];
    if (filas.length > LIMITE) {
      nodos.push(el("p", "nota-tabla", "Se muestran las " + LIMITE + " más recientes de " + numero(filas.length) +
        ". Filtrá por estación o turno para ver el resto."));
    }
    cont.replaceChildren.apply(cont, nodos);
  }

  /* ---------- Inicio ---------- */

  async function iniciar() {
    if (CONFIG.PORTAL_URL) {
      const volver = $("volver");
      volver.href = CONFIG.PORTAL_URL;
      volver.hidden = false;
    }

    $("f-mes").value = mesActualISO();
    $("f-mes").max = mesActualISO();
    poblarFiltros();

    $("form-acceso").addEventListener("submit", ingresar);
    $("btn-salir").addEventListener("click", salir);
    $("btn-actualizar").addEventListener("click", function () {
      cargar().catch(function (e) { $("estado-carga").textContent = e.message; });
    });
    $("f-mes").addEventListener("change", function () {
      cargar().catch(function (e) { $("estado-carga").textContent = e.message; });
    });
    $("f-estacion").addEventListener("change", dibujar);
    $("f-turno").addEventListener("change", dibujar);

    // Si ya ingresó en esta sesión, entra directo
    const guardada = leerSesion();
    if (guardada && CONFIG.API_URL) {
      estado.clave = guardada;
      try {
        await cargar();
        mostrarPanel(true);
      } catch (e) {
        borrarSesion();
        estado.clave = "";
      }
    }
  }

  iniciar();
})();
