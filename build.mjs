import {spawnSync} from 'node:child_process';
import {copyFile,chmod,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
const build=spawnSync('tsc',['-p','tsconfig.json'],{stdio:'inherit'});if(build.status!==0)process.exit(build.status??1);
await copyFile('src/schema.json','dist/schema.json');await chmod('dist/cli.js',0o755);
