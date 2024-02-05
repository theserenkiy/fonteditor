import fs from 'fs';


export const cl = console.log;

export function tryMkDir(path)
{
	if(!fs.existsSync(path))
		fs.mkdirSync(path);
}

export function tryCreateFile(path,data='')
{
	if(!fs.existsSync(path))
		fs.writeFileSync(path,data);
}


