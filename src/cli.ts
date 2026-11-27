#!/usr/bin/env node
import {readFile,writeFile,open} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateManifest} from './validate.js';
import starter from './starter.manifest.json' with {type:'json'};
const [action,file,...rest]=process.argv.slice(2);
try{
 if(!file||!['init','validate','build'].includes(action))throw new Error('Verwendung: renzu-extension init manifest.json | validate manifest.json | build manifest.json --out paket.json');
 if(action==='init'){
  const example=starter;
  await writeFile(file,JSON.stringify(example,null,2)+'\n',{flag:'wx'});console.log('Manifest erstellt.');
 }else{
  const handle=await open(file,'r');let raw:string;
  try{const bytes=Buffer.alloc(128*1024+1);const result=await handle.read(bytes,0,bytes.length,0);if(result.bytesRead>128*1024)throw new Error('Manifest ist größer als 128 KiB.');raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,result.bytesRead));}finally{await handle.close();}
  const manifest=validateManifest(JSON.parse(raw));const output=JSON.stringify(manifest,null,2)+'\n';
  if(action==='build'){if(rest[0]!=='--out'||!rest[1]||rest.length!==2)throw new Error('build benötigt --out paket.json');await writeFile(rest[1],output,{flag:'wx'});}
  console.log(`${manifest.id} ${manifest.version} · gültig · Datei-SHA256 ${createHash('sha256').update(action==='build'?output:raw).digest('hex')}`);
 }
}catch(error){console.error(error instanceof SyntaxError?'Ungültiges JSON.':error instanceof Error?error.message:'Manifest konnte nicht verarbeitet werden.');process.exitCode=1;}
