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

  function buscarUsuario(codigo){
    return (window.RITAQ_USUARIOS || []).find(u =>
      u.activo !== false && String(u.codigo || "").toUpperCase() === codigo
    ) || null;
  }

  function destino(usuario){
    if(usuario.perfil === window.RITAQ_PERFILES.EMPRESA) return "cliente.html";
    return "consultor.html";
  }

  async function autenticar(codigo, password){
    const usuario = buscarUsuario(codigo);
    if(!usuario) return null;
    return password === usuario.password ? usuario : null;
  }

  async function entrar(evento){
    evento.preventDefault();
    limpiarMensaje();

    const codigo = $("usuario").value.trim().toUpperCase();
    const password = $("password").value;
    const boton = $("btnEntrar");

    if(!codigo || !password){
      mensaje("Introduzca usuario y contraseña.");
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
    $("usuario").focus();
  });
})();
