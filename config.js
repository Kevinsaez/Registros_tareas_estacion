/* ==========================================================
   Configuración del formulario de carga.
   API_URL: pegá acá la URL de la aplicación web de Apps Script
   (termina en /exec). Mientras esté vacía, el formulario no guarda.
   ========================================================== */

const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbwsdTBupfcYtmxObsg6L-9AWsBVbD9e-ahf79iX7ZmIFOoE99oaSak1GOzcNnw3lb1b/exec",

  // Códigos de la planilla. "corto" es el texto del botón.
  CODIGOS: [
    { codigo: 1, corto: "Realizada", largo: "Se realizaron las tareas según cronograma de trabajo" },
    { codigo: 2, corto: "No realizada", largo: "No se realizaron las tareas" },
    { codigo: 3, corto: "Otra estación", largo: "Se realizaron tareas esenciales por personal de otra estación" },
    { codigo: 4, corto: "No aplica", largo: "No aplica" }
  ],

  // Se usan solo si no se puede leer la solapa "Listas" del Sheets.
  LISTAS_POR_DEFECTO: {
    estaciones: [
      "RETIRO", "PALERMO", "VILLA CRESPO", "LA PATERNAL", "VILLA DEL PARQUE", "DEVOTO",
      "SAENZ PEÑA", "SANTOS LUGARES", "CASEROS", "EL PALOMAR", "HURLINGHAM", "W. MORRIS",
      "BELLA VISTA", "MUÑIZ", "SAN MIGUEL", "JOSE C PAZ", "SOL Y VERDE", "DERQUI",
      "V. ASTOLFI", "PILAR", "MANZANARES", "CABRED"
    ],
    turnos: ["Mañana", "Tarde", "Noche"],
    tareas: [
      "Limpieza general de estación (accesos, hall, andenes, chicles, graffitis)",
      "Recolección de residuos de cestos",
      "Limpieza y mantenimiento de baños públicos",
      "Barrido y limpieza de hall de estación",
      "Alistamiento de dependencias en la estación",
      "Dependencias: limpieza de mobiliarios",
      "Dependencias: limpieza de ventanas",
      "Limpieza y desmanchado de molinetes",
      "Barrido y desmanchado de formaciones al arribo en plataformas",
      "Mopeado con secuestrante del hall",
      "Limpieza general de pre embarque",
      "Limpieza de cartelería, señalética, cestos, graffitis, barandas, rejas, etc.",
      "Limpieza de puente o túnel en la estación"
    ]
  }
};
