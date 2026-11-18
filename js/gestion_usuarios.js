
(function () {
  "use strict";

  const CACHE_KEY = "RITAQ_CLIENTES_CACHE_V2";
  const PRODUCTOS = [
    "ISO 9001",
    "ISO 14001",
    "Otras ISO",
    "LOPD",
    "PRL",
    "Auditoría Salarial",
    "Otros"
  ];

  let host = null;
  let clientes = [];

  function clonar(valor) {
    return JSON.parse(JSON.stringify(valor));
  }

  function escapar(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, function (caracter) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[caracter];
    });
  }

  function cargarClientes() {
    const base = clonar(window.RITAQ_CLIENTES_BASE || []);

    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      clientes = Array.isArray(cache) ? cache : base;
    } catch (_) {
      clientes = base;
    }
  }

  // Persistencia PROVISIONAL para pruebas.
  // La fuente maestra se conectará a Dropbox cuando fijemos el maestro definitivo.
  function guardarClientes() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(clientes));
      return true;
    } catch (_) {
      return false;
    }
  }

  function nuevoId() {
    const maximo = clientes.reduce(function (max, cliente) {
      const numero = Number(String(cliente.id || "").replace(/\D/g, "")) || 0;
      return Math.max(max, numero);
    }, 0);

    return "CLI-" + String(maximo + 1).padStart(4, "0");
  }

  function cabeceraHerramientas(activa) {
    const botones = [
      ["lista", "LISTADO / EDICIÓN"],
      ["alta", "ALTA INDIVIDUAL"],
      ["grupo", "ALTA EN GRUPO"]
    ];

    return `
      <div class="gu-toolbar">
        ${botones.map(function (boton) {
          return `
            <button
              class="gu-tab ${activa === boton[0] ? "active" : ""}"
              type="button"
              data-gu-tab="${boton[0]}">
              ${boton[1]}
            </button>`;
        }).join("")}

        <button class="gu-tab volver" type="button" data-gu-tab="portada">
          VOLVER
        </button>
      </div>`;
  }

  function mostrarPortada() {
    host.innerHTML = `
      <div class="gestion-usuarios gu-portada">
        <p class="gu-portada-intro">
          Gestión de las empresas cliente con acceso a RitaQ©.
        </p>

        <div class="gu-gorditos-grid">

          <button class="gu-gordito" type="button" data-gu-tab="lista">
            <span class="gu-gordito-num">1</span>

            <span>
              <span class="gu-gordito-title">Alta / edición de usuarios</span>
              <span class="gu-gordito-sub">
                Alta individual, alta en grupo y modificación de clientes existentes.
              </span>
            </span>

            <span class="gu-gordito-arrow">›</span>
          </button>

          <button class="gu-gordito" type="button" data-gu-tab="informacion">
            <span class="gu-gordito-num">2</span>

            <span>
              <span class="gu-gordito-title">Información de usuarios</span>
              <span class="gu-gordito-sub">
                Consulta de los datos maestros de cada empresa cliente.
              </span>
            </span>

            <span class="gu-gordito-arrow">›</span>
          </button>

          <button class="gu-gordito" type="button" data-gu-tab="credenciales">
            <span class="gu-gordito-num">3</span>

            <span>
              <span class="gu-gordito-title">Usuarios y contraseñas</span>
              <span class="gu-gordito-sub">
                Consulta directa de las credenciales de acceso de cada usuario.
              </span>
            </span>

            <span class="gu-gordito-arrow">›</span>
          </button>

          <button class="gu-gordito" type="button" data-gu-tab="uso">
            <span class="gu-gordito-num">4</span>

            <span>
              <span class="gu-gordito-title">Uso de RitaQ© por usuario</span>
              <span class="gu-gordito-sub">
                Accesos y actividad registrada de cada usuario en RitaQ©.
              </span>
            </span>

            <span class="gu-gordito-arrow">›</span>
          </button>

          <button class="gu-gordito" type="button" data-gu-tab="permisos">
            <span class="gu-gordito-num">5</span>
            <span><span class="gu-gordito-title">Permisos de acceso</span>
            <span class="gu-gordito-sub">Asignación de visores laterales a cada organización cliente.</span></span>
            <span class="gu-gordito-arrow">›</span>
          </button>

          ${puedeGestionarInstalaciones() ? `
            <button class="gu-gordito" type="button" data-gu-tab="instalaciones">
              <span class="gu-gordito-num">6</span>
              <span>
                <span class="gu-gordito-title">Instalaciones</span>
                <span class="gu-gordito-sub">Alta y consulta de instalaciones por organización.</span>
              </span>
              <span class="gu-gordito-arrow">›</span>
            </button>` : ""}

        </div>
      </div>`;
  }

  function puedeGestionarInstalaciones() {
    const perfil = window.RitaQSesion?.obtener()?.perfil;
    return perfil === "CONSULTOR" || perfil === "SUPERADMIN";
  }

  const DATOS_INSTALACION = {
    nombre: "Denominación del centro",
    codigo: "Código del centro",
    direccion: "Dirección",
    localidad: "Localidad",
    codigoPostal: "Código postal",
    telefono: "Teléfono",
    email: "Correo electrónico",
    niveles: "Niveles educativos"
  };

  function mostrarInstalaciones() {
    cargarClientes();
    const opciones = clientes.map(c => `
      <option value="${escapar(c.id)}">${escapar(c.razon_social || c.codigo_cliente || c.id)}</option>`).join("");
    host.innerHTML = `
      <div class="gestion-usuarios">
        ${barraVolver("Instalaciones")}
        <div class="gu-filtros">
          <label for="guInstalacionesCliente">Organización cliente</label>
          <select id="guInstalacionesCliente">
            <option value="">Seleccionar organización</option>
            ${opciones}
          </select>
        </div>
        <div id="guInstalacionesPanel" hidden>
          <form class="gu-form">
            <h3 class="gu-form-title">Alta de instalación</h3>
            <div class="gu-grid">
              ${Object.entries(DATOS_INSTALACION).map(([campo, etiqueta]) => `
                <div class="gu-field">
                  <label for="guInstalacion-${campo}">${etiqueta}</label>
                  <input id="guInstalacion-${campo}" name="${campo}" ${campo === "nombre" ? "required" : ""}>
                </div>`).join("")}
              <div class="gu-field full">
                <label for="guInstalacionPlantas">Plantas (una por línea)</label>
                <textarea id="guInstalacionPlantas" name="plantas" placeholder="Planta baja"></textarea>
              </div>
            </div>
            <div class="gu-actions">
              <button class="gu-secondary" type="button" data-cancelar-instalacion hidden>CANCELAR</button>
              <button class="gu-primary" type="submit">DAR DE ALTA</button>
            </div>
            <p role="status"></p>
          </form>
          <div id="guInstalacionesLista"></div>
        </div>
      </div>`;

    const selector = host.querySelector("#guInstalacionesCliente");
    const panel = host.querySelector("#guInstalacionesPanel");
    const lista = host.querySelector("#guInstalacionesLista");
    const formulario = panel.querySelector("form");
    const estado = formulario.querySelector('[role="status"]');
    const cancelar = formulario.querySelector("[data-cancelar-instalacion]");
    const guardar = formulario.querySelector('[type="submit"]');
    const titulo = formulario.querySelector("h3");
    let editando = null;

    function prepararFormulario(instalacion, lectura = false) {
      formulario.reset();
      editando = instalacion?.id ?? null;
      titulo.textContent = lectura ? "Ficha de la instalación" : instalacion ? "Editar instalación" : "Alta de instalación";
      guardar.textContent = instalacion ? "GUARDAR CAMBIOS" : "DAR DE ALTA";
      guardar.hidden = lectura;
      cancelar.hidden = !instalacion;
      cancelar.textContent = lectura ? "CERRAR" : "CANCELAR";
      for (const campo of Object.keys(DATOS_INSTALACION)) {
        formulario.elements[campo].readOnly = lectura;
        formulario.elements[campo].value = instalacion?.[campo] || "";
      }
      formulario.elements.plantas.readOnly = lectura;
      formulario.elements.plantas.value = (instalacion?.plantas || []).join("\n");
      estado.textContent = "";
    }

    function seleccionada() {
      return clientes.find(c => String(c.id) === selector.value && selector.value !== "");
    }

    function mostrarLista(organizacion) {
      panel.hidden = !organizacion;
      if (!organizacion) return;
      const instalaciones = (organizacion.instalaciones || []).filter(i => !i.borrada);
      lista.innerHTML = instalaciones.length ? `
        <div class="gu-table-wrap">
          <table class="gu-table">
            <thead><tr><th scope="col">Instalación</th><th scope="col">Dirección</th><th scope="col">Acciones</th></tr></thead>
            <tbody>${instalaciones.map(i => `
              <tr><td>${escapar(i.nombre)}</td><td>${escapar(i.direccion || "—")}</td>
              <td>
                <button class="gu-mini" type="button" data-accion-instalacion="ver" data-instalacion="${escapar(i.id)}">VER</button>
                <button class="gu-mini" type="button" data-accion-instalacion="editar" data-instalacion="${escapar(i.id)}">Editar</button>
                <button class="gu-mini" type="button" data-accion-instalacion="borrar" data-instalacion="${escapar(i.id)}"
                  style="background:rgb(163 35 42 / 30%);border-color:#a3232a;color:#78141b">BORRAR</button>
              </td></tr>`).join("")}</tbody>
          </table>
        </div>` : "<p>Esta organización todavía no tiene instalaciones.</p>";
    }

    selector.addEventListener("change", function () {
      cargarClientes();
      prepararFormulario(null);
      mostrarLista(seleccionada());
    });

    cancelar.addEventListener("click", () => prepararFormulario(null));
    lista.addEventListener("click", evento => {
      const boton = evento.target.closest("[data-accion-instalacion]");
      if (!boton || !puedeGestionarInstalaciones()) return;
      cargarClientes();
      const organizacion = seleccionada();
      const instalacion = organizacion?.instalaciones?.find(i => !i.borrada && String(i.id) === boton.dataset.instalacion);
      if (!instalacion) {
        mostrarLista(organizacion);
        estado.textContent = "La instalación ya no está disponible.";
        return;
      }
      const accion = boton.dataset.accionInstalacion;
      if (accion !== "borrar") {
        prepararFormulario(instalacion, accion === "ver");
        formulario.elements.nombre.focus();
        return;
      }
      if (!window.confirm(`¿Borrar «${instalacion.nombre}» del catálogo de instalaciones? Su historial de simulacros se conservará.`)) return;
      instalacion.borrada = true;
      if (!guardarClientes()) {
        cargarClientes();
        estado.textContent = "No se pudo borrar la instalación en este navegador.";
        return;
      }
      if (editando === instalacion.id) prepararFormulario(null);
      mostrarLista(organizacion);
      estado.textContent = "Instalación borrada del catálogo.";
    });

    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();
      if (guardar.hidden || !puedeGestionarInstalaciones()) return;
      cargarClientes();
      const organizacion = seleccionada();
      if (!organizacion) {
        estado.textContent = "Selecciona una organización disponible.";
        return;
      }
      const datos = Object.fromEntries(Object.keys(DATOS_INSTALACION).map(campo =>
        [campo, formulario.elements[campo].value.trim()]));
      const { nombre, direccion } = datos;
      if (!nombre) {
        estado.textContent = "Escribe el nombre de la instalación.";
        formulario.elements.nombre.focus();
        return;
      }
      const instalaciones = organizacion.instalaciones || [];
      const anterior = instalaciones.find(i => !i.borrada && i.id === editando);
      if (editando !== null && !anterior) {
        estado.textContent = "La instalación ya no está disponible.";
        return;
      }
      const plantas = formulario.elements.plantas.value.split("\n").map(planta => planta.trim()).filter(Boolean);
      if (new Set(plantas.map(planta => planta.toLocaleLowerCase("es"))).size !== plantas.length) {
        estado.textContent = "Cada planta debe tener una denominación distinta.";
        formulario.elements.plantas.focus();
        return;
      }
      const duplicada = instalaciones.some(i =>
        !i.borrada && i.id !== editando &&
        i.nombre.localeCompare(nombre, "es", { sensitivity: "accent" }) === 0 &&
        (i.direccion || "").localeCompare(direccion, "es", { sensitivity: "accent" }) === 0);
      if (duplicada) {
        estado.textContent = "Ya existe una instalación con ese nombre y dirección en esta organización.";
        return;
      }
      const instalacion = { ...anterior, ...datos, id: anterior?.id ?? crypto.randomUUID(), plantas };
      organizacion.instalaciones = anterior
        ? instalaciones.map(i => i.id === editando ? instalacion : i)
        : [...instalaciones, instalacion];
      if (!guardarClientes()) {
        cargarClientes();
        estado.textContent = "No se pudo guardar la instalación en este navegador.";
        return;
      }
      prepararFormulario(null);
      mostrarLista(organizacion);
      estado.textContent = "Instalación guardada en este navegador.";
      formulario.elements.nombre.focus();
    });
  }

  const SI_NO = ["Sí", "No"];
  const SI_NO_EXISTE = ["Sí", "No", "No existe"];
  const RECUENTOS = {
    menores: "Número de menores",
    docentes: "Número de docentes",
    servicios: "Número de personal de servicios",
    invitados: "Número de invitados",
    menoresDm: "Menores con discapacidad o movilidad reducida",
    personalDm: "Personal con discapacidad o movilidad reducida"
  };
  const VALORACIONES = {
    plan: ["Programado según el Plan de Autoprotección", SI_NO],
    participacion: ["Participación y colaboración de los docentes", ["Buena", "Media", "Baja"]],
    comportamiento: ["Comportamiento de los menores", ["Bueno", "Regular", "Malo"]],
    capacidad: ["Capacidad de las vías de evacuación", ["Suficiente", "Insuficiente"]],
    interferencias: ["Interferencias entre plantas", SI_NO],
    obstaculos: ["Obstáculos en las vías de evacuación", SI_NO],
    estrechamientos: ["Estrechamientos peligrosos", SI_NO],
    alarma: ["Sistemas de alarma", SI_NO_EXISTE],
    alumbrado: ["Alumbrado de emergencia", SI_NO_EXISTE],
    escaleras: ["Escaleras de emergencia", SI_NO_EXISTE],
    gas: ["Gas", SI_NO_EXISTE],
    electricidad: ["Electricidad", SI_NO_EXISTE],
    gasoleo: ["Gasóleo", SI_NO_EXISTE],
    agua: ["Agua", SI_NO_EXISTE]
  };
  const INCIDENCIAS = {
    generales: "Generales",
    tiempos: "Tiempos de evacuación",
    menores: "Comportamiento de los menores",
    vias: "Vías de evacuación",
    medios: "Medios de emergencia",
    imprevistas: "Imprevistas o sin clasificar"
  };
  const PREGUNTAS_ANEXO = [
    "¿Se han utilizado las orientaciones de la Comunidad de Madrid sobre evacuación de personas con discapacidad en centros educativos públicos?",
    "¿Se han identificado las necesidades de evacuación de las personas con discapacidad o movilidad reducida?",
    "¿Se han identificado los medios disponibles para su evacuación?",
    "¿Se ha constituido un equipo de ayuda para su evacuación?",
    "¿Se han identificado las aulas y demás lugares en los que se encuentran habitualmente las personas con dificultades de movimiento?",
    "¿Se han previsto los medios de evacuación y se ha asignado previamente a las personas responsables?",
    "¿Se han previsto procedimientos para comunicar la emergencia a personas con limitaciones sensoriales?",
    "¿Se conocían el equipo de ayuda, su localización y las acciones que debía realizar?",
    "¿Eran adecuados los puntos de reunión y los recorridos de evacuación previstos?",
    "¿Se han previsto medios y procedimientos de transporte para personas heridas o con discapacidad?",
    "¿Se ha comprobado la evacuación de todas las personas y se ha prestado a cada una la ayuda adecuada?"
  ];

  function abrirRegistroSimulacros() {
    return new Promise((resolver, rechazar) => {
      const peticion = indexedDB.open("RitaQ-simulacros", 1);
      peticion.onupgradeneeded = () => {
        const almacen = peticion.result.createObjectStore("simulacros", { keyPath: "id" });
        almacen.createIndex("instalacionFecha", ["organizacionId", "instalacionId", "fecha", "hora", "id"]);
      };
      peticion.onsuccess = () => resolver(peticion.result);
      peticion.onerror = () => rechazar(peticion.error);
    });
  }

  async function guardarSimulacro(registro) {
    const db = await abrirRegistroSimulacros();
    try {
      await new Promise((resolver, rechazar) => {
        const transaccion = db.transaction("simulacros", "readwrite");
        transaccion.oncomplete = resolver;
        transaccion.onabort = () => rechazar(transaccion.error);
        transaccion.objectStore("simulacros").add(registro);
      });
    } finally {
      db.close();
    }
  }

  async function consultarSimulacros(organizacionId, instalacionId, pagina, porPagina) {
    const db = await abrirRegistroSimulacros();
    try {
      return await new Promise((resolver, rechazar) => {
        const indice = db.transaction("simulacros").objectStore("simulacros").index("instalacionFecha");
        const prefijo = [organizacionId, instalacionId];
        const rango = IDBKeyRange.bound(prefijo, [...prefijo, []]);
        const peticion = indice.openCursor(rango, "prev");
        const registros = [];
        let saltar = pagina * porPagina;
        peticion.onerror = () => rechazar(peticion.error);
        peticion.onsuccess = () => {
          const cursor = peticion.result;
          if (!cursor || registros.length > porPagina) {
            resolver(registros);
          } else if (saltar) {
            cursor.advance(saltar);
            saltar = 0;
          } else {
            registros.push(cursor.value);
            cursor.continue();
          }
        };
      });
    } finally {
      db.close();
    }
  }

  function campoSimulacro(campo, etiqueta, atributos = "") {
    return `<div class="gu-field"><label for="rq-sim-${campo}">${etiqueta}</label>
      <input id="rq-sim-${campo}" name="${campo}" ${atributos}></div>`;
  }

  function textoSimulacro(campo, etiqueta) {
    return `<div class="gu-field"><label for="rq-sim-${campo}">${etiqueta}</label>
      <textarea id="rq-sim-${campo}" name="${campo}"></textarea></div>`;
  }

  function opcionesSimulacro(campo, etiqueta, opciones) {
    return `<fieldset><legend>${etiqueta}</legend>
      ${opciones.map(opcion => `<label style="display:inline-block;margin:0 1em .35em 0">
        <input type="radio" name="${campo}" value="${opcion}" required> ${opcion}</label>`).join("")}
    </fieldset>`;
  }

  function tiempoSimulacro(campo, titulo) {
    return `<fieldset><legend>${titulo}</legend><div class="gu-grid">
      ${campoSimulacro(campo + "Min", "Minutos", 'type="number" min="0" max="9999" required')}
      ${campoSimulacro(campo + "Seg", "Segundos", 'type="number" min="0" max="59" required')}
    </div></fieldset>`;
  }

  function formularioSimulacro(instalacion) {
    const opciones = (...campos) => campos.map(campo => opcionesSimulacro(campo, ...VALORACIONES[campo])).join("");
    const plantas = instalacion.plantas || [];
    return `
      <form class="gu-form">
        <h2 class="gu-form-title">Alta de simulacro realizado</h2>
        <div class="gu-grid">
          ${campoSimulacro("fecha", "Fecha del simulacro", 'type="date" required')}
          ${campoSimulacro("hora", "Hora de inicio", 'type="time" required')}
          ${Object.entries(RECUENTOS).map(([campo, etiqueta]) =>
            campoSimulacro(campo, etiqueta, 'type="number" min="0" max="10000000" required')).join("")}
        </div>
        <h3>Tiempos reales de la evacuación</h3>
        <p>Los dos tiempos totales se miden desde que suena la alarma.</p>
        ${tiempoSimulacro("edificio", "Evacuación del edificio")}
        ${tiempoSimulacro("recuento", "Hasta el punto de reunión y recuento")}
        ${plantas.map((planta, i) => `<fieldset><legend>${escapar(planta)}</legend>
          ${tiempoSimulacro("planta" + i, "Tiempo de evacuación de la planta")}
          ${campoSimulacro("evacuados" + i, "Número de evacuados", 'type="number" min="0" max="10000000" required')}
        </fieldset>`).join("")}
        <h3>Desarrollo del simulacro</h3>
        ${opciones("plan", "participacion", "comportamiento")}
        <h3>Vías de evacuación</h3>
        ${opciones("capacidad", "interferencias", "obstaculos", "estrechamientos")}
        <h3>Medios de emergencia utilizados</h3>
        ${opciones("alarma", "alumbrado", "escaleras")}
        <h3>Pudieron cortarse los suministros de</h3>
        ${opciones("gas", "electricidad", "gasoleo", "agua")}
        <h3>Incidencias y observaciones</h3>
        ${Object.entries(INCIDENCIAS).map(([campo, etiqueta]) => textoSimulacro("inc-" + campo, etiqueta)).join("")}
        ${textoSimulacro("accidentes", "Accidentes de personas")}
        ${textoSimulacro("deteriorosEdificio", "Deterioros en el edificio")}
        ${textoSimulacro("deteriorosMobiliario", "Deterioros en el mobiliario")}
        <h3>Balance general del simulacro</h3>
        ${textoSimulacro("conclusiones", "Conclusiones")}
        ${textoSimulacro("pedagogicas", "Conclusiones pedagógicas")}
        ${textoSimulacro("balance", "Balance general")}
        ${textoSimulacro("sugerencias", "Sugerencias")}
        <div class="gu-grid">
          ${campoSimulacro("director", "Director/a")}
          ${campoSimulacro("tecnico", "Técnico/a")}
        </div>
        <h3>Anexo de discapacidad o movilidad reducida</h3>
        <label><input type="checkbox" name="invitadosDm"> Hay invitados con discapacidad o movilidad reducida</label>
        <p data-anexo-na>N/A</p>
        <fieldset data-anexo hidden disabled>
          <legend>Cuestionario complementario</legend>
          ${PREGUNTAS_ANEXO.map((pregunta, i) => `
            ${opcionesSimulacro("anexo" + i, (i + 1) + ". " + pregunta, [...SI_NO, "N/A"])}
            ${textoSimulacro("anexoObs" + i, "Observaciones de la pregunta " + (i + 1))}
          `).join("")}
        </fieldset>
        <div class="gu-actions"><button class="gu-primary" type="submit">GUARDAR SIMULACRO</button></div>
        <p role="status"></p>
      </form>`;
  }

  function datosSimulacro(formulario, organizacion, instalacion) {
    const datos = new FormData(formulario);
    const texto = campo => String(datos.get(campo) ?? "").trim();
    const numero = campo => Number(texto(campo));
    const tiempo = campo => numero(campo + "Min") * 60 + numero(campo + "Seg");
    const recuentos = Object.fromEntries(Object.keys(RECUENTOS).map(campo => [campo, numero(campo)]));
    if (recuentos.menoresDm > recuentos.menores || recuentos.personalDm > recuentos.docentes + recuentos.servicios) {
      throw new Error("Los recuentos de discapacidad o movilidad reducida deben estar incluidos en los totales.");
    }
    const edificio = tiempo("edificio");
    const recuento = tiempo("recuento");
    if (recuento < edificio) throw new Error("El tiempo hasta el recuento debe ser igual o posterior a la evacuación del edificio.");
    const plantas = (instalacion.plantas || []).map((nombre, i) =>
      ({ nombre, tiempo: tiempo("planta" + i), evacuados: numero("evacuados" + i) }));
    const datosCentro = Object.fromEntries(Object.keys(DATOS_INSTALACION).map(campo => [campo, instalacion[campo] || ""]));
    return {
      id: crypto.randomUUID(),
      organizacionId: String(organizacion.id),
      instalacionId: String(instalacion.id),
      centro: datosCentro,
      fecha: texto("fecha"),
      hora: texto("hora"),
      recuentos, edificio, recuento, plantas,
      valoraciones: Object.fromEntries(Object.keys(VALORACIONES).map(campo => [campo, texto(campo)])),
      incidencias: Object.fromEntries(Object.keys(INCIDENCIAS).map(campo => [campo, texto("inc-" + campo)])),
      accidentes: texto("accidentes"),
      deteriorosEdificio: texto("deteriorosEdificio"),
      deteriorosMobiliario: texto("deteriorosMobiliario"),
      conclusiones: texto("conclusiones"),
      pedagogicas: texto("pedagogicas"),
      balance: texto("balance"),
      sugerencias: texto("sugerencias"),
      director: texto("director"),
      tecnico: texto("tecnico"),
      anexo: datos.has("anexo0") ? PREGUNTAS_ANEXO.map((_, i) =>
        ({ respuesta: texto("anexo" + i), observaciones: texto("anexoObs" + i) })) : null
    };
  }

  function fechaInforme(fecha) {
    return fecha.split("-").reverse().join("/");
  }

  function informeSimulacro(registro) {
    const duracion = segundos => Math.floor(segundos / 60) + " min " + segundos % 60 + " s";
    const linea = (etiqueta, valor) => `<p><strong>${etiqueta}</strong> ${escapar(valor || valor === 0 ? valor : "—")}</p>`;
    const bloque = (titulo, cuerpo) => `<section><h2>${titulo}</h2>${cuerpo}</section>`;
    const seleccion = (opciones, elegida) => opciones.map(opcion =>
      `<span class="respuesta"><span class="casilla${opcion === elegida ? " marcada" : ""}"></span>${opcion}</span>`).join(" ");
    const valores = (...campos) => campos.map(campo => `
      <p><strong>${VALORACIONES[campo][0]}</strong> ${seleccion(VALORACIONES[campo][1], registro.valoraciones[campo])}</p>`).join("");
    const cabecera = Object.entries(DATOS_INSTALACION).map(([campo, nombre]) => linea(nombre, registro.centro[campo])).join("");
    const totales = registro.plantas.length ? registro.plantas.reduce((suma, planta) => suma + planta.evacuados, 0) : "—";
    const fila = (nombre, tiempo, evacuados) =>
      `<tr><td>${escapar(nombre)}</td><td>${duracion(tiempo)}</td><td>${evacuados}</td></tr>`;
    const tiempos = `
      <table><thead><tr><th>Centro / planta</th><th>Tiempo controlado</th><th>N.º de evacuados</th></tr></thead>
        <tbody>${fila("Total del centro", registro.edificio, totales)}
          ${registro.plantas.map(planta => fila(planta.nombre, planta.tiempo, planta.evacuados)).join("")}
        </tbody>
      </table>
      ${linea("Tiempo hasta el punto de reunión y recuento", duracion(registro.recuento))}`;
    const firmas = `<div class="firmas">${linea("Director/a", registro.director)}${linea("Técnico/a", registro.tecnico)}</div>`;
    const anexo = registro.anexo ? `
      <table><thead><tr><th>N.º</th><th>Cuestionario</th><th>Sí</th><th>No</th><th>N/A</th><th>Observaciones</th></tr></thead>
        <tbody>${PREGUNTAS_ANEXO.map((pregunta, i) => `<tr><td>${i + 1}</td><td>${pregunta}</td>
          ${[...SI_NO, "N/A"].map(opcion => `<td><span class="casilla${registro.anexo[i].respuesta === opcion ? " marcada" : ""}"></span></td>`).join("")}
          <td>${escapar(registro.anexo[i].observaciones)}</td></tr>`).join("")}</tbody>
      </table>` : "<p><strong>N/A</strong></p>";
    return `<article class="rq-informe">
      <p class="anexo-numero">ANEXO III</p>
      <h1>INFORME DE SIMULACRO DE EVACUACIÓN</h1>
      ${bloque("Identificación del centro", cabecera)}
      ${bloque("Desarrollo del simulacro",
        linea("Fecha y hora", fechaInforme(registro.fecha) + " · " + registro.hora) +
        valores("plan", "participacion") + linea("Incidencias generales", registro.incidencias.generales))}
      ${bloque("Participantes", Object.entries(RECUENTOS).map(([campo, etiqueta]) => linea(etiqueta, registro.recuentos[campo])).join(""))}
      ${bloque("Tiempos reales de la evacuación", tiempos + linea("Incidencias", registro.incidencias.tiempos))}
      ${bloque("Comportamiento de los menores", valores("comportamiento") + linea("Incidencias", registro.incidencias.menores))}
      <div class="hoja">
        ${bloque("Vías de evacuación", valores("capacidad", "interferencias", "obstaculos", "estrechamientos") + linea("Incidencias", registro.incidencias.vias))}
        ${bloque("Medios de emergencia utilizados", valores("alarma", "alumbrado", "escaleras") + linea("Incidencias", registro.incidencias.medios))}
        ${bloque("Pudieron cortarse los suministros de", valores("gas", "electricidad", "gasoleo", "agua"))}
        ${bloque("Incidentes imprevistos o sin clasificar", linea("Incidencias", registro.incidencias.imprevistas) +
          linea("Accidentes de personas", registro.accidentes) + linea("Deterioros en el edificio", registro.deteriorosEdificio) +
          linea("Deterioros en el mobiliario", registro.deteriorosMobiliario))}
      </div>
      <div class="hoja">${bloque("Balance general del simulacro",
        linea("Conclusiones", registro.conclusiones) + linea("Conclusiones pedagógicas", registro.pedagogicas) +
        linea("Balance general", registro.balance) + linea("Sugerencias", registro.sugerencias))}${firmas}</div>
      <div class="hoja">
        <h1>INFORME COMPLEMENTARIO SOBRE EL DESARROLLO DEL SIMULACRO ANUAL DE EVACUACIÓN EN RELACIÓN CON LAS PERSONAS CON DISCAPACIDAD O MOVILIDAD REDUCIDA</h1>
        ${bloque("Identificación del centro", cabecera + linea("Fecha y hora", fechaInforme(registro.fecha) + " · " + registro.hora))}
        ${anexo}${firmas}
      </div>
    </article>`;
  }

  const ESTILO_INFORME_SIMULACRO = `
    .rq-informe { font-family: Tecnico, Arial, sans-serif; color: #111; overflow-wrap: anywhere; }
    .rq-informe h1 { font-size: 15pt; line-height: 1.2; text-align: center; margin: 0 0 5mm; }
    .rq-informe h2 { font-size: 12pt; margin: 0 0 2mm; text-transform: uppercase; }
    .rq-informe section { border: 1px solid #333; padding: 2.5mm; margin: 0 0 2.5mm; }
    .rq-informe p { margin: 0 0 1mm; white-space: pre-wrap; }
    .rq-informe .anexo-numero { text-align: center; }
    .rq-informe table { width: 100%; border-collapse: collapse; margin-bottom: 2mm; }
    .rq-informe th, .rq-informe td { border: 1px solid #333; padding: 1mm; text-align: left; vertical-align: top; white-space: pre-wrap; }
    .rq-informe .respuesta { display: inline-block; margin-left: 2mm; white-space: nowrap; }
    .rq-informe .casilla { display: inline-block; box-sizing: border-box; width: 3mm; height: 3mm; border: 1px solid; margin-right: 1mm; vertical-align: middle; text-align: center; line-height: 2.5mm; }
    .rq-informe .casilla.marcada::after { content: "X"; }
    .rq-informe .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-top: 3mm; }
    .rq-informe .firmas p { padding-top: 10mm; border-bottom: 1px solid #333; }
    @media print {
      @page { size: A4; margin: 12mm; }
      .rq-informe { font-size: 10.5pt; line-height: 1.15; }
      .rq-informe .hoja { break-before: page; }
      .rq-informe h1, .rq-informe h2 { break-after: avoid; }
      .rq-informe tr, .rq-informe .firmas { break-inside: avoid; }
    }`;

  const CLAVE_BARRAS_FIRMA = "RITAQ_BARRAS_FIRMA_SIMULACRO_V1";
  const ROJO_FIRMA = "#b11b29";
  let motorPdf;

  function cargarMotorPdf() {
    if (!motorPdf) {
      motorPdf = new Promise((resolver, rechazar) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/pdfmake.min.js";
        script.crossOrigin = "anonymous";
        script.integrity = "sha384-G23ofMOEI98f9UnroUBjDi6Ll55Y5E6bOX4VAMJo0nIbuQRIxzn0g4athUOb58zs";
        script.onload = () => resolver(window.pdfMake);
        script.onerror = rechazar;
        document.head.append(script);
      }).catch(() => {
        motorPdf = undefined;
        throw new Error("No se pudo cargar el generador de PDF. Vuelve a intentarlo.");
      });
    }
    return motorPdf;
  }

  function cargarImagenPdf(url) {
    return new Promise((resolver, rechazar) => {
      const imagen = new Image();
      imagen.onload = () => resolver(imagen);
      imagen.onerror = () => rechazar(new Error("No se pudo leer la imagen del código de barras."));
      imagen.src = url;
    });
  }

  async function guardarBarrasFirma(archivo) {
    const url = URL.createObjectURL(archivo);
    try {
      const imagen = await cargarImagenPdf(url);
      if (imagen.naturalWidth !== 1944 || imagen.naturalHeight !== 184) {
        throw new Error("Selecciona el PNG original «Firma Codigo Barras.png».");
      }
      const lienzo = document.createElement("canvas");
      // La imagen original contiene también texto descriptivo. Solo se conserva la zona de barras.
      lienzo.width = 1620;
      lienzo.height = 106;
      const ctx = lienzo.getContext("2d");
      ctx.drawImage(imagen, 0, 15, lienzo.width, lienzo.height, 0, 0, lienzo.width, lienzo.height);
      const datos = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
      for (let i = 0; i < datos.data.length; i += 4) {
        const luminosidad = (datos.data[i] + datos.data[i + 1] + datos.data[i + 2]) / 3;
        datos.data[i + 3] = Math.round(datos.data[i + 3] * (255 - luminosidad) / 255);
        datos.data[i] = 177;
        datos.data[i + 1] = 27;
        datos.data[i + 2] = 41;
      }
      ctx.putImageData(datos, 0, 0);
      const barras = lienzo.toDataURL("image/png");
      localStorage.setItem(CLAVE_BARRAS_FIRMA, barras);
      return barras;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function fechaHoraGuardado(instante) {
    const opciones = { timeZone: "Europe/Madrid" };
    return {
      fecha: new Intl.DateTimeFormat("es-ES", { ...opciones, day: "2-digit", month: "2-digit", year: "numeric" }).format(instante),
      hora: new Intl.DateTimeFormat("es-ES", { ...opciones, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(instante)
    };
  }

  async function cartelaFirmaPdf(barras, instante) {
    const [imagen] = await Promise.all([cargarImagenPdf(barras), document.fonts.load('27px Tecnico')]);
    const { fecha, hora } = fechaHoraGuardado(instante);
    const lienzo = document.createElement("canvas");
    lienzo.width = 126;
    lienzo.height = 1620;
    const ctx = lienzo.getContext("2d");
    ctx.translate(0, lienzo.height);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = ctx.fillStyle = ROJO_FIRMA;
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 1614, 120);
    ctx.font = "27px Tecnico";
    ctx.textBaseline = "top";
    ctx.fillText("FIRMADO ELECTRONICAMENTE POR: Ángel M. de Llaguno en fecha " + fecha + " a la hora " + hora, 20, 10, 1580);
    ctx.fillText("proveedor de la Firma: AC FNMT Usuarios", 20, 43);
    ctx.drawImage(imagen, 20, 78, 1580, 32);
    return lienzo.toDataURL("image/png");
  }

  function textoExportado(nodo, negrita = false) {
    if (nodo.nodeType === 3) return [{ text: nodo.textContent.replaceAll("—", "-"), bold: negrita }];
    if (nodo.classList?.contains("casilla")) {
      return [{ text: nodo.classList.contains("marcada") ? "[X] " : "[ ] ", bold: negrita }];
    }
    return [...nodo.childNodes].flatMap(hijo => textoExportado(hijo, negrita || nodo.nodeName === "STRONG"));
  }

  function bloquesExportados(elemento) {
    return [...elemento.children].flatMap(nodo => {
      if (nodo.matches("h1, h2, p")) {
        const titulo = nodo.matches("h1, h2");
        const centrado = nodo.matches("h1, .anexo-numero");
        return [{
          text: textoExportado(nodo, titulo),
          fontSize: nodo.matches("h1") ? 15 : titulo ? 12 : 10.5,
          alignment: centrado ? "center" : "left",
          margin: [0, titulo ? 5 : 0, 0, titulo ? 6 : 3]
        }];
      }
      if (nodo.matches("table")) {
        const filas = [...nodo.rows];
        const anexo = filas[0].cells.length === 6;
        const widths = anexo ? [22, "*", 20, 20, 23, 84] : ["*", 112, 97];
        const body = filas.map(fila => [...fila.cells].map(celda =>
          ({ text: textoExportado(celda, celda.nodeName === "TH"), fontSize: anexo ? 9 : 10.5,
            margin: anexo ? [1, 1, 1, 1] : [2, 2, 2, 2] })));
        return [{ table: { headerRows: 1, widths, body }, margin: [0, 4, 0, 5] }];
      }
      if (nodo.matches(".firmas")) {
        return [{ columns: bloquesExportados(nodo), columnGap: 12, margin: [0, 18, 0, 0] }];
      }
      const interior = bloquesExportados(nodo);
      if (nodo.matches(".hoja") && interior.length) interior[0].pageBreak = "before";
      return interior;
    });
  }

  function definicionPdfSimulacro(informe, cartela) {
    return {
      pageSize: "A4",
      pageMargins: [78, 36, 36, 36],
      defaultStyle: { font: "Tecnico", fontSize: 10.5, lineHeight: 1.12, color: "#111111" },
      background: pagina => pagina === 1
        ? { image: cartela, width: 42, height: 540, absolutePosition: { x: 18, y: 145 } }
        : null,
      content: bloquesExportados(informe)
    };
  }

  async function descargarPdfSimulacro(registro, informe, barras, estado) {
    estado.textContent = "Generando el PDF para firma…";
    const [pdf, cartela] = await Promise.all([cargarMotorPdf(), cartelaFirmaPdf(barras, new Date())]);
    const fuente = peso => new URL("assets/tecnico_" + peso + ".ttf", document.baseURI).href;
    const fuentes = { Tecnico: {
      normal: fuente("regular"), bold: fuente("bold"),
      italics: fuente("regularitalic"), bolditalics: fuente("bolditalic")
    } };
    const nombre = "simulacro-" + registro.fecha + "-" + registro.hora.replace(":", "") + "-para-firmar.pdf";
    pdf.createPdf(definicionPdfSimulacro(informe, cartela), undefined, fuentes).download(nombre, () => {
      estado.textContent = "PDF preparado para firma.";
    });
  }

  function conectarBarrasFirma(contenedor) {
    const ajustes = contenedor.querySelector("[data-config-barras]");
    const archivo = ajustes.querySelector("[type=file]");
    const entrada = ajustes.querySelector("textarea");
    const estado = ajustes.querySelector('[role="status"]');
    ajustes.hidden = Boolean(localStorage.getItem(CLAVE_BARRAS_FIRMA));
    archivo.addEventListener("change", async () => {
      if (!archivo.files[0]) return;
      try {
        await guardarBarrasFirma(archivo.files[0]);
        ajustes.hidden = true;
      } catch (error) {
        estado.textContent = error.message;
      } finally {
        archivo.value = "";
      }
    });
    entrada.addEventListener("paste", async evento => {
      evento.preventDefault();
      try {
        const barras = evento.clipboardData.getData("text/plain").trim();
        if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(barras)) {
          throw new Error("El código de barras debe ser una imagen PNG preparada para RitaQ.");
        }
        const imagen = await cargarImagenPdf(barras);
        if (imagen.naturalWidth !== 1620 || imagen.naturalHeight !== 106) {
          throw new Error("La imagen no tiene el formato de código de barras de RitaQ.");
        }
        localStorage.setItem(CLAVE_BARRAS_FIRMA, barras);
        ajustes.hidden = true;
        contenedor.querySelector("[data-sim-estado]").textContent = "Código de barras guardado en este navegador.";
      } catch (error) {
        estado.textContent = error.message;
      }
    });
    return ajustes;
  }

  function conectarDescargaSimulacro(vista, registro, ajustes) {
    const boton = vista.querySelector("[data-descargar-pdf]");
    const estado = vista.querySelector("[data-estado-pdf]");
    boton.addEventListener("click", async () => {
      try {
        const barras = localStorage.getItem(CLAVE_BARRAS_FIRMA);
        if (!barras) {
          ajustes.hidden = false;
          ajustes.open = true;
          ajustes.scrollIntoView({ block: "center" });
          estado.textContent = "Configura el código de barras para preparar el PDF.";
          return;
        }
        boton.disabled = true;
        await descargarPdfSimulacro(registro, vista.querySelector(".rq-informe"), barras, estado);
      } catch (error) {
        estado.textContent = error.message || "No se pudo preparar el PDF.";
      } finally {
        boton.disabled = false;
      }
    });
  }

  function mostrarSimulacros(contenedor, volver) {
    if (!puedeGestionarInstalaciones()) return false;
    cargarClientes();
    const organizaciones = clientes.filter(c => c.instalaciones?.length);
    contenedor.innerHTML = `
      <div class="gestion-usuarios">
        <style>
          [data-formulario] input[type="radio"] {
            appearance: none; width: 1em; height: 1em; margin: 0 .25em 0 0;
            border: 1px solid currentColor; vertical-align: -0.1em;
          }
          [data-formulario] input[type="radio"]:checked { box-shadow: inset 0 0 0 .15em white; background: #0b5f82; }
        </style>
        <button class="rq-otros-volver" type="button">← Volver a Otros</button>
        <div class="gu-filtros">
          <label for="rqSimOrganizacion">Organización cliente</label>
          <select id="rqSimOrganizacion"><option value="">Seleccionar organización</option></select>
          <label for="rqSimInstalacion">Instalación</label>
          <select id="rqSimInstalacion" disabled><option value="">Seleccionar instalación</option></select>
        </div>
        <p data-sim-estado role="status"></p>
        <details data-config-barras hidden>
          <summary>Configurar código de barras del informe</summary>
          <p><label>Seleccionar «Firma Codigo Barras.png» <input type="file" accept="image/png"></label></p>
          <p><label>Pegar código de barras preparado <textarea rows="1"></textarea></label></p>
          <p role="status"></p>
        </details>
        <div data-sim-panel></div>
      </div>`;
    const organizacion = contenedor.querySelector("#rqSimOrganizacion");
    const instalacion = contenedor.querySelector("#rqSimInstalacion");
    const estado = contenedor.querySelector("[data-sim-estado]");
    const ajustesBarras = conectarBarrasFirma(contenedor);
    const panel = contenedor.querySelector("[data-sim-panel]");
    let seleccion = 0;
    contenedor.querySelector(".rq-otros-volver").addEventListener("click", volver);
    for (const cliente of organizaciones) {
      organizacion.add(new Option(cliente.razon_social || cliente.codigo_cliente || cliente.id, cliente.id));
    }
    if (!organizaciones.length) estado.textContent = "Da de alta una instalación en Gestión de Usuarios.";
    organizacion.addEventListener("change", () => {
      const cliente = organizaciones.find(c => String(c.id) === organizacion.value);
      instalacion.replaceChildren(new Option("Seleccionar instalación", ""));
      for (const i of cliente?.instalaciones || []) {
        const etiqueta = [i.nombre, i.direccion, i.borrada && "Borrada · solo historial"].filter(Boolean).join(" · ");
        instalacion.add(new Option(etiqueta, i.id));
      }
      instalacion.disabled = !cliente;
      instalacion.dispatchEvent(new Event("change"));
    });

    instalacion.addEventListener("change", () => {
      const actual = ++seleccion;
      panel.replaceChildren();
      estado.textContent = "";
      const cliente = organizaciones.find(c => String(c.id) === organizacion.value);
      const sede = cliente?.instalaciones.find(i => String(i.id) === instalacion.value);
      if (!sede) return;
      const porPagina = 25;
      let pagina = 0;
      panel.innerHTML = `
        ${sede.borrada ? "" : '<div class="gu-actions"><button class="gu-primary" type="button" data-alta>ALTA DE SIMULACRO</button></div>'}
        <div data-formulario hidden></div>
        <h2>Historial de la instalación</h2>
        <div data-historial></div>
        <div data-informe></div>`;
      const historial = panel.querySelector("[data-historial]");
      const vista = panel.querySelector("[data-informe]");
      const zonaFormulario = panel.querySelector("[data-formulario]");

      async function listar() {
        historial.textContent = "Cargando historial…";
        try {
          const registros = await consultarSimulacros(String(cliente.id), String(sede.id), pagina, porPagina);
          if (actual !== seleccion || !historial.isConnected) return;
          historial.replaceChildren();
          for (const registro of registros.slice(0, porPagina)) {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "gu-mini";
            boton.textContent = fechaInforme(registro.fecha) + " · " + registro.hora + " · Ver informe";
            const fila = document.createElement("p");
            fila.append(boton);
            historial.append(fila);
            boton.addEventListener("click", () => {
              vista.innerHTML = `<style>${ESTILO_INFORME_SIMULACRO}</style>
                <div class="gu-actions"><button class="gu-primary" type="button" data-descargar-pdf>DESCARGAR PDF PARA FIRMA</button></div>
                <p data-estado-pdf role="status"></p>
                ${informeSimulacro(registro)}`;
              conectarDescargaSimulacro(vista, registro, ajustesBarras);
              vista.scrollIntoView({ block: "start" });
            });
          }
          if (!registros.length) historial.textContent = "Todavía no hay simulacros registrados en esta instalación.";
          for (const [etiqueta, desplazamiento, disponible] of [
            ["Anterior", -1, pagina > 0], ["Siguiente", 1, registros.length > porPagina]
          ]) {
            if (!disponible) continue;
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "gu-mini";
            boton.textContent = etiqueta;
            boton.addEventListener("click", () => { pagina += desplazamiento; listar(); });
            historial.append(boton);
          }
        } catch (_) {
          if (actual === seleccion) historial.textContent = "No se pudo consultar el historial de este navegador.";
        }
      }

      panel.querySelector("[data-alta]")?.addEventListener("click", () => {
        if (!sede.plantas?.length) {
          estado.textContent = "Añade las plantas a la ficha de esta instalación en Gestión de Usuarios.";
          return;
        }
        estado.textContent = "";
        if (!zonaFormulario.hidden) {
          zonaFormulario.querySelector("[name=fecha]").focus();
          return;
        }
        zonaFormulario.innerHTML = formularioSimulacro(sede);
        zonaFormulario.hidden = false;
        const formulario = zonaFormulario.querySelector("form");
        const mensaje = formulario.querySelector('[role="status"]');
        const boton = formulario.querySelector('[type="submit"]');
        const anexo = formulario.querySelector("[data-anexo]");
        const na = formulario.querySelector("[data-anexo-na]");
        formulario.elements.fecha.max = new Intl.DateTimeFormat("sv-SE").format(new Date());
        formulario.elements.fecha.focus();
        formulario.addEventListener("input", () => {
          const aplica = Number(formulario.elements.menoresDm.value) > 0 ||
            Number(formulario.elements.personalDm.value) > 0 || formulario.elements.invitadosDm.checked;
          anexo.hidden = anexo.disabled = !aplica;
          na.hidden = aplica;
        });
        formulario.addEventListener("submit", async evento => {
          evento.preventDefault();
          if (boton.disabled || !puedeGestionarInstalaciones()) return;
          cargarClientes();
          const vigente = clientes.find(c => c.id === cliente.id)?.instalaciones?.find(i => i.id === sede.id && !i.borrada);
          if (!vigente) {
            mensaje.textContent = "La instalación se ha borrado del catálogo.";
            return;
          }
          let registro;
          try {
            registro = datosSimulacro(formulario, cliente, sede);
          } catch (error) {
            mensaje.textContent = error.message;
            return;
          }
          boton.disabled = true;
          try {
            await guardarSimulacro(registro);
            if (actual !== seleccion || !formulario.isConnected) return;
            zonaFormulario.hidden = true;
            zonaFormulario.replaceChildren();
            vista.replaceChildren();
            estado.textContent = "Simulacro guardado en el historial de esta instalación.";
            pagina = 0;
            listar();
          } catch (_) {
            mensaje.textContent = "No se pudo guardar el simulacro en este navegador.";
            boton.disabled = false;
          }
        });
      });
      listar();
    });
    return true;
  }

  // Permisos por organización (números de los botones del menú lateral).
  const VISORES = [
    [1, "Información Documentada y Sistema"],
    [2, "Políticas y Compromisos"],
    [3, "Análisis de Riesgos y Oportunidades"],
    [4, "Grupos de Interés"],
    [5, "Legislación y Normativa"],
    [6, "Indicadores y Objetivos (CMI)"],
    [7, "Recursos Humanos"],
    [8, "Infraestructura y Mantenimiento"],
    [9, "Producción, Equipos y Servicios"],
    [10, "Mejora y Calidad"],
    [11, "Impacto Ambiental"],
    [12, "Otros"],
    [13, "Avisos y Comunicaciones"]
  ];

  function mostrarPermisos(idSeleccionado) {
    const opciones = clientes.map(c => `<option value="${escapar(c.id)}" ${String(c.id) === String(idSeleccionado) ? "selected" : ""}>${escapar(c.razon_social || c.codigo_cliente || c.id)}</option>`).join("");
    host.innerHTML = `
      <div class="gestion-usuarios">
        ${barraVolver("Permisos de acceso a visores")}
        <div class="gu-note">Los permisos pertenecen a la organización cliente y se aplican a todos sus accesos. El botón 0 está reservado al consultor.</div>
        <div class="gu-filtros"><label for="guPermisosCliente">Organización cliente</label>
          <select id="guPermisosCliente" class="gu-permisos-select"><option value="">Seleccionar organización</option>${opciones}</select></div>
        <div id="guPermisosPanel"></div>
      </div>`;
    const selector = host.querySelector('#guPermisosCliente');
    const panel = host.querySelector('#guPermisosPanel');
    function actualizarPanel() {
      const c = clientes.find(item => String(item.id) === selector.value);
      if (!c) {panel.innerHTML = '<p>Selecciona una organización para gestionar sus permisos.</p>';return;}
      const actuales = Array.isArray(c.permisos_visores) ? c.permisos_visores.map(Number) : [];
      panel.innerHTML = `<form id="guPermisosForm"><div class="gu-permisos-lista">${VISORES.map(([n,t]) => `
        <label class="gu-permisos-fila"><input type="checkbox" name="visor" value="${n}" ${actuales.includes(n) ? 'checked' : ''}><span><strong>${n}.</strong> ${escapar(t)}</span></label>`).join('')}</div>
        <button type="submit" class="gu-tab active">GUARDAR PERMISOS</button>
        <p id="guPermisosEstado" role="status" aria-live="polite"></p></form>`;
      panel.querySelector('form').addEventListener('submit', function(ev) {
        ev.preventDefault();
        c.permisos_visores = Array.from(panel.querySelectorAll('input[name="visor"]:checked')).map(el => Number(el.value));
        guardarClientes();
        panel.querySelector('#guPermisosEstado').textContent = 'Permisos guardados en este navegador para ' + (c.razon_social || c.codigo_cliente || c.id) + '.';
      });
    }
    selector.addEventListener('change', actualizarPanel);
    actualizarPanel();
  }

  function barraVolver(titulo) {
    return `
      <div class="gu-subhead">
        <h2>${titulo}</h2>
        <button class="gu-tab volver" type="button" data-gu-tab="portada">
          VOLVER
        </button>
      </div>`;
  }

  function mostrarInformacionUsuarios() {
    host.innerHTML = `
      <div class="gestion-usuarios">
        ${barraVolver("Información de usuarios")}

        <div class="gu-filtros">
          <input id="guInfoBuscar" type="search"
            placeholder="Buscar por código, empresa, NIF, contacto o correo">
        </div>

        <div id="guInfoTabla"></div>
      </div>`;

    const input = document.getElementById("guInfoBuscar");

    function pintar() {
      const q = (input.value || "").trim().toLowerCase();

      const lista = clientes.filter(function (cliente) {
        return !q || [
          cliente.codigo_cliente,
          cliente.razon_social,
          cliente.nif,
          cliente.contacto,
          cliente.email,
          cliente.telefono,
          cliente.direccion
        ].join(" ").toLowerCase().includes(q);
      });

      document.getElementById("guInfoTabla").innerHTML = `
        <div class="gu-table-wrap">
          <table class="gu-table gu-table-info">
            <thead>
              <tr>
                <th>Código</th>
                <th>Usuario / empresa cliente</th>
                <th>NIF/CIF</th>
                <th>Persona de contacto</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Productos</th>
              </tr>
            </thead>
            <tbody>
              ${lista.map(function (cliente) {
                return `
                  <tr>
                    <td>${cliente.codigo_cliente
                      ? escapar(cliente.codigo_cliente)
                      : "SIN CÓDIGO"}</td>
                    <td>${escapar(cliente.razon_social || "")}</td>
                    <td>${escapar(cliente.nif || "")}</td>
                    <td>${escapar(cliente.contacto || "")}</td>
                    <td>${escapar(cliente.telefono || "")}</td>
                    <td>${escapar(cliente.email || "")}</td>
                    <td>${productosComoChips(cliente.productos)}</td>
                  </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>`;
    }

    input.addEventListener("input", pintar);
    pintar();
  }

  function mostrarCredenciales() {
    host.innerHTML = `
      <div class="gestion-usuarios">
        ${barraVolver("Usuarios y contraseñas")}

        <div class="gu-note">
          En este apartado RitaQ© muestra las credenciales almacenadas para cada empresa cliente.
        </div>

        <div class="gu-table-wrap">
          <table class="gu-table gu-table-credenciales">
            <thead>
              <tr>
                <th>Código</th>
                <th>Usuario / empresa cliente</th>
                <th>Usuario de acceso</th>
                <th>Contraseña</th>
                <th>Acceso</th>
              </tr>
            </thead>
            <tbody>
              ${clientes.map(function (cliente) {
                const usuario = String(cliente.usuario_acceso || "").trim();
                const password = String(cliente.password_provisional || "").trim();

                return `
                  <tr>
                    <td>${escapar(cliente.codigo_cliente || "SIN CÓDIGO")}</td>
                    <td>${escapar(cliente.razon_social || "")}</td>
                    <td>${usuario ? escapar(usuario) : '<span class="gu-pending">SIN ASIGNAR</span>'}</td>
                    <td>${password ? escapar(password) : '<span class="gu-pending">SIN ASIGNAR</span>'}</td>
                    <td>${cliente.acceso_activo === true ? "ACTIVADO" : "DESACTIVADO"}</td>
                  </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function mostrarUso() {
    let actividad = [];

    try {
      actividad = JSON.parse(localStorage.getItem("RITAQ_ACTIVIDAD") || "[]");
      if (!Array.isArray(actividad)) actividad = [];
    } catch (_) {
      actividad = [];
    }

    const porUsuario = {};

    actividad.forEach(function (registro) {
      const usuario = String(registro.usuario || registro.user || "").trim();
      if (!usuario) return;

      if (!porUsuario[usuario]) {
        porUsuario[usuario] = {
          usuario: usuario,
          accesos: 0,
          ultimo: ""
        };
      }

      porUsuario[usuario].accesos++;

      const fecha = String(registro.fecha || registro.timestamp || "");
      if (fecha > porUsuario[usuario].ultimo) {
        porUsuario[usuario].ultimo = fecha;
      }
    });

    const filas = clientes.map(function (cliente) {
      const usuario = String(cliente.usuario_acceso || "").trim();
      const uso = porUsuario[usuario] || { accesos: 0, ultimo: "" };

      return `
        <tr>
          <td>${escapar(cliente.codigo_cliente || "SIN CÓDIGO")}</td>
          <td>${escapar(cliente.razon_social || "")}</td>
          <td>${usuario ? escapar(usuario) : '<span class="gu-pending">SIN ASIGNAR</span>'}</td>
          <td>${uso.accesos}</td>
          <td>${uso.ultimo ? escapar(uso.ultimo) : '<span class="gu-pending">SIN REGISTRO</span>'}</td>
        </tr>`;
    }).join("");

    host.innerHTML = `
      <div class="gestion-usuarios">
        ${barraVolver("Uso de RitaQ© por usuario")}

        <div class="gu-note">
          Este panel queda preparado para explotar el registro de actividad.
          Sólo mostrará accesos realmente registrados por RitaQ©.
        </div>

        <div class="gu-table-wrap">
          <table class="gu-table gu-table-uso">
            <thead>
              <tr>
                <th>Código</th>
                <th>Usuario / empresa cliente</th>
                <th>Usuario de acceso</th>
                <th>Accesos registrados</th>
                <th>Último acceso registrado</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
      </div>`;
  }

  function resumen() {
    const activos = clientes.filter(c => c.activo !== false).length;
    const conCodigo = clientes.filter(c => String(c.codigo_cliente || "").trim()).length;
    const conAcceso = clientes.filter(c => c.acceso_activo === true).length;
    const conLogos = clientes.filter(c => c.logo_azul && c.logo_blanco).length;

    return `
      <div class="gu-resumen">
        <div class="gu-stat">
          <strong>${clientes.length}</strong>
          <span>Usuarios / clientes</span>
        </div>

        <div class="gu-stat">
          <strong>${activos}</strong>
          <span>Activos</span>
        </div>

        <div class="gu-stat">
          <strong>${conAcceso}</strong>
          <span>Accesos activados</span>
        </div>

        <div class="gu-stat">
          <strong>${conLogos}</strong>
          <span>Con dos logos</span>
        </div>
      </div>`;
  }

  function productosComoChips(productos) {
    if (!productos || !productos.length) {
      return `<span class="gu-pending">Sin asignar</span>`;
    }

    return productos.map(function (producto) {
      return `<span class="gu-chip">${escapar(producto)}</span>`;
    }).join("");
  }

  function mostrarListado() {
    host.innerHTML = `
      <div class="gestion-usuarios">
        ${cabeceraHerramientas("lista")}
        ${resumen()}

        <div class="gu-filtros">
          <input
            id="guBuscar"
            type="search"
            placeholder="Buscar por código, empresa, NIF, contacto o correo">

          <select id="guEstado">
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>

        <div id="guTabla"></div>
      </div>`;

    document.getElementById("guBuscar").addEventListener("input", pintarTabla);
    document.getElementById("guEstado").addEventListener("change", pintarTabla);

    pintarTabla();
  }

  function pintarTabla() {
    const buscar = document.getElementById("guBuscar");
    const estado = document.getElementById("guEstado");
    const tabla = document.getElementById("guTabla");

    const texto = (buscar ? buscar.value : "").trim().toLowerCase();
    const filtroEstado = estado ? estado.value : "todos";

    const filtrados = clientes.filter(function (cliente) {
      const bolsa = [
        cliente.codigo_cliente,
        cliente.razon_social,
        cliente.nif,
        cliente.contacto,
        cliente.email
      ].join(" ").toLowerCase();

      const activo = cliente.activo !== false;
      const coincideTexto = !texto || bolsa.includes(texto);
      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "activos" && activo) ||
        (filtroEstado === "inactivos" && !activo);

      return coincideTexto && coincideEstado;
    });

    tabla.innerHTML = `
      <div class="gu-table-wrap">
        <table class="gu-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Usuario / empresa cliente</th>
              <th>NIF/CIF</th>
              <th>Contacto</th>
              <th>Productos contratados</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            ${filtrados.map(function (cliente) {
              return `
                <tr>
                  <td>
                    ${cliente.codigo_cliente
                      ? `<span class="gu-code">${escapar(cliente.codigo_cliente)}</span>`
                      : `<span class="gu-pending">PENDIENTE</span>`}
                  </td>

                  <td>
                    <strong>${escapar(cliente.razon_social)}</strong><br>
                    ${escapar(cliente.email || "")}
                  </td>

                  <td>${escapar(cliente.nif || "")}</td>
                  <td>${escapar(cliente.contacto || "")}</td>
                  <td>${productosComoChips(cliente.productos)}</td>
                  <td>${cliente.activo !== false ? "ACTIVO" : "INACTIVO"}</td>

                  <td>
                    <button
                      class="gu-mini"
                      type="button"
                      data-gu-edit="${escapar(cliente.id)}">
                      EDITAR
                    </button>
                  </td>
                </tr>`;
            }).join("") || `
              <tr>
                <td colspan="7">No hay usuarios que coincidan con el filtro.</td>
              </tr>`}
          </tbody>
        </table>
      </div>`;
  }

  function checksProductos(seleccionados) {
    seleccionados = seleccionados || [];

    return PRODUCTOS.map(function (producto) {
      return `
        <label class="gu-check">
          <input
            type="checkbox"
            name="productos"
            value="${escapar(producto)}"
            ${seleccionados.includes(producto) ? "checked" : ""}>
          <span>${escapar(producto)}</span>
        </label>`;
    }).join("");
  }

  function mensaje(texto, error) {
    const caja = document.getElementById("guMensaje");
    if (!caja) return;

    caja.textContent = texto;
    caja.className = "gu-message show" + (error ? " error" : "");
  }

  function clienteVacio() {
    return {
      id: nuevoId(),
      codigo_cliente: "",
      razon_social: "",
      nif: "",
      direccion: "",
      telefono: "",
      email: "",
      contacto: "",
      servicio_historico: "",
      usuario_acceso: "",
      password_provisional: "pollo33",
      acceso_activo: false,
      productos: [],
      otras_iso: "",
      otros_productos: "",
      logo_azul: "",
      logo_blanco: "",
      activo: true
    };
  }

  function mostrarFormulario(cliente, esAlta) {
    const actual = cliente || clienteVacio();

    host.innerHTML = `
      <div class="gestion-usuarios">
        ${cabeceraHerramientas(esAlta ? "alta" : "lista")}

        <form id="guForm" class="gu-form">
          <h2 class="gu-form-title">
            ${esAlta ? "Alta individual de usuario" : "Edición de usuario"}
          </h2>

          <input type="hidden" name="id" value="${escapar(actual.id)}">

          <div class="gu-grid">
            <div class="gu-field">
              <label>Código cliente *</label>
              <input
                name="codigo_cliente"
                value="${escapar(actual.codigo_cliente)}"
                maxlength="12"
                placeholder="Ej. ATLS"
                required>
            </div>

            <div class="gu-field">
              <label>Razón social / nombre *</label>
              <input
                name="razon_social"
                value="${escapar(actual.razon_social)}"
                required>
            </div>

            <div class="gu-field">
              <label>NIF / CIF</label>
              <input name="nif" value="${escapar(actual.nif)}">
            </div>

            <div class="gu-field">
              <label>Persona de contacto</label>
              <input name="contacto" value="${escapar(actual.contacto)}">
            </div>

            <div class="gu-field full">
              <label>Dirección</label>
              <input name="direccion" value="${escapar(actual.direccion)}">
            </div>

            <div class="gu-field">
              <label>Teléfono</label>
              <input name="telefono" value="${escapar(actual.telefono)}">
            </div>

            <div class="gu-field">
              <label>Correo</label>
              <input
                name="email"
                type="email"
                value="${escapar(actual.email)}">
            </div>

            <div class="gu-field full">
              <label>Servicio histórico / actual</label>
              <input
                name="servicio_historico"
                value="${escapar(actual.servicio_historico)}">
            </div>

            <div class="gu-field">
              <label>Usuario de acceso</label>
              <input
                name="usuario_acceso"
                value="${escapar(actual.usuario_acceso)}"
                placeholder="Normalmente el código de cliente">
            </div>

            <div class="gu-field">
              <label>Contraseña provisional</label>
              <input
                name="password_provisional"
                value="${escapar(actual.password_provisional || (esAlta ? "pollo33" : ""))}">
            </div>

            <div class="gu-field">
              <label>Estado del cliente</label>
              <select name="activo">
                <option value="1" ${actual.activo !== false ? "selected" : ""}>
                  ACTIVO
                </option>
                <option value="0" ${actual.activo === false ? "selected" : ""}>
                  INACTIVO
                </option>
              </select>
            </div>

            <div class="gu-field">
              <label>Acceso a RitaQ©</label>
              <select name="acceso_activo">
                <option value="0" ${actual.acceso_activo !== true ? "selected" : ""}>
                  DESACTIVADO
                </option>
                <option value="1" ${actual.acceso_activo === true ? "selected" : ""}>
                  ACTIVADO
                </option>
              </select>
            </div>

            <div class="gu-products">
              <div class="gu-products-title">Productos contratados</div>
              <div class="gu-checks">
                ${checksProductos(actual.productos)}
              </div>
            </div>

            <div class="gu-field">
              <label>Otras ISO</label>
              <input
                name="otras_iso"
                value="${escapar(actual.otras_iso)}"
                placeholder="Especificar si procede">
            </div>

            <div class="gu-field">
              <label>Otros</label>
              <input
                name="otros_productos"
                value="${escapar(actual.otros_productos)}"
                placeholder="Especificar si procede">
            </div>

            <div class="gu-logo-grid">
              <div class="gu-logo-box">
                <label>Logo AZUL</label>
                <input
                  type="file"
                  name="logo_azul_file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml">

                <div class="gu-logo-preview" id="prevAzul">
                  ${actual.logo_azul
                    ? `<img src="${actual.logo_azul}" alt="Logo azul">`
                    : "Sin logo"}
                </div>
              </div>

              <div class="gu-logo-box">
                <label>Logo BLANCO</label>
                <input
                  type="file"
                  name="logo_blanco_file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml">

                <div class="gu-logo-preview blanco" id="prevBlanco">
                  ${actual.logo_blanco
                    ? `<img src="${actual.logo_blanco}" alt="Logo blanco">`
                    : "Sin logo"}
                </div>
              </div>
            </div>
          </div>

          <div id="guMensaje" class="gu-message"></div>

          <div class="gu-actions">
            <button class="gu-secondary" type="button" data-gu-tab="lista">
              CANCELAR
            </button>

            <button class="gu-primary" type="submit">
              ${esAlta ? "DAR DE ALTA" : "GUARDAR CAMBIOS"}
            </button>
          </div>
        </form>
      </div>`;

    const formulario = document.getElementById("guForm");
    let logoAzul = actual.logo_azul || "";
    let logoBlanco = actual.logo_blanco || "";

    function prepararLogo(input, previewId, asignar) {
      input.addEventListener("change", function () {
        const archivo = input.files && input.files[0];
        if (!archivo) return;

        const lector = new FileReader();

        lector.onload = function () {
          const contenido = String(lector.result || "");
          asignar(contenido);

          document.getElementById(previewId).innerHTML =
            `<img src="${contenido}" alt="Vista previa">`;
        };

        lector.readAsDataURL(archivo);
      });
    }

    prepararLogo(
      formulario.elements.logo_azul_file,
      "prevAzul",
      valor => logoAzul = valor
    );

    prepararLogo(
      formulario.elements.logo_blanco_file,
      "prevBlanco",
      valor => logoBlanco = valor
    );

    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();

      const datos = new FormData(formulario);
      const codigo = String(datos.get("codigo_cliente") || "")
        .trim()
        .toUpperCase();

      const duplicado = clientes.find(function (otro) {
        return otro.id !== actual.id &&
          String(otro.codigo_cliente || "").trim().toUpperCase() === codigo;
      });

      if (duplicado) {
        mensaje("Ese código de cliente ya existe.", true);
        return;
      }

      const guardado = {
        ...actual,
        id: String(datos.get("id")),
        codigo_cliente: codigo,
        razon_social: String(datos.get("razon_social") || "").trim(),
        nif: String(datos.get("nif") || "").trim(),
        direccion: String(datos.get("direccion") || "").trim(),
        telefono: String(datos.get("telefono") || "").trim(),
        email: String(datos.get("email") || "").trim(),
        contacto: String(datos.get("contacto") || "").trim(),
        servicio_historico: String(datos.get("servicio_historico") || "").trim(),
        usuario_acceso:
          String(datos.get("usuario_acceso") || "").trim().toUpperCase() || codigo,
        password_provisional:
          String(datos.get("password_provisional") || "").trim() || "pollo33",
        activo: datos.get("activo") === "1",
        acceso_activo: datos.get("acceso_activo") === "1",
        productos: datos.getAll("productos").map(String),
        otras_iso: String(datos.get("otras_iso") || "").trim(),
        otros_productos: String(datos.get("otros_productos") || "").trim(),
        logo_azul: logoAzul,
        logo_blanco: logoBlanco
      };

      const indice = clientes.findIndex(c => c.id === guardado.id);

      if (indice >= 0) {
        clientes[indice] = guardado;
      } else {
        clientes.push(guardado);
      }

      guardarClientes();
      mostrarListado();
    });
  }

  function mostrarAltaGrupo() {
    host.innerHTML = `
      <div class="gestion-usuarios">
        ${cabeceraHerramientas("grupo")}

        <div class="gu-note">
          Alta en grupo de empresas cliente. Puedes pegar filas copiadas desde
          Excel/Numbers o cargar un CSV/TSV. Columnas: Código, Razón social,
          NIF/CIF, Dirección, Teléfono, Correo, Contacto y Productos.
          Los productos se separan con “|”.
        </div>

        <div class="gu-import-box">
          <div class="gu-import-row">
            <input
              id="guArchivo"
              class="gu-file"
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain">

            <button id="guCargarArchivo" class="gu-secondary" type="button">
              CARGAR ARCHIVO
            </button>
          </div>

          <textarea
            id="guPegado"
            placeholder="ATLS&#9;ATLAS COMERCIAL INDUSTRIAL, SA&#9;A-48021729&#9;...&#9;ISO 9001|ISO 14001"></textarea>

          <div id="guMensaje" class="gu-message"></div>

          <div class="gu-actions">
            <button id="guImportar" class="gu-primary" type="button">
              IMPORTAR USUARIOS
            </button>
          </div>
        </div>
      </div>`;

    document.getElementById("guCargarArchivo").addEventListener("click", function () {
      const input = document.getElementById("guArchivo");
      const archivo = input.files && input.files[0];

      if (!archivo) {
        mensaje("Selecciona primero un archivo.", true);
        return;
      }

      const lector = new FileReader();
      lector.onload = function () {
        document.getElementById("guPegado").value = String(lector.result || "");
      };
      lector.readAsText(archivo, "utf-8");
    });

    document.getElementById("guImportar").addEventListener("click", function () {
      const texto = document.getElementById("guPegado").value.trim();

      if (!texto) {
        mensaje("No hay datos para importar.", true);
        return;
      }

      const lineas = texto.split(/\r?\n/).filter(linea => linea.trim());
      let altas = 0;
      const errores = [];

      lineas.forEach(function (linea, indice) {
        const separador = linea.includes("\t")
          ? "\t"
          : (linea.includes(";") ? ";" : ",");

        const columnas = linea
          .split(separador)
          .map(valor => valor.trim().replace(/^"|"$/g, ""));

        if (
          indice === 0 &&
          /c[oó]digo/i.test(columnas[0] || "") &&
          /raz[oó]n|empresa|cliente/i.test(columnas[1] || "")
        ) {
          return;
        }

        const codigo = String(columnas[0] || "").trim().toUpperCase();
        const razonSocial = String(columnas[1] || "").trim();

        const codigoExiste = clientes.some(function (cliente) {
          return String(cliente.codigo_cliente || "")
            .trim()
            .toUpperCase() === codigo;
        });

        if (!codigo || !razonSocial || codigoExiste) {
          errores.push(indice + 1);
          return;
        }

        clientes.push({
          id: nuevoId(),
          codigo_cliente: codigo,
          razon_social: razonSocial,
          nif: columnas[2] || "",
          direccion: columnas[3] || "",
          telefono: columnas[4] || "",
          email: columnas[5] || "",
          contacto: columnas[6] || "",
          servicio_historico: "",
          usuario_acceso: codigo,
          password_provisional: "pollo33",
          acceso_activo: false,
          productos: String(columnas[7] || "")
            .split("|")
            .map(valor => valor.trim())
            .filter(Boolean),
          otras_iso: "",
          otros_productos: "",
          logo_azul: "",
          logo_blanco: "",
          activo: true
        });

        altas++;
      });

      guardarClientes();

      mensaje(
        `Importación terminada: ${altas} altas.` +
        (errores.length
          ? ` Filas no importadas: ${errores.join(", ")}.`
          : ""),
        errores.length > 0
      );
    });
  }

  function manejarClick(evento) {
    const tab = evento.target.closest("[data-gu-tab]");

    if (tab) {
      const destino = tab.dataset.guTab;

      if (destino === "portada") mostrarPortada();
      if (destino === "lista") mostrarListado();
      if (destino === "alta") mostrarFormulario(null, true);
      if (destino === "grupo") mostrarAltaGrupo();
      if (destino === "informacion") mostrarInformacionUsuarios();
      if (destino === "credenciales") mostrarCredenciales();
      if (destino === "uso") mostrarUso();
      if (destino === "permisos") mostrarPermisos();
      if (destino === "instalaciones" && puedeGestionarInstalaciones()) mostrarInstalaciones();

      return;
    }

    const editar = evento.target.closest("[data-gu-edit]");

    if (editar) {
      const cliente = clientes.find(c => c.id === editar.dataset.guEdit);
      if (cliente) mostrarFormulario(cliente, false);
    }
  }

  function mostrar(contenedor) {
    host = contenedor;
    cargarClientes();

    host.removeEventListener("click", manejarClick);
    host.addEventListener("click", manejarClick);

    mostrarPortada();
  }

  window.RitaQGestionUsuarios = {
    mostrar,
    mostrarSimulacros
  };
})();
