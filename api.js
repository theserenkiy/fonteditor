import {cl, tryMkDir, tryCreateFile} from './server_lib.js';
import fs from 'fs';
import path from 'path';
import default_settings from './default_settings.js';
import { get } from 'https';

async function q(body,req,res)
{
	cl({body})
	return {...body}
}

//params: 
//path - path relative to "projects" directory
//[quiet=1] - return OK even if dir already exists
async function mkdir(b){
	let fullpath = './projects'+b.path;
	if(fs.existsSync(fullpath))
	{
		if(fs.lstatSync(fullpath).isDirectory())
			return {ok:1}
		else throw `Cannot create directory ${b.path}: duplicate file name`;
	}
	else{
		fs.mkdirSync(fullpath);
		return {ok:1}
	}
}

//params: 
//path - path relative to "projects" directory
//[binary=0] - 0 = read as string, 1 = read as byte array
async function readFile(b){
	let fullpath = path.resolve('./projects'+b.path);
	cl('read',fullpath)
	if(!fs.existsSync(fullpath))// || fs.lstatSync(fullpath).isDirectory())
	{
		throw `Cannot read file ${fullpath}: file not exists`;
	}
	else{
		let body = fs.readFileSync(fullpath);
		return {body: b.binary ? [...body.values()] : body+''}
	}
}

async function readJSON(b){
	let d = await readFile(b);
	return JSON.parse(d.body);
}

async function writeFile(b){
	let fullpath = './projects'+b.path;
	fs.writeFileSync(fullpath,b.data);
	return {ok:1}
}

async function getProjectList()
{
	let list = fs.readdirSync('./projects');

	let projects = [];
	for(let f of list)
	{
		cl('dir',f)
		let full = './projects/'+f;
		if(fs.lstatSync(full).isDirectory())
		{
			projects.push(f);
			initProject(f);
		}
	}
	return {projects}
}

async function initProject(name='')
{
	if(!name.trim())throw "Missing project name";
	let base = './projects/'+name;
	tryMkDir(base);
	tryMkDir(base+'/fonts');
	tryMkDir(base+'/objects');
	tryMkDir(base+'/clips');
	tryCreateFile(base+'/clips/_main.js','function main(ctx)\n{\n//здесь пишем код...\n}');
	tryCreateFile(base+'/settings.json',JSON.stringify(default_settings,null,'	'));
	tryCreateFile(base+'/sequence.xml','<sequence>\n</sequence>')
}

async function loadProject(b)
{
	let name = b.name;
	cl({name})

	if(!name.trim())
		throw "Missing project name";

	let path = './projects/'+name+'';
	
	if(!fs.existsSync(path))
		throw "Project not found";

	initProject(name);
	
	
	let out = {
		settings: JSON.parse(fs.readFileSync(path+'/settings.json')+''),
		sequence: fs.readFileSync(path+'/sequence.xml')+''
	};

	for(let d of ['fonts','objects','clips'])
	{
		out[d] = readObjectList(path+'/'+d)
	}
	
	return out;
}


function readObjectList(path)
{
	return fs.readdirSync(path)
		.filter(f => /\.(json|js)$/.test(f))
		.map(v => v.replace(/\.[^\.]+$/,''));
}


async function create(b)
{
	let {type,project,name,content} = b;
	let prjpath = './projects/'+project;
	if(!fs.existsSync(prjpath))
		throw `Project ${project} not exists`;
	if(!['fonts','objects'].includes(type))
		throw `Wrong type ${type} for creation`;

	let path = prjpath+'/'+type+'/'+name+'.json';

	fs.writeFileSync(path,'{}');

	return {list:readObjectList(prjpath+'/'+type)};
}

async function createProject(b)
{
	await initProject(b.name);
	return getProjectList(b);
}

async function loadResources(b)
{
	let path = './projects/'+b.project;
	if(!fs.existsSync(path))
		throw 'Unknown project';

	let out = {}
	for(let type of ['fonts','objects','clips'])
	{
		out[type] = {}
		let ff = fs.readdirSync(path+'/'+type);
		for(let f of ff)
		{
			let m = /(.+?)\.(json|js)$/.exec(f);
			if(!m)continue;
			let d = fs.readFileSync(path+'/'+type+'/'+f)+'';
			if(m[2]=='json')
				d = JSON.parse(d)
			
			out[type][m[1]] = d;
		}
	}
	return out;
}

export default {

	q,
	mkdir,
	readFile,
	readJSON,
	writeFile,
	getProjectList,
	initProject,
	loadProject,
	create,
	createProject,
	loadResources
}