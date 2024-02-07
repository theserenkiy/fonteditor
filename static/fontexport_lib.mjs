const cl = console.log;

const ruSymTranslit = 'A,B,V,G,D,Ye,Yo,Zh,Z,I,Ikr,K,L,M,N,O,P,R,S,T,U,F,Kh,Ts,Ch,Sh,Shch,Hrd,Y,Sft,E,Yu,Ya'.split(',');


function exportColumn(img,x,y0,bits,lsb_msb=1)
{
	let v = 0;
	for(let y=0;y < bits;y++)
	{
		if(!img[y0+y] || !img[y0+y][x])
			continue;
		v |= 1 << (lsb_msb ? y : bits-1-y);
	}
	return v;
}

function exportRow(img,y,x0,bits,lsb_msb=1)
{
	let v = (new Uint32Array(1))[0];
	if(!img[y])
		return v;
	for(let x=0;x < bits;x++)
	{
		if(img[y][x0+x])	
			v |= 1 << (lsb_msb ? y : bits-1-y);
	}
	return v;
}

function makeColumnWordMap(img,w,h,bits,lsb_msb)
{
	let rowcnt = Math.ceil(h/bits);
	let wordmap = [];
	for(let row=0;row < rowcnt;row++)
	{
		wordmap[row] = [];
		for(let x=0; x < w; x++){
			wordmap[row][x] = exportColumn(img,x,row*bits,bits,lsb_msb)
		}
	}
	return {data:wordmap,w,h:rowcnt};
}

function makeRowWordMap(img,w,h,bits,lsb_msb)
{
	let colcnt = Math.ceil(w/bits);
	let wordmap = [];

	for(let y=0; y < h; y++)
	{
		wordmap[y] = [];
		for(let col=0;col < colcnt;col++){
			wordmap[y][col] = exportRow(img,y,col*bits,bits,lsb_msb)
		}
	}
	return {data:wordmap,w:colcnt,h};
}


function scanWordmap(wordmap,order='cols_rows')
{
	let out = [wordmap.h*wordmap.w];
	if(order=='rows_cols')
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

export default function exportFont(font,conf)
{
	let gnum = 1;

	let symlist = [];
	let symref = [];
	let vars = {};
	for(let gl of font.glyphs)
	{
		let glyphname = '';
		let gvarname = conf.name+'_glyph_'+gnum;

		for(let sym of gl.auto_symbols)
		{
			symlist.push('\''+sym+'\'');
			symref.push(''+gvarname);
		}
		
		let wmap;
		if(conf.word_orient=='cols')
			wmap = makeColumnWordMap(gl.image, gl.width, font.height, conf.word_size, conf.bit_direction=='lsb_msb');
		else
			wmap = makeRowWordMap(gl.image, gl.width, font.height, conf.word_size, conf.bit_direction=='lsb_msb');
		//cl(wmap)
		let glcode = scanWordmap(wmap,conf.scan);

		let formatter = {
			'DEC': null,
			'HEX': [16,conf.word_size/4,'0x'],
			'BIN': [2,conf.word_size,'0b'],
		}[conf.format];

		if(formatter)
			glcode = glcode.map(v => formatter[2]+v.toString(formatter[0]).padStart(formatter[1],'0'))

		vars[gvarname] = ['uint'+conf.word_size+'_t',glcode.length,glcode]//.map(v => v.toString(2).padStart(8,'0'))];
		gnum++;
	}
	vars[conf.name+'_symref'] = ['uint8_t *',symref.length,symref];
	vars[conf.name+'_symlist'] = ['uint8_t',symlist.length,symlist];

	let code = '';
	for(let varname in vars)
	{
		let v = vars[varname];
		code += v[0]+' '+varname+'[] = {'+v[2].join(',')+'};\n';
	}
	return code;
}