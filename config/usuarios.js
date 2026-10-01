/*
  RitaQ© · Configuración PROVISIONAL de usuarios.
  Esta estructura será sustituida por el maestro persistente de usuarios.

  Perfiles previstos:
    SUPERADMIN -> Megarrecontra-jefe que sabe "muchismo"
    CONSULTOR  -> Consultor
    EMPRESA    -> Empresa Cliente
*/

window.RITAQ_PERFILES = Object.freeze({
  SUPERADMIN: "SUPERADMIN",
  CONSULTOR: "CONSULTOR",
  EMPRESA: "EMPRESA"
});

window.RITAQ_USUARIOS = [
  {
    codigo: "ALS",
    nombre: "ALS",
    perfil: window.RITAQ_PERFILES.SUPERADMIN,
    perfilNombre: 'Megarrecontra-jefe que sabe "muchismo"',
    codigoCliente: null,
    activo: true,

    // Contraseña provisional de esta maqueta: pollo33
    // Texto local deliberadamente provisional. Se sustituirá por autenticación persistente.
    password: "pollo33"
  }
];
