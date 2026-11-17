import {readFileSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
import {unzipSync,strFromU8} from 'fflate';
// Support native slice-only output as well as a sliced 3MF. Slice-only mode
// avoids macOS window restoration for thumbnail rendering, not slicer checks.
export function slicedPlates(file){
 if(statSync(file).isDirectory())return readdirSync(file).filter(n=>/^plate_\d+\.gcode$/.test(n)).map(n=>[n,readFileSync(path.join(file,n),'utf8')]);
 return Object.entries(unzipSync(readFileSync(file))).filter(([n])=>/^Metadata\/plate_\d+\.gcode$/.test(n)).map(([n,data])=>[n,strFromU8(data)]);
}
