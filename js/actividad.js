/*
  RitaQ© · Registro de actividad PROVISIONAL LOCAL.
  Mantiene la interfaz que después conectaremos al maestro persistente.
*/
(function(){
  const CLAVE = "RITAQ_ACTIVIDAD_PROVISIONAL";

  function leer(){
    try{
      const datos = JSON.parse(localStorage.getItem(CLAVE) || "[]");
      return Array.isArray(datos) ? datos : [];
    }catch(_){
      return [];
    }
  }

  function registrar(tipo, datos={}){
    const actividad = leer();
    actividad.push({
      id: "ACT-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2,7).toUpperCase(),
      fechaHora: new Date().toISOString(),
      tipo,
      usuario: datos.usuario || "",
      perfil: datos.perfil || "",
      codigoCliente: datos.codigoCliente || null,
      resultado: datos.resultado || "",
      origen: "WEB"
    });

    // Límite provisional para no convertir localStorage en almacén real.
    localStorage.setItem(CLAVE, JSON.stringify(actividad.slice(-500)));
  }

  window.RitaQActividad = Object.freeze({registrar, leer});
})();
