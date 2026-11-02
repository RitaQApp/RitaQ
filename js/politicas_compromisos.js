/* RITAQ© · Catálogo reutilizable de políticas y compromisos por norma.
   Persistencia provisional localStorage: NO supone sincronización multiusuario. */
(function(){
'use strict';
const STORAGE='RITAQ_POLITICAS_COMPROMISOS_V1';
const REVS='RITAQ_POLITICAS_REVISIONES_CLIENTE_V1';
const PROP='RITAQ_POLITICAS_PROPUESTAS_V1';
const ASSIGN='RITAQ_POLITICAS_ASIGNACIONES_V2';
const MASTER='RITAQ_POLITICAS_MAESTRO_NUMEROS_V2';
const VERSIONES='RITAQ_POLITICAS_VERSIONES_CLIENTE_V2';
function obtenerJson(k,def){try{return JSON.parse(localStorage.getItem(k)||'null')||def}catch(_){return def}}
function revisiones(){return obtenerJson(REVS,{})}
function propuestas(){return obtenerJson(PROP,[])}
function versionesCliente(){return obtenerJson(VERSIONES,{})}
function historialCliente(doc,clienteId){const m=versionesCliente();return m[String(doc.numeroMaestro)]?.[String(clienteId)]||[]}
function guardarVersion(doc,clienteId,rev,contenido){
 const m=versionesCliente(),n=String(doc.numeroMaestro),c=String(clienteId);
 m[n] ||= {};m[n][c] ||= [];
 const actual=m[n][c];
 const ya=actual.find(v=>String(v.revision)===String(rev));
 if(ya){if(ya.texto!==contenido)throw new Error('La revisión '+rev+' ya existe con otro contenido. Utiliza un número de revisión nuevo para conservar el historial.');return false}
 actual.push({revision:String(rev),texto:contenido,fecha:new Date().toISOString()});
 localStorage.setItem(VERSIONES,JSON.stringify(m));
 const antiguas=revisiones();antiguas[doc.id] ||= {};antiguas[doc.id][c]=String(rev);localStorage.setItem(REVS,JSON.stringify(antiguas));
 return true;
}

const normas={
 'ISO 9001':{color:'#0868b1',label:'Calidad'},
 'ISO 14001':{color:'#32bd00',label:'Medioambiente'},
 'ISO 27001':{color:'#8236a7',label:'Seguridad de la Información'},
 'ISO 45001':{color:'#b44b08',label:'Seguridad Laboral'}
};
const uid=()=> 'PC-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
function leer(){try{let a=JSON.parse(localStorage.getItem(STORAGE)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
/* Migración no destructiva: preserva maestro anterior, revisiones y propuestas.
   Las asignaciones pasan a una tabla separada de referencias ID maestro -> IDs cliente. */
function prepararMaestro(){
 const documentos=leer();if(!documentos.length)return;
 const numeros=obtenerJson(MASTER,{}), asignados=obtenerJson(ASSIGN,{});
 let n=Math.max(0,...Object.values(numeros).map(x=>parseInt(x,10)||0),...documentos.map(d=>parseInt(d.numeroMaestro,10)||0));
 let cambios=false, cambiosAsignacion=false;
 for(const d of documentos){
  if(!numeros[d.id]){numeros[d.id]=d.numeroMaestro||String(++n).padStart(6,'0');cambios=true}
  if(d.numeroMaestro!==numeros[d.id]){d.numeroMaestro=numeros[d.id];cambios=true}
  if(!Object.prototype.hasOwnProperty.call(asignados,d.numeroMaestro)){asignados[d.numeroMaestro]=[...new Set((asignados[d.id]||d.clientes||[]).map(String))];cambiosAsignacion=true}
 }
 if(cambios)localStorage.setItem(STORAGE,JSON.stringify(documentos));
 if(cambios||!localStorage.getItem(MASTER))localStorage.setItem(MASTER,JSON.stringify(numeros));
 if(cambiosAsignacion)localStorage.setItem(ASSIGN,JSON.stringify(asignados));
}
function asignaciones(){prepararMaestro();return obtenerJson(ASSIGN,{})}
function numeroNuevo(){const m=obtenerJson(MASTER,{});const docs=leer();const max=Math.max(0,...Object.values(m).map(v=>parseInt(v,10)||0),...docs.map(d=>parseInt(d.numeroMaestro,10)||0));return String(max+1).padStart(6,'0')}
prepararMaestro();
function grabar(a){localStorage.setItem(STORAGE,JSON.stringify(a))}
function clientes(){
 // Maestro que utiliza Gestión de Usuarios; no se crean duplicados de clientes.
 let lista=window.RITAQ_CLIENTES_BASE||[];
 try{let c=JSON.parse(localStorage.getItem('RITAQ_CLIENTES_V1')||'null');if(Array.isArray(c))lista=c}catch(e){}
 return lista.filter(c=>c&&c.id).map(c=>({id:String(c.id),nombre:String(c.razon_social||c.codigo_cliente||c.id),codigo:String(c.codigo_cliente||'')}));
}
function el(tag,attrs={},txt){const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='class')n.className=v;else if(k==='type')n.type=v;else n.setAttribute(k,v)}if(txt!=null)n.textContent=txt;return n}
function boton(txt,fn,cl='rq-pc-action'){const b=el('button',{type:'button',class:cl},txt);b.addEventListener('click',fn);return b}
function campo(label,value,type='text',required=false){const box=el('div'),lab=el('label',{},label),input=el(type==='textarea'?'textarea':'input',type==='textarea'?{}:{type});input.value=value||'';input.required=required;box.append(lab,input);return{box,input}}
function mostrar(host,norma,volver){
 const n=normas[norma];if(!n)return;
 const raiz=el('div',{class:'rq-pc'});raiz.style.setProperty('--rq-pc-color',n.color);
 host.replaceChildren(raiz);
 function aviso(texto){const a=el('div',{class:'rq-pc-status',role:'status'},texto);raiz.prepend(a);setTimeout(()=>a.remove(),4000)}
 function lista(){
  raiz.replaceChildren();raiz.append(boton('← Volver a Políticas y Compromisos',volver,'rq-pc-back'));
  const encabezado=el('div',{class:'rq-pc-head'});encabezado.append(el('h2',{},'Políticas y Compromisos · '+norma),boton('+ NUEVA POLÍTICA / COMPROMISO',()=>formulario(null),'rq-pc-action primary'));raiz.append(encabezado,el('div',{class:'rq-pc-color'}));
  const bloque=el('section',{class:'rq-pc-panel'});raiz.append(bloque);
  const bus=campo('Buscar documento','','search');bloque.append(bus.box);
  const tabla=el('table',{class:'rq-pc-list'});const encabezados=el('tr');['Nº maestro','Código','Documento','Tipo','Revisión','Estado','Clientes','Acción'].forEach(t=>encabezados.append(el('th',{},t)));const thead=el('thead');thead.append(encabezados);tabla.append(thead);const body=el('tbody');tabla.append(body);bloque.append(tabla);
  function pintar(){body.replaceChildren();const items=leer().filter(p=>p.norma===norma&&[p.codigo,p.titulo,p.tipo].join(' ').toLowerCase().includes(bus.input.value.toLowerCase()));if(!items.length){const r=el('tr'),c=el('td',{colspan:'8'},'No hay documentos registrados para esta búsqueda.');r.append(c);body.append(r)}for(const p of items){const r=el('tr');[p.numeroMaestro||'—',p.codigo,p.titulo,p.tipo,p.revision,p.estado,String((asignaciones()[p.numeroMaestro]||[]).length)].forEach(v=>r.append(el('td',{},v)));const act=el('td');act.append(boton('ABRIR / EDITAR',()=>formulario(p)));r.append(act);body.append(r)}}bus.input.addEventListener('input',pintar);pintar();
  raiz.append(el('p',{class:'rq-pc-help'},'Los documentos de este catálogo son reutilizables. Las asignaciones guardan referencias al documento, no copias por cliente. Los cambios se almacenan provisionalmente en este navegador; falta integrar el repositorio central para producción.'));
 }
 function formulario(doc){const original=doc||{id:uid(),numeroMaestro:numeroNuevo(),norma,tipo:'Política',codigo:'',titulo:'',revision:'0',estado:'Borrador',texto:'',clientes:[]};const seleccion=new Set(doc?(asignaciones()[original.numeroMaestro]||original.clientes||[]):[]);
  raiz.replaceChildren();raiz.append(boton('← Volver al catálogo '+norma,lista,'rq-pc-back'));
  const h=el('div',{class:'rq-pc-head'});h.append(el('h2',{},doc?'Editar documento':'Nuevo documento'));raiz.append(h,el('div',{class:'rq-pc-color'}));
  const p=el('section',{class:'rq-pc-panel'}),grid=el('div',{class:'rq-pc-fields'});p.append(el('p',{class:'rq-pc-help'},'Nº de maestro: '+original.numeroMaestro+' · Identificador permanente del documento.'));p.append(grid);raiz.append(p);
  const code=campo('Código documental',original.codigo,'text',true),tit=campo('Título',original.titulo,'text',true),rev=campo('Revisión',original.revision),text=campo('Texto íntegro de la política o compromiso',original.texto,'textarea');
  const tipoBox=el('div');tipoBox.append(el('label',{},'Tipo'));const tipo=el('select');['Política','Compromiso','Ambos'].forEach(s=>{const o=el('option',{value:s},s);o.selected=s===original.tipo;tipo.append(o)});tipoBox.append(tipo);
  const estBox=el('div');estBox.append(el('label',{},'Estado'));const estado=el('select');['Borrador','En revisión','Aprobado','Obsoleto'].forEach(s=>{const o=el('option',{value:s},s);o.selected=s===original.estado;estado.append(o)});estBox.append(estado);
  grid.append(code.box,tit.box,tipoBox,rev.box,estBox);text.box.classList.add('full');grid.append(text.box);
  const block=el('section',{class:'rq-pc-panel'});block.append(el('h3',{},'Asignación a clientes'),el('p',{class:'rq-pc-help'},'Las asignaciones son referencias al número de maestro, sin copiar el documento. Filtra y marca los clientes. Los que no estén visibles se conservan.'));
  const contador=el('p',{class:'rq-pc-help'});block.append(contador);const busca=campo('Buscar cliente','','search');block.append(busca.box);
  const listaClientes=el('div',{class:'rq-pc-client-list'});block.append(listaClientes);raiz.append(block);
  const todos=clientes();const LIMITE=100;
  const revBox=el('section',{class:'rq-pc-panel'});revBox.append(el('h3',{},'Revisiones particulares por cliente'),el('p',{class:'rq-pc-help'},'Cada cliente tiene su propia revisión y texto. Las revisiones anteriores se conservan: para cambiar el texto utiliza un número nuevo. Guarda antes el maestro y la asignación del cliente.'));const revBusqueda=campo('Buscar cliente para configurar su revisión','','search');revBox.append(revBusqueda.box);const revLista=el('div',{class:'rq-pc-client-list'});revBox.append(revLista);raiz.append(revBox);
  function pintarRevisiones(){revLista.replaceChildren();const q=revBusqueda.input.value.trim().toLowerCase(), visibles=todos.filter(c=>(c.nombre+' '+c.codigo+' '+c.id).toLowerCase().includes(q)).slice(0,50);const mapa=revisiones();for(const c of visibles.filter(c=>seleccion.has(c.id))){const fila=el('div',{class:'rq-pc-rev-row'});fila.append(el('span',{},c.nombre+' ('+(c.codigo||c.id)+')'));const historico=historialCliente(original,c.id);
 const actualRev=String(mapa[original.id]?.[c.id]??(historico.length?historico[historico.length-1].revision:original.revision??'0'));
 const inp=el('input',{type:'text','aria-label':'Revisión para '+c.nombre,placeholder:'Revisión específica'});inp.value=actualRev;
 const area=el('textarea',{'aria-label':'Texto propio de '+c.nombre});area.rows=5;
 const actual=historico.find(v=>String(v.revision)===actualRev);
 area.value=actual?actual.texto:original.texto||'';
 const label=el('label',{},'Texto de la revisión del cliente');
 const anteriores=el('select',{'aria-label':'Historial de versiones de '+c.nombre});
 anteriores.append(el('option',{value:''},'Ver una revisión anterior…'));
 for(const v of [...historico].reverse())anteriores.append(el('option',{value:String(v.revision)},'Revisión '+v.revision+' · '+new Date(v.fecha).toLocaleDateString('es-ES')));
 anteriores.addEventListener('change',()=>{const v=historico.find(x=>String(x.revision)===anteriores.value);if(v){inp.value=v.revision;area.value=v.texto}});
 const save=boton('GUARDAR VERSIÓN DEL CLIENTE',()=>{
  const persisted=leer().find(d=>d.id===original.id);
  if(!persisted){aviso('Guarda primero el documento y las asignaciones.');return}
  if(!(asignaciones()[persisted.numeroMaestro]||[]).includes(c.id)){aviso('El cliente debe estar asignado y guardado antes de crear su versión.');return}
  const revision=inp.value.trim();if(!revision){aviso('Introduce un número de revisión.');return}
  try{const creada=guardarVersion(persisted,c.id,revision,area.value);aviso(creada?'Versión registrada y conservada en el historial.':'Esta revisión ya estaba guardada sin cambios.');pintarRevisiones()}
  catch(err){alert(err.message)}
 });
 fila.append(inp,label,area,anteriores,save);revLista.append(fila)}}revBusqueda.input.addEventListener('input',pintarRevisiones);pintarRevisiones();
  function pintar(){listaClientes.replaceChildren();const q=busca.input.value.trim().toLocaleLowerCase();const filtrados=todos.filter(c=>(c.nombre+' '+c.codigo+' '+c.id).toLocaleLowerCase().includes(q));contador.textContent=seleccion.size+' cliente(s) asignado(s) · '+filtrados.length+' encontrado(s). Se muestran como máximo '+LIMITE+' resultados.';
   if(!filtrados.length)listaClientes.append(el('div',{class:'rq-pc-empty'},'No se han encontrado clientes.'));
   for(const c of filtrados.slice(0,LIMITE)){const fila=el('label',{class:'rq-pc-client'}),check=el('input',{type:'checkbox',value:c.id});check.checked=seleccion.has(c.id);check.addEventListener('change',()=>{if(check.checked)seleccion.add(c.id);else seleccion.delete(c.id);pintarRevisiones();contador.textContent=seleccion.size+' cliente(s) asignado(s) · '+filtrados.length+' encontrado(s). Se muestran como máximo '+LIMITE+' resultados.'});fila.append(check,el('span',{},c.nombre+' · '+(c.codigo||c.id)));listaClientes.append(fila)}
  }
  busca.input.addEventListener('input',pintar);pintar();
  const acciones=el('div',{class:'rq-pc-actions'});block.append(acciones);
  acciones.append(boton('GUARDAR DOCUMENTO Y ASIGNACIONES',()=>{const codigo=code.input.value.trim(),titulo=tit.input.value.trim();if(!codigo||!titulo){alert('Introduce código y título.');return}const docs=leer();if(docs.some(d=>d.id!==original.id&&d.norma===norma&&d.codigo.toLowerCase()===codigo.toLowerCase())){alert('Ya existe este código documental en '+norma);return}const actualizado={id:original.id,numeroMaestro:original.numeroMaestro,norma,codigo,titulo,tipo:tipo.value,revision:rev.input.value.trim(),estado:estado.value,texto:text.input.value,clientes:[...seleccion],modificado:new Date().toISOString()};const i=docs.findIndex(d=>d.id===original.id);if(i<0)docs.push(actualizado);else docs[i]=actualizado;try{grabar(docs);const a=asignaciones();a[original.numeroMaestro]=[...seleccion];localStorage.setItem(ASSIGN,JSON.stringify(a));lista();aviso('Maestro y referencias de clientes guardados en este navegador.')}catch(e){alert('No se han podido guardar los datos: '+e.message)}},'rq-pc-action primary'));
  acciones.append(boton('CANCELAR',lista));
  if(doc)acciones.append(boton('ELIMINAR DOCUMENTO',()=>{if(!confirm('¿Eliminar este documento y todas sus asignaciones?'))return;const docs=leer().filter(d=>d.id!==original.id);grabar(docs);const a=asignaciones();delete a[original.numeroMaestro];localStorage.setItem(ASSIGN,JSON.stringify(a));lista();aviso('Documento eliminado.');},'rq-pc-action danger'));
  raiz.append(el('p',{class:'rq-pc-help'},'Guardar no equivale a aprobar. El estado es una clasificación administrativa; no hay flujo de firma o aprobación implantado.'));
 }
 lista();
}
function mostrarPropuestas(host,volver){host.replaceChildren();const raiz=el('div',{class:'rq-pc'});raiz.style.setProperty('--rq-pc-color','#b21c24');host.append(raiz);raiz.append(boton('← Volver a Políticas y Compromisos',volver,'rq-pc-back'),el('h2',{},'99 · Propuestas de cambio'));const listado=el('div');raiz.append(listado);function pintar(){listado.replaceChildren();const arr=propuestas();if(!arr.length)listado.append(el('p',{},'No hay propuestas registradas.'));for(const item of arr.slice().reverse()){const card=el('section',{class:'rq-pc-panel'});card.append(el('h3',{},item.cliente+' · '+item.codigo+' · '+item.norma),el('p',{},'Fecha: '+new Date(item.fecha).toLocaleString('es-ES')+' · Estado: '+item.estado),el('p',{class:'rq-pc-propuesta-texto'},item.texto));if(item.estado==='Pendiente')card.append(boton('MARCAR COMO REVISADA',()=>{const a=propuestas();const i=a.findIndex(x=>x.id===item.id);if(i!==-1){a[i].estado='Revisada';localStorage.setItem(PROP,JSON.stringify(a));pintar()}}));listado.append(card)}}pintar()}
window.RitaQPoliticasConsultor={mostrar,mostrarPropuestas,leer,asignaciones,clave:STORAGE};
})();
