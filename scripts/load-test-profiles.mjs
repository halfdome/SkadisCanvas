// Integration tests use the same upstream resolver as the app. Cache only outside source.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createProfileLoader,installProfile,PROFILE_REVISION} from '../lib/profile-loader.mjs';
import {profileModels} from '../lib/bambu-profiles.mjs';
const directory=new URL(`../outputs/profile-cache/${PROFILE_REVISION}/`,import.meta.url);
await mkdir(directory,{recursive:true});
const file=url=>new URL(createHash('sha256').update(url).digest('hex')+'.json',directory);
const cache={async match(url){try{return new Response(await readFile(file(url)));}catch{return undefined;}},async put(url,response){await writeFile(file(url),await response.text());}};
const load=createProfileLoader({cacheProvider:async()=>cache});
for(const key of Object.keys(profileModels))installProfile(key,await load(key));
