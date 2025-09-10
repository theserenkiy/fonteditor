const cl = console.log;

var cp1251 = {1027: 129, 8225: 135, 1046: 198, 8222: 132, 1047: 199, 1168: 165, 1048: 200, 1113: 154, 1049: 201, 1045: 197, 1050: 202, 1028: 170, 160: 160, 1040: 192, 1051: 203, 164: 164, 166: 166, 167: 167, 169: 169, 171: 171, 172: 172, 173: 173, 174: 174, 1053: 205, 176: 176, 177: 177, 1114: 156, 181: 181, 182: 182, 183: 183, 8221: 148, 187: 187, 1029: 189, 1056: 208, 1057: 209, 1058: 210, 8364: 136, 1112: 188, 1115: 158, 1059: 211, 1060: 212, 1030: 178, 1061: 213, 1062: 214, 1063: 215, 1116: 157, 1064: 216, 1065: 217, 1031: 175, 1066: 218, 1067: 219, 1068: 220, 1069: 221, 1070: 222, 1032: 163, 8226: 149, 1071: 223, 1072: 224, 8482: 153, 1073: 225, 8240: 137, 1118: 162, 1074: 226, 1110: 179, 8230: 133, 1075: 227, 1033: 138, 1076: 228, 1077: 229, 8211: 150, 1078: 230, 1119: 159, 1079: 231, 1042: 194, 1080: 232, 1034: 140, 1025: 168, 1081: 233, 1082: 234, 8212: 151, 1083: 235, 1169: 180, 1084: 236, 1052: 204, 1085: 237, 1035: 142, 1086: 238, 1087: 239, 1088: 240, 1089: 241, 1090: 242, 1036: 141, 1041: 193, 1091: 243, 1092: 244, 8224: 134, 1093: 245, 8470: 185, 1094: 246, 1054: 206, 1095: 247, 1096: 248, 8249: 139, 1097: 249, 1098: 250, 1044: 196, 1099: 251, 1111: 191, 1055: 207, 1100: 252, 1038: 161, 8220: 147, 1101: 253, 8250: 155, 1102: 254, 8216: 145, 1103: 255, 1043: 195, 1105: 184, 1039: 143, 1026: 128, 1106: 144, 8218: 130, 1107: 131, 8217: 146, 1108: 186, 1109: 190}

function asmData(data,bits,chunksize=8)
{
	if(data.length%2)data.push(0);
	let directive = {8:'.db', 16:'.dw', 32:'.dd'}[bits];
	let out = '';
	for(let i=0; i < data.length;i+=chunksize)
	{
		out += directive+' '+data.slice(i,i+chunksize).join(', ')+'\n';
	}
	return out;
}

function chunkedArray(data,chunksize=16,indent=2)
{
	let out='';
	let tabs = ''.padStart(indent,'	');
	for(let i=0; i < data.length; i+=chunksize)
		out += (i ? ',\n'+tabs : '')+data.slice(i,i+chunksize).join(', ');
	return out;
}

function getUTFCode(char,useCP1251=0)
{
	if(char.length != 1)
		return 0;
	if(useCP1251)
	{
		let c = char.charCodeAt(0);
		return c > 127 ? (cp1251[c] || 0) : c;
	}
	else{
		let c = (new TextEncoder()).encode(char[0]);
		if(c.length == 1)
			return c[0];
		else return (c[0] << 8) | c[1];
	}
}

function exportColumn(img,x,y0,total_length,bits,lsb_msb=1)
{
	let v = (new Uint32Array(1))[0];
	for(let y=0;y < bits;y++)
	{
		if(y0+y+1 > total_length)
			break;
		if(!img[y0+y] || !img[y0+y][x])
			continue;
		v |= 1 << (lsb_msb ? y : bits-1-y);
	}
	return v >>> 0;
}

function exportRow(img,y,x0,total_length,bits,lsb_msb=1)
{
	let v = (new Uint32Array(1))[0];
	if(!img[y])
		return v;
	for(let x=0;x < bits;x++)
	{
		if(x0+x+1 > total_length)
			break;
		if(img[y][x0+x])	
			v |= 1 << (lsb_msb ? x : bits-1-x);
	}
	return v >>> 0;
}

function makeColumnWordMap(img,w,h,bits,lsb_msb)
{
	let rowcnt = Math.ceil(h/bits);
	let wordmap = [];
	for(let row=0;row < rowcnt;row++)
	{
		wordmap[row] = [];
		for(let x=0; x < w; x++){
			wordmap[row][x] = exportColumn(img,x,row*bits,h,bits,lsb_msb)
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
			wordmap[y][col] = exportRow(img,y,col*bits,w,bits,lsb_msb)
		}
	}
	return {data:wordmap,w:colcnt,h};
}


function scanWordmap(wordmap,order='cols_rows')
{
	let out = [];
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
	cl(conf)
	let gnum = 1;

	
	let symref = [];
	let symref_py = {};
	let codes_py = []
	let glyphs = []
	let formatter = {
		'DEC': null,
		'HEX': [16,conf.word_size/4,'0x'],
		'BIN': [2,conf.word_size,'0b'],
	}[conf.format];

	for(let gl of font.glyphs)
	{
		let glyphname = '';
		let gvarname = conf.name+'_glyph_'+gnum;
		let symlist = [];

		for(let sym of gl.auto_symbols)
		{
			//symlist.push('\''+sym+'\'');
			symref.push(''+gvarname);
			symref_py[sym] = gnum-1
			symlist.push(getUTFCode(sym,conf.encoding=='cp1251'));
		}
		
		let wmap;
		if(conf.word_orient=='cols')
			wmap = makeColumnWordMap(gl.image, gl.width, font.height, conf.word_size, conf.bit_direction=='lsb_msb');
		else
			wmap = makeRowWordMap(gl.image, gl.width, font.height, conf.word_size, conf.bit_direction=='lsb_msb');
		//cl(wmap)
		let glcode = scanWordmap(wmap,conf.scan);

		glyphs.push({
			code: glcode,
			symlist
		})

		codes_py.push(`(${gl.width},(${glcode.join(",")}))`)
		gnum++;
	}
	
	let sym2id = [];
	let id2params = [];
	let data = [];
	let pos = 0;
	for(let i=0; i < glyphs.length; i++)
	{
		let gl = glyphs[i];
		id2params.push(pos,gl.code.length);
		data.push(...gl.code);
		pos += gl.code.length;
		for(let code of gl.symlist)
		{
			sym2id.push(code,i);
		}
	}

	

	cl(data)
	cl("FORMATTER",formatter)
	if(formatter)
		data = data.map(v => formatter[2]+v.toString(formatter[0]).padStart(formatter[1],'0'))

	let sym2id_type = conf.encoding == 'cp1251' ? 8 : 16;

	if(conf.lang=='C')
	{
		return `struct {
	uint16_t sym_count;
	//symbol lookup table, each pair is: symbol_code, glyph_id
	uint${sym2id_type}_t sym2id[${sym2id.length}];			
	//glyph params: glyph_start_position, glyph_length
	//each pair starts at index = glyph_id*2
	uint16_t glyph_params[${id2params.length}];	
	//glyphs data
	uint${conf.word_size}_t data[${data.length}];
} font_${conf.name} = {
	.sym_count = ${sym2id.length/2},
	.sym2id = {${sym2id.join(',')}},
	.glyph_params = {${id2params.join(',')}},
	.data = {
		${chunkedArray(data,16,2)}
	}
};`;
	}
	else if(conf.lang=="ASM")
	{
		let pref = 'FONT_'+conf.name.toUpperCase();
		return `
.EQU ${pref}_SYM_COUNT = ${sym2id.length/2}
;symbol lookup table, each pair is: symbol_code, glyph_id
${pref}_SYM2ID:	
${asmData(sym2id,16)}

;glyph params: glyph_start_position, glyph_length
;each pair starts at index = glyph_id*2
${pref}_GLYPH_PARAMS:
${asmData(id2params,16)}

//glyphs data
${pref}_DATA:
${asmData(data,conf.word_size,conf.format=='BIN' ? 2 : 8)}
`
	}
	else
	{
		return `FONT_${conf.name} = {
			"height": ${font.height},
			"glyphs": ${codes_py.join(",\n")},
			"refs": ${JSON.stringify(symref_py)}
		}`
	}
}