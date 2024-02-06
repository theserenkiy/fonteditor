const cl = console.log;
function exportColumn(img,x,y0,bits,lsb_top=1)
{
	let v = 0;
	for(let y=0;y < bits;y++)
	{
		if(!img[y0+y] || !img[y0+y][x])
			continue;
		v |= 1 << (lsb_top ? y : bits-1-y);
	}
	return v;
}

function makeColumnWordMap(img,w,h,bits,lsb_top)
{
	let rowcnt = Math.ceil(h/bits);
	let wordmap = [];
	for(let row=0;row < rowcnt;row++)
	{
		wordmap[row] = [];
		for(let x=0; x < w; x++){
			wordmap[row][x] = exportColumn(img,x,row*bits,bits,lsb_top)
		}
	}
	return {data:wordmap,w,h:rowcnt};
}

function scanWordmap(wordmap,order='h')
{
	let out = [wordmap.h*wordmap.w];
	if(order=='h')
	{
		for(let y=0;y < wordmap.h;y++)
		{
			for(let x=0; x < wordmap.w; x++)
				out.push(wordmap.data[y][x]);
		}
	}
	else
	{
		for(let x=0;x < wordmap.w;x++)
		{
			for(let y=0; y < wordmap.h; y++)
				out.push(wordmap.data[y][x]);
		}
	}
	return out;
}

export default function fontExport(font,prefix,lang='C',order='rows',align="left")
{
	let gnum = 1;

	let symlist = [];
	let symref = [];
	let vars = {};
	for(let gl of font.glyphs)
	{
		let gvarname = prefix+'_glyph_'+gnum;
		for(let sym of gl.auto_symbols)
		{
			symlist.push('\''+sym+'\'');
			symref.push(''+gvarname);
		}
		
		let wmap = makeColumnWordMap(gl.image, gl.width, font.height, 8, 1);
		//cl(wmap)
		let glcode = scanWordmap(wmap,'h');

		vars[gvarname] = ['uint8_t',glcode.length,glcode]//.map(v => v.toString(2).padStart(8,'0'))];
		gnum++;
	}
	vars[prefix+'_symref'] = ['uint8_t *',symref.length,symref];
	vars[prefix+'_symlist'] = ['uint8_t',symlist.length,symlist];

	let code = '';
	for(let varname in vars)
	{
		let v = vars[varname];
		code += v[0]+' '+varname+'[] = {'+v[2].join(',')+'};\n';
	}
	return code;
}