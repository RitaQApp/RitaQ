/* RITAQ© · Catálogo reutilizable de políticas y compromisos por norma.
   Persistencia provisional localStorage: NO supone sincronización multiusuario. */
(function(){
'use strict';
const STORAGE='RITAQ_POLITICAS_COMPROMISOS_V1';
const normas={
 'ISO 9001':{color:'#0868b1',label:'Calidad'},
 'ISO 14001':{color:'#32bd00',label:'Medioambiente'},
 'ISO 27001':{color:'#8236a7',label:'Seguridad de la Información'},
 'ISO 45001':{color:'#b44b08',label:'Seguridad Laboral'}
};
const uid=()=> 'PC-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
function leer(){try{let a=JSON.parse(localStorage.getItem(STORAGE)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
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
  const tabla=el('table',{class:'rq-pc-list'});const encabezados=el('tr');['Código','Documento','Tipo','Revisión','Estado','Clientes','Acción'].forEach(t=>encabezados.append(el('th',{},t)));const thead=el('thead');thead.append(encabezados);tabla.append(thead);const body=el('tbody');tabla.append(body);bloque.append(tabla);
  function pintar(){body.replaceChildren();const items=leer().filter(p=>p.norma===norma&&[p.codigo,p.titulo,p.tipo].join(' ').toLowerCase().includes(bus.input.value.toLowerCase()));if(!items.length){const r=el('tr'),c=el('td',{colspan:'7'},'No hay documentos registrados para esta búsqueda.');r.append(c);body.append(r)}for(const p of items){const r=el('tr');[p.codigo,p.titulo,p.tipo,p.revision,p.estado,String((p.clientes||[]).length)].forEach(v=>r.append(el('td',{},v)));const act=el('td');act.append(boton('ABRIR / EDITAR',()=>formulario(p)));r.append(act);body.append(r)}}bus.input.addEventListener('input',pintar);pintar();
  raiz.append(el('p',{class:'rq-pc-help'},'Los documentos de este catálogo son reutilizables. Las asignaciones guardan referencias al documento, no copias por cliente. Los cambios se almacenan provisionalmente en este navegador; falta integrar el repositorio central para producción.'));
 }
 function formulario(doc){const original=doc||{id:uid(),norma,tipo:'Política',codigo:'',titulo:'',revision:'0',estado:'Borrador',texto:'',clientes:[]};const seleccion=new Set(original.clientes||[]);
  raiz.replaceChildren();raiz.append(boton('← Volver al catálogo '+norma,lista,'rq-pc-back'));
  const h=el('div',{class:'rq-pc-head'});h.append(el('h2',{},doc?'Editar documento':'Nuevo documento'));raiz.append(h,el('div',{class:'rq-pc-color'}));
  const p=el('section',{class:'rq-pc-panel'}),grid=el('div',{class:'rq-pc-fields'});p.append(grid);raiz.append(p);
  const code=campo('Código documental',original.codigo,'text',true),tit=campo('Título',original.titulo,'text',true),rev=campo('Revisión',original.revision),text=campo('Texto íntegro de la política o compromiso',original.texto,'textarea');
  const tipoBox=el('div');tipoBox.append(el('label',{},'Tipo'));const tipo=el('select');['Política','Compromiso','Ambos'].forEach(s=>{const o=el('option',{value:s},s);o.selected=s===original.tipo;tipo.append(o)});tipoBox.append(tipo);
  const estBox=el('div');estBox.append(el('label',{},'Estado'));const estado=el('select');['Borrador','En revisión','Aprobado','Obsoleto'].forEach(s=>{const o=el('option',{value:s},s);o.selected=s===original.estado;estado.append(o)});estBox.append(estado);
  grid.append(code.box,tit.box,tipoBox,rev.box,estBox);text.box.classList.add('full');grid.append(text.box);
  const block=el('section',{class:'rq-pc-panel'});block.append(el('h3',{},'Asignación a clientes'),el('p',{class:'rq-pc-help'},'Un mismo documento puede estar asignado a cualquier número de clientes. Filtra por nombre o código y marca los destinatarios. Las asignaciones de clientes que no estén visibles se conservan.'));
  const contador=el('p',{class:'rq-pc-help'});block.append(contador);const busca=campo('Buscar cliente','','search');block.append(busca.box);
  const listaClientes=el('div',{class:'rq-pc-client-list'});block.append(listaClientes);raiz.append(block);
  const todos=clientes();const LIMITE=100;
  function pintar(){listaClientes.replaceChildren();const q=busca.input.value.trim().toLocaleLowerCase();const filtrados=todos.filter(c=>(c.nombre+' '+c.codigo+' '+c.id).toLocaleLowerCase().includes(q));contador.textContent=seleccion.size+' cliente(s) asignado(s) · '+filtrados.length+' encontrado(s). Se muestran como máximo '+LIMITE+' resultados.';
   if(!filtrados.length)listaClientes.append(el('div',{class:'rq-pc-empty'},'No se han encontrado clientes.'));
   for(const c of filtrados.slice(0,LIMITE)){const fila=el('label',{class:'rq-pc-client'}),check=el('input',{type:'checkbox',value:c.id});check.checked=seleccion.has(c.id);check.addEventListener('change',()=>{if(check.checked)seleccion.add(c.id);else seleccion.delete(c.id);contador.textContent=seleccion.size+' cliente(s) asignado(s) · '+filtrados.length+' encontrado(s). Se muestran como máximo '+LIMITE+' resultados.'});fila.append(check,el('span',{},c.nombre+' · '+(c.codigo||c.id)));listaClientes.append(fila)}
  }
  busca.input.addEventListener('input',pintar);pintar();
  const acciones=el('div',{class:'rq-pc-actions'});block.append(acciones);
  acciones.append(boton('GUARDAR DOCUMENTO Y ASIGNACIONES',()=>{const codigo=code.input.value.trim(),titulo=tit.input.value.trim();if(!codigo||!titulo){alert('Introduce código y título.');return}const docs=leer();if(docs.some(d=>d.id!==original.id&&d.norma===norma&&d.codigo.toLowerCase()===codigo.toLowerCase())){alert('Ya existe este código documental en '+norma);return}const actualizado={id:original.id,norma,codigo,titulo,tipo:tipo.value,revision:rev.input.value.trim(),estado:estado.value,texto:text.input.value,clientes:[...seleccion],modificado:new Date().toISOString()};const i=docs.findIndex(d=>d.id===original.id);if(i<0)docs.push(actualizado);else docs[i]=actualizado;try{grabar(docs);lista();aviso('Documento y asignaciones guardados en este navegador.')}catch(e){alert('No se han podido guardar los datos: '+e.message)}},'rq-pc-action primary'));
  acciones.append(boton('CANCELAR',lista));
  if(doc)acciones.append(boton('ELIMINAR DOCUMENTO',()=>{if(!confirm('¿Eliminar este documento y todas sus asignaciones?'))return;const docs=leer().filter(d=>d.id!==original.id);grabar(docs);lista();aviso('Documento eliminado.');},'rq-pc-action danger'));
  raiz.append(el('p',{class:'rq-pc-help'},'Guardar no equivale a aprobar. El estado es una clasificación administrativa; no hay flujo de firma o aprobación implantado.'));
 }
 lista();
}
window.RitaQPoliticasConsultor={mostrar,leer,clave:STORAGE};
})();
