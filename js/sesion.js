/* RitaQ© · Sesión */
(function(){
  const CLAVE = "RITAQ_SESION";

  function crear(usuario){
    const sesion = {
      usuario: usuario.codigo,
      nombre: usuario.nombre,
      perfil: usuario.perfil,
      perfilNombre: usuario.perfilNombre,
      codigoCliente: usuario.codigoCliente || null,
      inicio: new Date().toISOString()
    };
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
    return sesion;
  }

  function obtener(){
    try{return JSON.parse(sessionStorage.getItem(CLAVE) || "null");}
    catch(_){return null;}
  }

  function cerrar(){
    const sesion = obtener();
    if(sesion && window.RitaQActividad){
      window.RitaQActividad.registrar("LOGOUT",{
        usuario:sesion.usuario,
        perfil:sesion.perfil,
        codigoCliente:sesion.codigoCliente,
        resultado:"OK"
      });
    }
    sessionStorage.removeItem(CLAVE);
  }

  window.RitaQSesion = Object.freeze({crear, obtener, cerrar});
})();
