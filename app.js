/* ==========================================================
   Formulario de carga · Registro de tareas diarias en estaciones
   ========================================================== */

(function () {
  "use strict";

  const $ = function (id) { return document.getElementById(id); };
  const CODIGOS = CONFIG.CODIGOS;
  const RECORDAR = ["estacion", "turno", "legajo", "nombre"]; // se guardan en este dispositivo
  let listas = CONFIG.LISTAS_POR_DEFECTO;

  function el(tag, clase, texto) {
    const n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }

  /* ---------- Datos guardados en el dispositivo (opcional) ---------- */

  function leerGuardado(clave) {
    try { return localStorage.getItem("reg." + clave) || ""; } catch (e) { return ""; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem("reg." + clave, valor); } catch (e) { /* sin almacenamiento: no pasa nada */ }
  }

  function hoyISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function fechaLarga(iso) {
    const p = iso.split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
  }

  /* ---------- Armado del formulario ---------- */

  async function cargarListas() {
    if (!CONFIG.API_URL) return;
    try {
      const r = await fetch(CONFIG.API_URL + "?accion=listas");
      const d = await r.json();
      if (d.ok && d.listas && d.listas.estaciones.length) listas = d.listas;
    } catch (e) { /* se usan las listas por defecto */ }
  }

  function dibujarEstaciones() {
    const sel = $("estacion");
    listas.estaciones.forEach(function (nombre) {
      const o = el("option", "", nombre);
      o.value = nombre;
      sel.append(o);
    });
  }

  function dibujarTurnos() {
    const cont = $("turnos");
    listas.turnos.forEach(function (turno, i) {
      const id = "turno-" + i;
      const input = el("input");
      input.type = "radio"; input.name = "turno"; input.id = id; input.value = turno;
      const label = el("label", "", turno);
      label.htmlFor = id;
      cont.append(input, label);
    });
  }

  function dibujarLeyenda() {
    const ul = $("leyenda");
    CODIGOS.forEach(function (c) {
      const li = el("li");
      li.append(el("span", "num n" + c.codigo, String(c.codigo)), el("span", "", c.largo));
      ul.append(li);
    });
  }

  function dibujarTareas() {
    const cont = $("tareas");
    cont.replaceChildren();
    listas.tareas.forEach(function (nombre, i) {
      const fs = el("fieldset", "tarea");
      fs.append(el("legend", "tarea__nombre", nombre));
      const opciones = el("div", "opciones");
      CODIGOS.forEach(function (c) {
        const id = "t" + i + "-c" + c.codigo;
        const input = el("input");
        input.type = "radio"; input.name = "tarea" + i; input.id = id; input.value = c.codigo;
        if (c.codigo === 1) input.checked = true;
        const label = el("label", "opcion opcion--c" + c.codigo);
        label.htmlFor = id;
        label.append(el("span", "opcion__num n" + c.codigo, String(c.codigo)), el("span", "", c.corto));
        opciones.append(input, label);
      });
      fs.append(opciones);
      cont.append(fs);
    });
  }

  function restaurarGuardados() {
    RECORDAR.forEach(function (clave) {
      const v = leerGuardado(clave);
      if (!v) return;
      if (clave === "turno") {
        const r = document.querySelector('input[name="turno"][value="' + CSS.escape(v) + '"]');
        if (r) r.checked = true;
      } else if (clave === "estacion") {
        const sel = $("estacion");
        if (listas.estaciones.indexOf(v) !== -1) sel.value = v;
      } else {
        $(clave).value = v;
      }
    });
  }

  /* ---------- Lectura y validación ---------- */

  function leer() {
    const turno = document.querySelector('input[name="turno"]:checked');
    return {
      fecha: $("fecha").value,
      estacion: $("estacion").value,
      turno: turno ? turno.value : "",
      legajo: $("legajo").value.trim(),
      nombre: $("nombre").value.trim().replace(/\s+/g, " "),
      observaciones: $("observaciones").value.trim(),
      tareas: listas.tareas.map(function (_, i) {
        const r = document.querySelector('input[name="tarea' + i + '"]:checked');
        return r ? Number(r.value) : 1;
      })
    };
  }

  function marcarError(campoId, errorId, mensaje) {
    const e = $(errorId);
    e.textContent = mensaje;
    e.hidden = false;
    const campo = e.closest(".campo");
    if (campo) campo.classList.add("campo--invalido");
    const control = $(campoId);
    if (control) control.setAttribute("aria-invalid", "true");
  }

  function limpiarErrores() {
    document.querySelectorAll(".error").forEach(function (e) { e.hidden = true; e.textContent = ""; });
    document.querySelectorAll(".campo--invalido").forEach(function (c) { c.classList.remove("campo--invalido"); });
    document.querySelectorAll("[aria-invalid]").forEach(function (c) { c.removeAttribute("aria-invalid"); });
    $("estado").hidden = true;
  }

  function validar(d) {
    let primero = null;
    function falla(campoId, errorId, msg) {
      marcarError(campoId, errorId, msg);
      if (!primero) primero = $(campoId) || $("turnos").querySelector("input");
    }
    if (!d.estacion) falla("estacion", "error-estacion", "Elegí la estación.");
    if (!d.turno) falla("turno-0", "error-turno", "Elegí el turno.");
    if (!d.fecha) falla("fecha", "error-fecha", "Indicá la fecha de la jornada.");
    else if (d.fecha > hoyISO()) falla("fecha", "error-fecha", "La fecha no puede ser futura.");
    if (!d.legajo) falla("legajo", "error-legajo", "Escribí tu legajo.");
    if (d.nombre.length < 2) falla("nombre", "error-nombre", "Escribí tu nombre y apellido.");
    if (primero) { primero.focus(); return false; }
    return true;
  }

  /* ---------- Envío ---------- */

  function mostrarEstado(texto) {
    const e = $("estado");
    e.textContent = texto;
    e.hidden = false;
  }

  function bloquear(si) {
    const b = $("enviar");
    b.disabled = si;
    b.textContent = si ? "Guardando…" : "Guardar registro";
  }

  async function enviar(ev) {
    ev.preventDefault();
    limpiarErrores();
    const datos = leer();
    if (!validar(datos)) return;

    if (!CONFIG.API_URL) {
      mostrarEstado("Este formulario todavía no está conectado a Google Sheets. Avisá a administración.");
      return;
    }

    bloquear(true);
    try {
      const r = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(Object.assign({ accion: "registrar" }, datos))
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "No se pudo guardar el registro.");
      RECORDAR.forEach(function (c) { guardar(c, datos[c]); });
      mostrarExito(datos);
    } catch (e) {
      const sinRed = e instanceof TypeError;
      mostrarEstado(sinRed
        ? "No hay conexión. Revisá tu internet y volvé a tocar “Guardar registro”: tus datos siguen cargados."
        : e.message);
    } finally {
      bloquear(false);
    }
  }

  function mostrarExito(d) {
    $("formulario").hidden = true;
    $("exito-detalle").textContent =
      d.estacion + " · Turno " + d.turno.toLowerCase() + " · " + fechaLarga(d.fecha) + ".";
    $("exito").hidden = false;
    $("exito-titulo").focus();
    window.scrollTo({ top: 0 });
  }

  function otraJornada() {
    dibujarTareas();
    $("observaciones").value = "";
    $("fecha").value = hoyISO();
    limpiarErrores();
    $("exito").hidden = true;
    $("formulario").hidden = false;
    $("estacion").focus();
  }

  /* ---------- Inicio ---------- */

  async function iniciar() {
    if (!CONFIG.API_URL) {
      const a = $("aviso");
      a.textContent = "Falta conectar el formulario con Google Sheets (API_URL en js/config.js).";
      a.hidden = false;
    }
    await cargarListas();
    dibujarEstaciones();
    dibujarTurnos();
    dibujarLeyenda();
    dibujarTareas();

    const fecha = $("fecha");
    fecha.value = hoyISO();
    fecha.max = hoyISO();
    restaurarGuardados();

    $("formulario").addEventListener("submit", enviar);
    $("otra").addEventListener("click", otraJornada);
  }

  iniciar();
})();
