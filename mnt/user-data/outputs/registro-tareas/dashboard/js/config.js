/* ==========================================================
   Configuración del dashboard.
   API_URL: la misma URL (termina en /exec) que usa el formulario.
   PORTAL_URL: enlace "Volver al portal". Dejalo vacío para ocultarlo.
   ========================================================== */

const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbwsdTBupfcYtmxObsg6L-9AWsBVbD9e-ahf79iX7ZmIFOoE99oaSak1GOzcNnw3lb1b/exec",
  PORTAL_URL: "https://lsmlimpieza.netlify.app/",

  CODIGOS: [
    { codigo: 1, corto: "Realizada", largo: "Se realizaron las tareas según cronograma de trabajo" },
    { codigo: 2, corto: "No realizada", largo: "No se realizaron las tareas" },
    { codigo: 3, corto: "Otra estación", largo: "Se realizaron tareas esenciales por personal de otra estación" },
    { codigo: 4, corto: "No aplica", largo: "No aplica" }
  ],

  // Se usan hasta que el Sheets entregue sus listas.
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
