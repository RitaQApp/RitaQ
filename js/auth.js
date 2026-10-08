/* RitaQ© · Autenticación y enrutado por perfil */
(function(){
  const $ = id => document.getElementById(id);

  function mensaje(texto, tipo="error"){
    const zona = $("mensajeLogin");
    zona.textContent = texto;
    zona.className = "mensaje-login visible " + tipo;
  }

  function limpiarMensaje(){
    const zona = $("mensajeLogin");
    zona.textContent = "";
    zona.className = "mensaje-login";
  }

  const CACHE_CLIENTES = "RITAQ_CLIENTES_CACHE_V2";

  function clientesRegistrados(){
    const base = window.RITAQ_CLIENTES_BASE || [];
    try{
      const guardados = JSON.parse(localStorage.getItem(CACHE_CLIENTES) || "null");
      return Array.isArray(guardados) ? guardados : base;
    }catch(_){ return base; }
  }

  function usuariosDisponibles(){
    const especiales = (window.RITAQ_USUARIOS || []).filter(u => u.activo !== false);
    const codigos = new Set(especiales.map(u => String(u.codigo || "").toUpperCase()));
    const empresas = [];
    for(const cliente of clientesRegistrados()){
      if(cliente.activo === false || cliente.acceso_activo !== true) continue;
      const codigo = String(cliente.usuario_acceso || cliente.codigo_cliente || "").trim().toUpperCase();
      if(!codigo || codigos.has(codigo)) continue;
      codigos.add(codigo);
      empresas.push({
        codigo,
        nombre: String(cliente.razon_social || codigo),
        perfil: window.RITAQ_PERFILES.EMPRESA,
        perfilNombre: "Empresa Cliente",
        codigoCliente: cliente.codigo_cliente || cliente.id,
        activo: true,
        logo: cliente.logo_azul || cliente.logo_blanco || ""
      });
    }
    return [...empresas.sort((a,b) => a.nombre.localeCompare(b.nombre,"es")), ...especiales];
  }

  function buscarUsuario(codigo){
    return usuariosDisponibles().find(u => String(u.codigo || "").toUpperCase() === codigo) || null;
  }

  function prepararSelector(){
    const trigger = $("empresaTrigger");
    const lista = $("empresaOpciones");
    const actual = $("empresaActual");
    const usuario = $("usuario");
    let opciones = [];
    let indiceActivo = -1;

    function crearContenido(destino, dato){
      destino.replaceChildren();
      if(dato.logo){
        const img = document.createElement("img");
        img.className = "empresa-mini-logo";
        img.alt = "";
        img.src = dato.logo;
        img.addEventListener("error", () => img.remove(), {once:true});
        destino.append(img);
      }
      const texto = document.createElement("span");
      texto.textContent = dato.nombre;
      destino.append(texto);
    }
    function cerrar(){
      lista.hidden = true;
      trigger.setAttribute("aria-expanded","false");
      indiceActivo = -1;
    }
    function enfocar(indice){
      if(!opciones.length) return;
      indiceActivo = (indice + opciones.length) % opciones.length;
      opciones[indiceActivo].focus();
    }
    function seleccionar(dato){
      usuario.value = dato.codigo;
      actual.classList.remove("empresa-placeholder");
      crearContenido(actual, dato);
      trigger.setAttribute("aria-label", "Usuario: " + dato.nombre);
      opciones.forEach(op => op.setAttribute("aria-selected",String(op.dataset.codigo === dato.codigo)));
      cerrar();
      trigger.focus();
      limpiarMensaje();
    }
    for(const dato of usuariosDisponibles()){
      const opcion = document.createElement("button");
      opcion.type = "button";
      opcion.className = "empresa-opcion";
      opcion.setAttribute("role","option");
      opcion.setAttribute("aria-selected","false");
      opcion.tabIndex = -1;
      opcion.dataset.codigo = dato.codigo;
      crearContenido(opcion,dato);
      opcion.addEventListener("click",()=>seleccionar(dato));
      lista.append(opcion);
      opciones.push(opcion);
    }
    trigger.addEventListener("click",()=>{
      if(!lista.hidden){ cerrar(); return; }
      lista.hidden = false;
      trigger.setAttribute("aria-expanded","true");
    });
    trigger.addEventListener("keydown",e=>{
      if(["ArrowDown","ArrowUp","Home","End"].includes(e.key)){
        e.preventDefault();
        lista.hidden = false;
        trigger.setAttribute("aria-expanded","true");
        enfocar(e.key === "ArrowUp" || e.key === "End" ? opciones.length-1 : 0);
      }else if(e.key === "Escape") cerrar();
    });
    lista.addEventListener("keydown",e=>{
      const i = opciones.indexOf(document.activeElement);
      if(e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End"){
        e.preventDefault();
        enfocar(e.key === "Home" ? 0 : e.key === "End" ? opciones.length-1 : i+(e.key === "ArrowDown" ? 1 : -1));
      }else if(e.key === "Escape"){
        e.preventDefault(); cerrar(); trigger.focus();
      }else if(e.key === "Tab") cerrar();
    });
    document.addEventListener("pointerdown",e=>{
      if(!$("empresaSelect").contains(e.target)) cerrar();
    });
    return trigger;
  }

  function destino(usuario){
    if(usuario.perfil === window.RITAQ_PERFILES.EMPRESA) return "cliente.html";
    return "consultor.html";
  }

  async function autenticar(codigo, password){
    const usuario = buscarUsuario(codigo);
    if(!usuario) return null;
    return password === (usuario.perfil === window.RITAQ_PERFILES.EMPRESA ? "pollo33" : usuario.password) ? usuario : null;
  }

  async function entrar(evento){
    evento.preventDefault();
    limpiarMensaje();

    const codigo = $("usuario").value.trim().toUpperCase();
    const password = $("password").value;
    const boton = $("btnEntrar");

    if(!codigo || !password){
      mensaje(!codigo ? "Seleccione su empresa o usuario." : "Introduzca la contraseña.");
      return;
    }

    boton.disabled = true;
    boton.textContent = "COMPROBANDO...";

    try{
      const usuario = await autenticar(codigo,password);
      if(!usuario){
        window.RitaQActividad?.registrar("LOGIN_FALLIDO",{
          usuario:codigo,
          resultado:"CREDENCIALES_NO_VALIDAS"
        });
        mensaje("Usuario o contraseña no válidos.");
        return;
      }

      window.RitaQSesion.crear(usuario);
      window.RitaQActividad?.registrar("LOGIN",{
        usuario:usuario.codigo,
        perfil:usuario.perfil,
        codigoCliente:usuario.codigoCliente,
        resultado:"OK"
      });

      mensaje("Acceso correcto. Abriendo RitaQ©...","ok");
      window.setTimeout(()=>{ window.location.href = destino(usuario); },350);
    }catch(error){
      console.error(error);
      mensaje("No ha sido posible validar el acceso.");
    }finally{
      boton.disabled = false;
      boton.textContent = "ENTRAR";
    }
  }

  function alternarPassword(){
    const campo = $("password");
    const boton = $("btnMostrar");
    const visible = campo.type === "text";
    campo.type = visible ? "password" : "text";
    boton.textContent = visible ? "VER" : "OCULTAR";
    boton.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
  }

  document.addEventListener("DOMContentLoaded",()=>{
    const sesion = window.RitaQSesion?.obtener();
    if(sesion){
      window.location.replace(sesion.perfil === window.RITAQ_PERFILES.EMPRESA ? "cliente.html" : "consultor.html");
      return;
    }
    $("formLogin").addEventListener("submit",entrar);
    $("btnMostrar").addEventListener("click",alternarPassword);
    prepararSelector().focus();
  });
})();
