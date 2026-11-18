
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
              <div class="gu-field">
                <label for="guInstalacionNombre">Nombre de la instalación</label>
                <input id="guInstalacionNombre" name="nombre" required>
              </div>
              <div class="gu-field">
                <label for="guInstalacionDireccion">Dirección (opcional)</label>
                <input id="guInstalacionDireccion" name="direccion">
              </div>
            </div>
            <div class="gu-actions">
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

    function seleccionada() {
      return clientes.find(c => String(c.id) === selector.value && selector.value !== "");
    }

    function mostrarLista(organizacion) {
      panel.hidden = !organizacion;
      if (!organizacion) return;
      const instalaciones = organizacion.instalaciones || [];
      lista.innerHTML = instalaciones.length ? `
        <div class="gu-table-wrap">
          <table class="gu-table">
            <thead><tr><th scope="col">Instalación</th><th scope="col">Dirección</th></tr></thead>
            <tbody>${instalaciones.map(i => `
              <tr><td>${escapar(i.nombre)}</td><td>${escapar(i.direccion || "—")}</td></tr>`).join("")}</tbody>
          </table>
        </div>` : "<p>Esta organización todavía no tiene instalaciones.</p>";
    }

    selector.addEventListener("change", function () {
      cargarClientes();
      formulario.reset();
      estado.textContent = "";
      mostrarLista(seleccionada());
    });

    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();
      if (!puedeGestionarInstalaciones()) return;
      cargarClientes();
      const organizacion = seleccionada();
      if (!organizacion) {
        estado.textContent = "Selecciona una organización disponible.";
        return;
      }
      const nombre = formulario.elements.nombre.value.trim();
      const direccion = formulario.elements.direccion.value.trim();
      if (!nombre) {
        estado.textContent = "Escribe el nombre de la instalación.";
        formulario.elements.nombre.focus();
        return;
      }
      const instalaciones = organizacion.instalaciones || [];
      const duplicada = instalaciones.some(i =>
        i.nombre.localeCompare(nombre, "es", { sensitivity: "accent" }) === 0 &&
        (i.direccion || "").localeCompare(direccion, "es", { sensitivity: "accent" }) === 0);
      if (duplicada) {
        estado.textContent = "Ya existe una instalación con ese nombre y dirección en esta organización.";
        return;
      }
      organizacion.instalaciones = [...instalaciones, { id: crypto.randomUUID(), nombre, direccion }];
      if (!guardarClientes()) {
        cargarClientes();
        estado.textContent = "No se pudo guardar la instalación en este navegador.";
        return;
      }
      formulario.reset();
      mostrarLista(organizacion);
      estado.textContent = "Instalación guardada en este navegador.";
      formulario.elements.nombre.focus();
    });
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
    mostrar: mostrar
  };
})();
