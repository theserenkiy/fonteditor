import Graphic from './graphic.mjs';
import Clip from './clip.mjs';
import env from './env.mjs';
import {cl} from './lib.mjs'

function byte2array(b)
{
	return b.toString(2).padStart(8,'0').split('').reverse().map(v => +v);
}

export function createClip(opts)
{
	return new Clip({...opts})
}

export function createTextStrings(strs,font_names,opts={})
{
	let objs = [];
	for(let str of strs)
	{
		if(str.indexOf('\n')>=0)
			throw 'Нельзя добавлять многострочный текст через createTextLines()'
		objs.push(createText(str,font_names,opts))
	}
	return objs;
}

export function createText(str,font_names='',opts={})
{
	opts = {
		letter_spacing: 1,
		line_spacing: 1,
		space_width: 0,
		align: 'center',
		...opts
	}

	if(!['center','left','right'].includes(opts.align))
		throw `Неправильный align "${opts.align}" для текста`

	font_names = font_names.trim()
	if(!font_names)
		throw 'Не указаны шрифты для текста';

	font_names = font_names.split(/\s+/);
	let fonts = {}
	let max_height = 0;
	for(let fname of font_names)
	{
		if(!env.resources.fonts[fname])
			throw 'Шрифт "'+fname+'" не найден';
		
		let font = env.resources.fonts[fname];
		fonts[fname] = font;
		if(max_height < font.height)
			max_height = font.height;
	}

	//if width of space sign is not defined - set it to 60% of font height
	if(!opts.space_width)
		opts.space_width = Math.round(max_height*0.6);

	let max_height_bytes = Math.ceil(max_height/8)
	
	//extracting all unique characters from given text string
	let uniq_chars = [...new Set(str.split(''))].filter(v => v!='\n' && v!='\r');
	//cl({uniq_chars})

	//init char images db
	let char_imgs = {}
	//iterate over all chars presented in text
	for(let c of uniq_chars)
	{
		//find first font, that includes char
		for(let i in fonts)
		{
			let glyph = fonts[i].glyphs.find(g => g.auto_symbols.includes(c))
			if(!glyph)
				continue;
			let simg = glyph.image;
			let dimg = [];
			let font_height_bytes = Math.ceil(fonts[i].height/8);
			for(let col=0;col < glyph.width;col++)
			{
				dimg[col] = []
				for(let byte=0;byte < max_height_bytes;byte++)
				{
					let v = font_height_bytes > byte ? simg[font_height_bytes*col+byte] : 0;
					dimg[col].push(...byte2array(v))
				}
				dimg[col] = dimg[col].slice(0,max_height)
			}
			char_imgs[c] = dimg;
			break;
		}
	}

	cl({char_imgs})

	let zero_col = new Array(max_height).fill(0)
	char_imgs[' '] = new Array(opts.space_width).fill([...zero_col])
	char_imgs[''] = new Array(opts.letter_spacing).fill([...zero_col])

	let lines = str.split('\n');

	cl({lines})

	let line_images = []
	let max_width = 0;
	for(let l of lines)
	{
		let lim = renderTextLine(l,char_imgs)
		if(max_width < lim.length)
			max_width = lim.length
		line_images.push(lim)
	}

	let col_height = lines.length*(max_height+opts.line_spacing)-opts.line_spacing;
	let canvas_col = new Array(col_height).fill(0);
	let canvas = (new Array(max_width)).fill([]).map(col => {return [...canvas_col]});

	cl({canvas_col})
	//cl({canvas})

	for(let [i,line_image] of line_images.entries())
	{
		let y = i*(max_height+opts.line_spacing);
		let x = 0;
		switch(opts.align)
		{
			case 'right': x = max_width-line_image.length; break;
			case 'center': x = Math.floor((max_width-line_image.length)/2); break;
		}

		cl({x,y})

		for(let [cnum,col] of line_image.entries())
		{
			canvas[x+cnum].splice(y,max_height,...col);
		}
	}
	
	cl({canvas})
	let g = new Graphic({
		image: canvas,
		isRenderable:false,
		size: [max_width,col_height],
		name: `Text [${str.substr(0,10)}] ($uid)`
	})
	return g;
}

function renderTextLine(str,char_imgs)
{
	let image = []
	let len = str.length
	for(let i=0;i < len; i++)
	{
		let c = str[i]
		if(!char_imgs[c])
		{
			cl('Char img for '+c+' not found')
			continue
		}
		image.push(...char_imgs[c])
		if(i < len-1)
			image.push(...char_imgs[''])
	}
	cl('line image:',image)
	return image;
}