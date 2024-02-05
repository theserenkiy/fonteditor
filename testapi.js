import api from './api.js';
import {cl} from './server_lib.js';


let cmd = process.argv[2];

(async()=>{
	try{

		if(!api[cmd])throw 'Unknown command';
	
		let res = await api[cmd](...process.argv.slice(3))
		cl(res)
	
	}catch(e)
	{
		cl('ERROR',e)
	}
})()

