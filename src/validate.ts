import type {ExtensionManifest} from './index.js';
import schema from './schema.json' with {type:'json'};
const builtins=new Set<string>(schema.$defs.resource.anyOf[0].enum);
const bytes=(value:string)=>new TextEncoder().encode(value).byteLength;
const fail=(path:string):never=>{throw new Error(`Ungültiges Manifest: ${path}.`);};
function object(value:unknown,path:string,keys:readonly string[]):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))return fail(path);
 const record=value as Record<string,unknown>;
 if(Object.keys(record).some(key=>!keys.includes(key)))return fail(`${path}: unbekanntes Feld`);
 return record;
}
function list(value:unknown,path:string,max:number):unknown[]{if(!Array.isArray(value)||!value.length||value.length>max)return fail(path);return value;}
function identifier(value:unknown,path:string):string{if(typeof value!=='string'||!value.length||value.length>96||!/^[a-zA-Z0-9._-]+$/.test(value))return fail(path);return value;}
function localized(value:unknown,path:string,max:number){
 const strings=object(value,path,Object.keys(value&&typeof value==='object'?value:{}));
 if(!Object.keys(strings).length||Object.keys(strings).length>8)return fail(path);
 for(const [locale,text] of Object.entries(strings))if(!/^[a-z]{2}$/.test(locale)||typeof text!=='string'||!text.trim()||bytes(text)>max||/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/u.test(text))return fail(path);
}
function resource(value:unknown,path:string):string{
 if(typeof value!=='string'||!(builtins.has(value)||/^crd:[a-z0-9.-]+:[a-z0-9]+:[a-z0-9-]+:[A-Za-z][A-Za-z0-9]*:(ns|cluster)$/.test(value)))return fail(path);
 return value;
}
/** Authoring-time validation. The installed app validates again at its native boundary. */
export function validateManifest(value:unknown):ExtensionManifest{
 let encoded:string;try{encoded=JSON.stringify(value);}catch{return fail('JSON');}
 if(!encoded||bytes(encoded)>128*1024)return fail('maximal 128 KiB');
 const root=object(value,'Manifest',['schemaVersion','id','version','title','description','permissions','queries','views']);
 if(root.schemaVersion!==1)return fail('schemaVersion');identifier(root.id,'id');identifier(root.version,'version');localized(root.title,'title',100);localized(root.description,'description',1000);
 const allowed=new Set<string>();
 for(const value of list(root.permissions,'permissions',8)){
  const item=object(value,'permission',['capability','resources']);if(item.capability!=='resources.metadata.read')return fail('capability');
  for(const entry of list(item.resources,'resources',32))allowed.add(resource(entry,'resource'));
 }
 const queries=new Set<string>();
 for(const value of list(root.queries,'queries',16)){
  const item=object(value,'query',['id','resource']),id=identifier(item.id,'query.id');
  if(queries.has(id)||!allowed.has(resource(item.resource,'query.resource')))return fail('query: doppelt oder nicht freigegeben');queries.add(id);
 }
 const views=new Set<string>();
 for(const value of list(root.views,'views',12)){
  const view=object(value,'view',['id','title','icon','navigation','widgets']),id=identifier(view.id,'view.id');if(views.has(id))return fail('view.id: doppelt');views.add(id);localized(view.title,'view.title',100);
  if(!['boxes','database','network','shield','layers','activity','settings'].includes(String(view.icon)))return fail('view.icon');
  if(view.navigation!==undefined){const nav=object(view.navigation,'navigation',['label','order']);localized(nav.label,'navigation.label',60);if(nav.order!==undefined&&(!Number.isInteger(nav.order)||Number(nav.order)<0||Number(nav.order)>255))return fail('navigation.order');}
  for(const value of list(view.widgets,'widgets',24)){
   const widget=object(value,'widget',['type','title','query','body']);
   if(widget.type==='text'){object(value,'text',['type','body']);localized(widget.body,'widget.body',2000);}
   else {object(value,'widget',['type','title','query']);if(!['metric','resource-table','resource-grid','open-resource-list'].includes(String(widget.type)))return fail('widget.type');localized(widget.title,'widget.title',100);if(typeof widget.query!=='string'||!queries.has(widget.query))return fail('widget.query');}
  }
 }
 return value as ExtensionManifest;
}
