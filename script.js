const software = document.getElementById("software");
const parametrica = document.getElementById("parametrica");
const tipos = document.getElementById("tipos");
let historial = [];
let totalGeneral = 0;
let datosCliente = {};


// Elementos del panel
const panelHistorial = document.getElementById("panelHistorial");
const toggleHistorial = document.getElementById("toggleHistorial");
const cerrarHistorial = document.getElementById("cerrarHistorial");
const overlay = document.getElementById("overlay");
const contadorHistorial = document.getElementById("contadorHistorial");

document.getElementById("btnContinuar").addEventListener("click", () => {

  const nombre = document.getElementById("clienteNombre").value;
  const empresa = document.getElementById("clienteEmpresa").value;
  const email = document.getElementById("clienteEmail").value;
  const telefono = document.getElementById("clienteTelefono").value;

  const acepta = document.getElementById("aceptaTerminos").checked;

  if (!nombre || !email) {
    alert("Por favor completa los campos obligatorios.");
    return;
  }

  if (!acepta) {
    alert("Debes aceptar la política de tratamiento de datos para continuar.");
    return;
  }


  datosCliente = {
    nombre: nombre,
    empresa: empresa,
    email: email,
    telefono: telefono,
    aceptaTerminos: document.getElementById("aceptaTerminos").checked
  };

  document.getElementById("formCliente").classList.remove("pantalla-activa");
  document.getElementById("formTecnico").classList.add("pantalla-activa");
});



// Toggle del panel en móvil
toggleHistorial.addEventListener("click", () => {
  panelHistorial.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevenir scroll del body
});

// Cerrar panel
function cerrarPanel() {
  panelHistorial.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = "auto";
}

cerrarHistorial.addEventListener("click", cerrarPanel);
overlay.addEventListener("click", cerrarPanel);

// Cerrar con tecla ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && panelHistorial.classList.contains("active")) {
    cerrarPanel();
  }
});

software.addEventListener("change", () => {
  if (software.value === "externo") {
    parametrica.value = "no";
    tipos.value = "No";

    parametrica.disabled = true;
    tipos.disabled = true;
  } else {
    parametrica.disabled = false;
    tipos.disabled = false;
  }

  calcularTotal();
});

document.getElementById("cotizadorForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const resultado = calcularTotal();
  
  historial.push({
    entidad: document.querySelector("input[name='identificador']").value,
    software: document.getElementById("software").value,
    parametrica: document.getElementById("parametrica").value,
    simbolo2d: document.getElementById("simbolo2d").value,
    mep: document.getElementById("mep").value,
    tipos: document.getElementById("tipos").value,
    cantidad: resultado.cantidad,
    horasUnidad: resultado.horasUnidad,
    horasTotales: resultado.totalHoras,
    total: resultado.total
  });



  totalGeneral += resultado.total;
  actualizarHistorial();

  // Ocultar formulario tecnico
  document.getElementById("cotizadorForm").style.display = "none";

  // Mostrar opciones post envio
  document.getElementById("postEnvio").style.display = "block";

  this.reset();
});


const VALOR_HORA = 54000;

const totalInput = document.getElementById("totalCotizacion");

const campos = document.querySelectorAll(
  "#software, #parametrica, #lod, select[name='simbolo2d'], select[name='mep'], #tipos, input[name='cantidad']"
);

campos.forEach(campo => {
  campo.addEventListener("change", calcularTotal);
});

let totalHoras = 0;
let total = 0;

function calcularTotal() {
  let horasUnidad = 2; // base fija

  const softwareVal = software.value;
  const parametricaVal = parametrica.value;
  const lodVal = document.querySelector("select[name='lod']").value;
  const simbolo2d = document.querySelector("select[name='simbolo2d']").value;
  const mepVal = document.querySelector("select[name='mep']").value;
  const tiposVal = tipos.value;
  const cantidad = parseInt(
    document.querySelector("input[name='cantidad']").value
  ) || 1;

  // Software
  if (softwareVal === "nativo") horasUnidad += 2;
  if (softwareVal === "externo") horasUnidad += 6;

  // Paramétrica
  if (parametricaVal === "No") horasUnidad += 0;
  if (parametricaVal === "basica") horasUnidad += 2;
  if (parametricaVal === "compleja") horasUnidad += 4;

  // LOD
  if (lodVal === "LOD 100") horasUnidad += 0;
  if (lodVal === "LOD 200") horasUnidad += 2;
  if (lodVal === "LOD 300") horasUnidad += 3;
  if (lodVal === "LOD 400") horasUnidad += 5;

  // Extras
  if (simbolo2d === "Sí") horasUnidad += 2;
  if (simbolo2d === "No") horasUnidad += 0;
  if (mepVal === "Sí") horasUnidad += 2;
  if (mepVal === "No") horasUnidad += 0;
  if (tiposVal === "Sí") horasUnidad += 1;
  if (tiposVal === "No") horasUnidad += 0;

  totalHoras = horasUnidad * cantidad;
  total = totalHoras * VALOR_HORA;

  totalInput.value = `$ ${total.toLocaleString("es-CO")}`;

  return { horasUnidad, totalHoras, total, cantidad };
}

document.getElementById("otraEntidad").addEventListener("click", () => {
  document.getElementById("postEnvio").style.display = "none";
  document.getElementById("cotizadorForm").style.display = "block";
});

document.getElementById("finalizar").addEventListener("click", () => {

  const resultado = calcularTotal();

  if (historial.length === 0) {
    alert("No hay entidades para enviar.");
    return;
  }

  const formData = new FormData();

  formData.append("cliente", JSON.stringify(datosCliente));
  formData.append("entidades", JSON.stringify(historial));
  formData.append("totalGeneral", totalGeneral);

  //console.log("Datos cliente:", datosCliente);
  //console.log("Historial:", historial);
  //console.log("Total general:", totalGeneral);
  //console.log("Total horas:", totalHoras);
  //console.log("Historial:", historial);
  //console.log("total:", total);
  //console.log("cantidad:", resultado.cantidad);
  //console.log(historial[0]);


  const captchaToken = grecaptcha.getResponse();

  if (!captchaToken) {
    alert("Verifica que no eres un robot.");
    return;
  }

  formData.append("captcha", captchaToken);

  document.getElementById("finalizar").disabled = true;



  fetch("https://script.google.com/macros/s/AKfycbySxcvhP32oiKSdcehLslXySebRUShMceShAvrDBmw2uyykCJhsyqpF4q5BgS_OHMDBDw/exec", {
    method: "POST",
    body: formData
  })
  .then(res => res.text())
  .then(() => {
    document.getElementById("postEnvio").style.display = "none";
    document.getElementById("mensajeFinal").style.display = "block";
    document.getElementById("clausulaFinal").style.display = "block";

    document.body.classList.add("modo-finalizado");
  })
  .catch(err => {
    console.error("Error enviando:", err);
  });
  document.getElementById("finalizar").disabled = false;
  grecaptcha.reset();


});



function actualizarHistorial() {
  const lista = document.getElementById("listaHistorial");
  const totalAcum = document.getElementById("totalAcumulado");
  const historialMovil = document.getElementById("historialMovil");
  
  lista.innerHTML = "";

  historial.forEach((item, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${item.entidad}</strong><br>
      $ ${item.total.toLocaleString("es-CO")}
      <p class="detalle-horas">
        Horas por unidad aprox: ${item.horasUnidad}
      </p>
      <p class="detalle-horas">
        Horas de trabajo aprox: ${item.horasTotales}
      </p>
      <div>
        <button type="button" onclick="eliminarEntidad(${index})">Eliminar</button>
      </div>
    `;

    lista.appendChild(li);
  });

  totalAcum.textContent = `$ ${totalGeneral.toLocaleString("es-CO")}`;
  
  // Actualizar contador del botón flotante
  contadorHistorial.textContent = historial.length;

  if (historialMovil) {
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

  const horasTotalesGlobal = historial.reduce((acc, e) => {
  return acc + (e.horasTotales || 0);
  }, 0);

  historialMovil.innerHTML += `
    <div class="total-acumulado-movil">
      <p><strong>Total:</strong> $ ${totalGeneral.toLocaleString("es-CO")}</p>
      <p><strong>Horas de trabajo Aproximadas:</strong> ${horasTotalesGlobal}</p>
    </div>
  `;

  }
}
function eliminarEntidad(index) {
  totalGeneral -= historial[index].total;
  historial.splice(index, 1);
  actualizarHistorial();
}


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

  <p><em>Si no está seguro, seleccione “Modelos Genéricos”.</em></p>
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




document.querySelectorAll(".icono-info").forEach(icono => {
  icono.addEventListener("click", () => {
    const key = icono.dataset.tooltip;
    const panel = document.getElementById("panelTooltip");

    document.getElementById("contenidoTooltip").innerHTML = tooltips[key];

    panel.classList.toggle("activo");
  });
});

document.getElementById("cerrarTooltip").addEventListener("click", () => {
  document.getElementById("panelTooltip").classList.remove("activo");
});

const panelTooltip = document.getElementById("panelTooltip");

document.addEventListener("click", function (e) {

  const clickDentroPanel = panelTooltip.contains(e.target);
  const clickEnBotonInfo = e.target.closest(".icono-info"); 

  if (!clickDentroPanel && !clickEnBotonInfo) {
    panelTooltip.classList.remove("activo"); 
  }

});

// ===============================
// MODAL POLÍTICA DE DATOS
// ===============================

document.addEventListener("DOMContentLoaded", function () {

  const abrirPolitica = document.getElementById("abrirPolitica");
  const modalPolitica = document.getElementById("modalPolitica");
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

