/* =============================================
   COTIZADOR NABE — script.js
   Organización:
   1.  Variables globales y referencias al DOM
   2.  Constantes de cotización
   3.  Pantalla 1 — Validación y avance del cliente
   4.  Panel historial — Abrir / cerrar
   5.  Lógica del cotizador — Cálculo de horas y total
   6.  Formulario técnico — Submit y flujo post envío
   7.  Historial — Render, actualización y eliminación
   8.  Panel tooltip — Contenido y comportamiento
   9.  Modal política de datos
============================================= */


/* =============================================
   1. VARIABLES GLOBALES Y REFERENCIAS AL DOM
============================================= */
let historial      = [];
let totalGeneral   = 0;
let datosCliente   = {};

// Selects del formulario técnico
const software   = document.getElementById("software");
const parametrica = document.getElementById("parametrica");
const tipos       = document.getElementById("tipos");

// Panel historial
const panelHistorial    = document.getElementById("panelHistorial");
const toggleHistorial   = document.getElementById("toggleHistorial");
const cerrarHistorial   = document.getElementById("cerrarHistorial");
const overlay           = document.getElementById("overlay");
const contadorHistorial = document.getElementById("contadorHistorial");


/* =============================================
   2. CONSTANTES DE COTIZACIÓN
============================================= */
const VALOR_HORA = 54000;


/* =============================================
   3. PANTALLA 1 — Validación y avance del cliente
============================================= */
document.getElementById("btnContinuar").addEventListener("click", () => {
  const nombre  = document.getElementById("clienteNombre").value;
  const empresa = document.getElementById("clienteEmpresa").value;
  const email   = document.getElementById("clienteEmail").value;
  const telefono = document.getElementById("clienteTelefono").value;
  const acepta  = document.getElementById("aceptaTerminos").checked;

  if (!nombre || !email) {
    alert("Por favor completa los campos obligatorios.");
    return;
  }

  if (!acepta) {
    alert("Debes aceptar la política de tratamiento de datos para continuar.");
    return;
  }

  datosCliente = { nombre, empresa, email, telefono, aceptaTerminos: acepta };

  document.getElementById("formCliente").classList.remove("pantalla-activa");
  document.getElementById("formTecnico").classList.add("pantalla-activa");
});


/* =============================================
   4. PANEL HISTORIAL — Abrir / cerrar
============================================= */
toggleHistorial.addEventListener("click", () => {
  panelHistorial.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
});

function cerrarPanel() {
  panelHistorial.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = "auto";
}

cerrarHistorial.addEventListener("click", cerrarPanel);
overlay.addEventListener("click", cerrarPanel);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && panelHistorial.classList.contains("active")) {
    cerrarPanel();
  }
});


/* =============================================
   5. LÓGICA DEL COTIZADOR — Cálculo de horas y total
============================================= */

// Cuando cambia "software", deshabilita campos no aplicables
software.addEventListener("change", () => {
  if (software.value === "externo") {
    parametrica.value    = "no";
    tipos.value          = "No";
    parametrica.disabled = true;
    tipos.disabled       = true;
  } else {
    parametrica.disabled = false;
    tipos.disabled       = false;
  }
  calcularTotal();
});

// Escuchar cambios en todos los campos del cotizador
const camposCotizador = document.querySelectorAll(
  "#software, #parametrica, #lod, select[name='simbolo2d'], select[name='mep'], #tipos, input[name='cantidad']"
);
camposCotizador.forEach(campo => campo.addEventListener("change", calcularTotal));

function calcularTotal() {
  let horasUnidad = 2; // base fija siempre

  const softwareVal  = software.value;
  const parametricaVal = parametrica.value;
  const lodVal       = document.querySelector("select[name='lod']").value;
  const simbolo2d    = document.querySelector("select[name='simbolo2d']").value;
  const mepVal       = document.querySelector("select[name='mep']").value;
  const tiposVal     = tipos.value;
  const cantidad     = parseInt(document.querySelector("input[name='cantidad']").value) || 1;

  // Software
  if (softwareVal === "nativo") horasUnidad += 2;
  if (softwareVal === "externo") horasUnidad += 6;

  // Paramétrica
  if (parametricaVal === "basica")   horasUnidad += 2;
  if (parametricaVal === "compleja") horasUnidad += 4;

  // LOD
  if (lodVal === "LOD 200") horasUnidad += 2;
  if (lodVal === "LOD 300") horasUnidad += 3;
  if (lodVal === "LOD 400") horasUnidad += 5;

  // Extras
  if (simbolo2d === "Sí") horasUnidad += 2;
  if (mepVal    === "Sí") horasUnidad += 2;
  if (tiposVal  === "Sí") horasUnidad += 1;

  const totalHoras = horasUnidad * cantidad;
  const total      = totalHoras * VALOR_HORA;

  document.getElementById("totalCotizacion").value = `$ ${total.toLocaleString("es-CO")}`;

  return { horasUnidad, totalHoras, total, cantidad };
}


/* =============================================
   6. FORMULARIO TÉCNICO — Submit y flujo post envío
============================================= */
document.getElementById("cotizadorForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const resultado = calcularTotal();

  historial.push({
    entidad:     document.querySelector("input[name='identificador']").value,
    software:    document.getElementById("software").value,
    parametrica: document.getElementById("parametrica").value,
    simbolo2d:   document.getElementById("simbolo2d").value,
    mep:         document.getElementById("mep").value,
    tipos:       document.getElementById("tipos").value,
    cantidad:    resultado.cantidad,
    horasUnidad: resultado.horasUnidad,
    horasTotales: resultado.totalHoras,
    total:       resultado.total
  });

  totalGeneral += resultado.total;
  actualizarHistorial();

  document.getElementById("cotizadorForm").style.display = "none";
  document.getElementById("postEnvio").style.display     = "block";

  this.reset();
});

// Volver a agregar otra entidad
document.getElementById("otraEntidad").addEventListener("click", () => {
  document.getElementById("postEnvio").style.display    = "none";
  document.getElementById("cotizadorForm").style.display = "block";
});

// Finalizar: enviar datos al servidor
document.getElementById("finalizar").addEventListener("click", () => {
  if (historial.length === 0) {
    alert("No hay entidades para enviar.");
    return;
  }

  const captchaToken = grecaptcha.getResponse();
  if (!captchaToken) {
    alert("Verifica que no eres un robot.");
    return;
  }

  const formData = new FormData();
  formData.append("cliente",      JSON.stringify(datosCliente));
  formData.append("entidades",    JSON.stringify(historial));
  formData.append("totalGeneral", totalGeneral);
  formData.append("captcha",      captchaToken);

  document.getElementById("finalizar").disabled = true;

  fetch("https://script.google.com/macros/s/AKfycbySxcvhP32oiKSdcehLslXySebRUShMceShAvrDBmw2uyykCJhsyqpF4q5BgS_OHMDBDw/exec", {
    method: "POST",
    body: formData
  })
  .then(res => res.text())
  .then(() => {
    document.getElementById("postEnvio").style.display    = "none";
    document.getElementById("mensajeFinal").style.display = "block";
    document.getElementById("clausulaFinal").style.display = "block";
    document.body.classList.add("modo-finalizado");
  })
  .catch(err => {
    console.error("Error enviando:", err);
  })
  .finally(() => {
    document.getElementById("finalizar").disabled = false;
    grecaptcha.reset();
  });
});


/* =============================================
   7. HISTORIAL — Render, actualización y eliminación
============================================= */
function actualizarHistorial() {
  const lista          = document.getElementById("listaHistorial");
  const totalAcum      = document.getElementById("totalAcumulado");
  const historialMovil = document.getElementById("historialMovil");

  // --- Panel lateral (escritorio) ---
  lista.innerHTML = "";

  historial.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.entidad}</strong><br>
      $ ${item.total.toLocaleString("es-CO")}
      <p class="detalle-horas">Horas por unidad aprox: ${item.horasUnidad}</p>
      <p class="detalle-horas">Horas de trabajo aprox: ${item.horasTotales}</p>
      <div>
        <button type="button" onclick="eliminarEntidad(${index})">Eliminar</button>
      </div>
    `;
    lista.appendChild(li);
  });

  totalAcum.textContent = `$ ${totalGeneral.toLocaleString("es-CO")}`;
  contadorHistorial.textContent = historial.length;

  // --- Historial móvil (pantalla post-envío) ---
  if (!historialMovil) return;

  historialMovil.innerHTML = "";

  historial.forEach(entidad => {
    const card = document.createElement("div");
    card.classList.add("item-historial");
    card.innerHTML = `
      <div class="historial-card">
        <strong>${entidad.entidad}</strong>
        <p>$ ${entidad.total.toLocaleString("es-CO")}</p>
        <div class="detalle-entidad">
          <p>Cantidad: ${entidad.cantidad} unidades.</p>
          <p>Horas por unidad: ${entidad.horasUnidad}</p>
          <p>Horas totales: ${entidad.horasTotales}</p>
        </div>
      </div>
    `;
    historialMovil.appendChild(card);
  });

  const horasTotalesGlobal = historial.reduce((acc, e) => acc + (e.horasTotales || 0), 0);

  historialMovil.innerHTML += `
    <div class="total-acumulado-movil">
      <p><strong>Total:</strong> $ ${totalGeneral.toLocaleString("es-CO")}</p>
      <p><strong>Horas de trabajo Aproximadas:</strong> ${horasTotalesGlobal}</p>
    </div>
  `;
}

function eliminarEntidad(index) {
  totalGeneral -= historial[index].total;
  historial.splice(index, 1);
  actualizarHistorial();
}


/* =============================================
   8. PANEL TOOLTIP — Contenido y comportamiento
============================================= */
const tooltips = {

  software: `
    <h3>¿LA ENTIDAD ES NATIVA DE REVIT O NECESITA SOFTWARE EXTERNO?</h3>
    <p><strong>Opción A – Nativa Revit</strong></p>
    <p>Construida 100% en Revit con geometría limpia y optimizada.</p>
    <ul>
      <li><strong>Ventaja:</strong> Materiales y dimensiones editables.</li>
      <li><strong>Ventaja:</strong> Archivo liviano y eficiente.</li>
      <li><strong>Desventaja:</strong> No permite formas orgánicas complejas.</li>
    </ul>
    <p><strong>Opción B – Software Externo / Malla</strong></p>
    <p>Importación desde 3ds Max, Rhino u otro software.</p>
    <ul>
      <li><strong>Ventaja:</strong> Mayor realismo para renders.</li>
      <li><strong>Desventaja:</strong> Modelo rígido no paramétrico.</li>
    </ul>
    <p><em>La elección impacta directamente en horas y costo.</em></p>
  `,

  parametrica: `
    <h3>¿LA ENTIDAD DEBE SER PARAMÉTRICA?</h3>
    <p>Define la inteligencia del objeto dentro del modelo.</p>
    <p><strong>No (Estática)</strong></p>
    <ul>
      <li>Medidas fijas.</li>
      <li>Cualquier cambio requiere remodelar.</li>
    </ul>
    <p><strong>Parámetros Básicos</strong></p>
    <ul>
      <li>Ajuste de Largo, Ancho y Alto.</li>
      <li>Cambio de materiales desde propiedades.</li>
    </ul>
    <p><strong>Parámetros Complejos</strong></p>
    <ul>
      <li>Uso de fórmulas condicionales.</li>
      <li>Comportamiento automático según reglas.</li>
    </ul>
  `,

  categoria: `
    <h3>¿CUÁL ES LA CATEGORÍA DE LA ENTIDAD?</h3>
    <p>Clasificación interna dentro de Revit.</p>
    <ul>
      <li>Permite que aparezca correctamente en tablas de cantidades.</li>
      <li>Define comportamiento y visibilidad en el modelo.</li>
    </ul>
    <p><strong>Ejemplo:</strong> Un inodoro mal clasificado no aparecerá en cuadros hidrosanitarios.</p>
    <p><em>Si no está seguro, seleccione "Modelos Genéricos".</em></p>
  `,

  lod: `
    <h3>¿CUÁL ES EL NIVEL DE DETALLE (LOD)?</h3>
    <p>Determina el nivel de precisión geométrica del modelo.</p>
    <ul>
      <li><strong>LOD 100:</strong> Volumen básico.</li>
      <li><strong>LOD 200:</strong> Forma aproximada reconocible.</li>
      <li><strong>LOD 300:</strong> Geometría precisa con medidas reales.</li>
      <li><strong>LOD 400:</strong> Detalle de fabricación (tornillos, piezas internas).</li>
    </ul>
    <p><em>A mayor LOD, mayor tiempo de modelado.</em></p>
  `,

  simbologia: `
    <h3>¿LA ENTIDAD NECESITA SIMBOLOGÍA 2D ADICIONAL?</h3>
    <p>En planta, el corte 3D puede verse cargado o poco claro.</p>
    <p><strong>SI</strong></p>
    <ul>
      <li>Se agregan líneas 2D limpias para planos.</li>
      <li>Mejora presentación gráfica.</li>
    </ul>
    <p><strong>NO</strong></p>
    <ul>
      <li>Se utiliza la proyección automática del modelo 3D.</li>
    </ul>
  `,

  mep: `
    <h3>¿LA FAMILIA DEBE TENER CONEXIONES MEP?</h3>
    <p>Aplicable solo a equipos con ingeniería técnica.</p>
    <p><strong>SI</strong></p>
    <ul>
      <li>Se agregan conectores inteligentes.</li>
      <li>Permite conectar tuberías y calcular flujos.</li>
    </ul>
    <p><strong>NO</strong></p>
    <ul>
      <li>Objeto decorativo o arquitectónico sin conexiones técnicas.</li>
    </ul>
  `,

  tipos: `
    <h3>¿LA ENTIDAD REQUIERE CONFIGURACIÓN DE TIPOS?</h3>
    <p>Define si será un objeto único o un catálogo.</p>
    <p><strong>SI (Catálogo)</strong></p>
    <ul>
      <li>Un archivo con múltiples medidas predefinidas.</li>
      <li>Ej: ventana 100x100, 120x120, 150x150.</li>
    </ul>
    <p><strong>NO (Único)</strong></p>
    <ul>
      <li>Objeto exclusivo para este proyecto.</li>
    </ul>
  `,

  cantidad: `
    <h3>¿CUÁNTAS ENTIDADES CUMPLEN ESTAS MISMAS CONDICIONES?</h3>
    <p>Ingrese la cantidad total de elementos idénticos.</p>
    <ul>
      <li>5 sillas iguales → escribir 5.</li>
      <li>5 sillas diferentes → completar el formulario 5 veces.</li>
    </ul>
    <p><em>El precio unitario puede ajustarse por volumen.</em></p>
  `
};

// Abrir/cerrar tooltip al clic en el ícono ⓘ
document.querySelectorAll(".icono-info").forEach(icono => {
  icono.addEventListener("click", () => {
    const key   = icono.dataset.tooltip;
    const panel = document.getElementById("panelTooltip");
    document.getElementById("contenidoTooltip").innerHTML = tooltips[key];
    panel.classList.toggle("activo");
  });
});

// Cerrar con botón X
document.getElementById("cerrarTooltip").addEventListener("click", () => {
  document.getElementById("panelTooltip").classList.remove("activo");
});

// Cerrar al clic fuera del panel
const panelTooltip = document.getElementById("panelTooltip");
document.addEventListener("click", function (e) {
  const clickDentroPanel = panelTooltip.contains(e.target);
  const clickEnBotonInfo = e.target.closest(".icono-info");
  if (!clickDentroPanel && !clickEnBotonInfo) {
    panelTooltip.classList.remove("activo");
  }
});


/* =============================================
   9. MODAL — Política de datos
============================================= */
document.addEventListener("DOMContentLoaded", function () {
  const abrirPolitica  = document.getElementById("abrirPolitica");
  const modalPolitica  = document.getElementById("modalPolitica");
  const cerrarPolitica = document.getElementById("cerrarPolitica");

  if (abrirPolitica && modalPolitica && cerrarPolitica) {
    abrirPolitica.addEventListener("click", function (e) {
      e.preventDefault();
      modalPolitica.style.display = "flex";
    });

    cerrarPolitica.addEventListener("click", function () {
      modalPolitica.style.display = "none";
    });

    window.addEventListener("click", function (e) {
      if (e.target === modalPolitica) {
        modalPolitica.style.display = "none";
      }
    });
  }
});
