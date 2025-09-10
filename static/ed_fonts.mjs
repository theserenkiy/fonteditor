import Glyph from './glyph.mjs';

import { apiCall,cl, debounce, p_alert} from './lib.mjs';
import env from './env.mjs';


import FontExport from './fontexport.mjs';

const similars = {
	en: 'AaBCcEeHKMOoPpTXx'.split(''),
	ru: 'АаВСсЕеНКМОоРрТХх'.split('')
}

const letters = {
	ru: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
	en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	digits: '0123456789',
	symbols: '.,-;:!?\'"()<>+/*%^_@#$&'
}

//calculate letter weights
const weights = [];
for(let c of letters.ru)
{
	weights.push(c)
	weights.push(c.toLocaleLowerCase())
}
for(let c of letters.en)
{
	weights.push(c)
	weights.push(c.toLocaleLowerCase())
}
weights.push(...letters.digits.split(''))
weights.push(...letters.symbols.split(''))

const weights_hash = {}
for(let [i,c] of weights.entries())
	weights_hash[c] = i;

//cl({weights_hash})

export default {
	components: {
		Glyph,
		FontExport
	},
	props: ['project','name'],
	data(){return{
		env,
		font: {},
		saveDebounced: ()=>{},
		symlist: {
			cyr: {title: "Русские",list: (letters.ru + letters.ru.toLocaleLowerCase()).split('')},
			lat: {title: "Английские",list: (letters.en + letters.en.toLocaleLowerCase()).split('')},
			sym: {title: "Символы",list: (letters.digits + letters.symbols).split('')}
		},
		pixel_size: 12,
		on_color: '#ff3300',
		off_color: '#333333',
		font_export_opened: 1
	}},
	async created(){ 
		//cl(JSON.stringify(env))
		let d;
		try{
			d = await apiCall('readJSON',{path:`/${this.project}/fonts/${this.name}.json`});
		}catch(e)
		{
			cl(e,e[0])
			if(e[0]=='api_err')
			{
				alert("API error: "+e[1])
			}
			return;
		}
		if(!d.glyphs)d.glyphs = [];
		this.font = {
			height: 8,
			pixel_size: 12,
			on_color: '#ff3300',
			off_color: '#333333',
			...d
		};

		if(!this.font.default_width)
			this.font.default_width = Math.round(this.font.height*0.75)

		if(!this.font.export)
		{
			this.font.export = {
				word_size: 8,
				word_orient: 'cols',
				bit_direction: 'lsb_msb',
				scan: 'rows_cols',
				lang: 'C',
				format: 'DEC',
				name: this.name
			}
		}
			

		for(let i of ['pixel_size','on_color','off_color'])
			this[i] = this.font[i];

		this.saveDebounced = debounce(async () => {
			//cl('save glyph');

			this.recalcAutoSyms()
			this.makePresentedSymbols()
			
			await apiCall('writeFile',{
				path:`/${this.project}/fonts/${this.name}.json`,
				data: JSON.stringify(this.font,null,'	')
			})

			//cl(fontExportLib(this.font,this.name))
			
		},100)
	},
	watch:{
		'env.settings':{
			handler(){
				//Math.round(height_dots*0.75);
			},
			deep:true
		},

		pixel_size(v){
			this.font.pixel_size = +v;
			this.save();
		},

		on_color(v){
			this.font.on_color = v;
			this.save();
		},

		off_color(v){
			this.font.off_color = v;
			this.save();
		}
	},
	computed:{
		
		c_default_width(){
			
		},

		c_glyphStyle(){
			let s = env.settings;
			return {
				height: (s.editor_pixel_fullsize*this.font.height+40)+'px'
			}
		},

		c_glyphs(){
			if(!this.font.glyphs)
				return;
			
			let list = [...this.font.glyphs];

			//prepare sorting weights to follow order: 
			//1. Russian letters АаБбВв...
			//2. English letters AaBbCc...
			//3. Digits and other signs
			for(let gl of list)
			{
				let syms = [...(gl.symbols || []),...(gl.auto_symbols || [])];
				let wts = [...new Set(syms.map(v => undefined!==weights_hash[v] ? weights_hash[v] : 100000))]	
				gl.sort_weight = wts.length 
					? Math.min(...wts)
					: Date.now()
				//cl(gl.name,gl.sort_weight)
			}
			
			if(this.font.is_sorted)
				list.sort((a,b) => (a.sort_weight > b.sort_weight) ? 1 : -1)
			return list;
		}
	},
	methods:{
		async save()
		{
			this.saveDebounced();
		},

		addnew(image=[]){
			//cl('addnew',{image})//,image)
			
			this.font.glyphs.push({
				id: Date.now(),
				image: [...image],
				name: '',
				symbols: [],
				sort_weight: Date.now(),
				width: +this.font.default_width,
			});
			this.save();
		},

		setDfltWidth(ev)
		{
			let w = +ev.target.value;
			if(w > 32)
			{
				alert("Maximum font width is 32");
				w = 32;
			}
			this.font.default_width = w;
			this.save();
		},

		setHeight(ev)
		{
			let h = +ev.target.value;
			if(h > 32)
			{
				alert("Maximum font height is 32");
				h = 32;
			}
			this.font.height = h;
			this.save();
		},

		delGlyph(id)
		{
			//cl('deleting '+id);
			this.font.glyphs = this.font.glyphs.filter(v => v.id!=id);
			this.save();
		},

		dupGlyph(img)
		{
			//cl('dup')
			this.addnew(img)
		},

		toggleSort()
		{
			this.font.is_sorted = !this.font.is_sorted; 
			this.save()
		},

		toggleOnlyUpper()
		{
			this.font.is_only_upper = !this.font.is_only_upper;
			this.save()
		},

		toggleAutoSimilars()
		{
			this.font.is_auto_similars = !this.font.is_auto_similars;
			this.save()
		},
		getSimilarChar(lan,char)
		{
			let ind = similars[lan].indexOf(char);
			if(ind < 0)return '';
			return similars[lan=='en' ? 'ru' : 'en'][ind];
		},
		recalcAutoSyms()
		{
			for(let g of this.font.glyphs)
			{
				let autos = [...g.symbols];
				if(this.font.is_auto_similars)
				{
					for(let s of [...autos])
					{
						let sim = this.getSimilarChar('en',s) || this.getSimilarChar('ru',s);
						if(sim)
							autos.push(sim)
					}
				}
				if(this.font.is_only_upper)
				{
					autos.push(...[...autos].map(s => s.toLowerCase()));
				}
				
				g.auto_symbols = autos;
			}
		},
		makePresentedSymbols()
		{
			if(!this.font.glyphs)
				return [];
			let list = [...this.font.glyphs.map(g => [...new Set([...(g.symbols || []),...(g.auto_symbols || [])])])].flat();
			//cl({list})
			let dups = [...new Set(list.filter((v,i) => {let ind = list.indexOf(v);return ind >= 0 && ind != i}))];
			if(dups.length)
				p_alert('Найдены повторяющиеся символы: '+dups.join(', '))
			
			this.font.presented_symbols = list;
		},

		closeFontExport()
		{
			cl('CLOSE FE')
			this.font_export_opened = 0;
		}
	},
	template: `
	<div class="ed_fonts" :class="name">
		<component is="style">
			.ed_fonts.{{name}} .drawarea .row .pixel{
				width: {{pixel_size}}px;
				height: {{pixel_size}}px;
			}
			.ed_fonts.{{name}} .drawarea .row .pixel::after{
				background-color: {{off_color}}
			}
			.ed_fonts.{{name}} .drawarea .row .pixel.active::after{
				background-color: {{on_color}};
				box-shadow: 0 0 10px {{on_color}};
			}
		</component>
		<div class=controls>
			<h2>Шрифт "{{name}}"</h2>
			<div>
				Высота:&nbsp;<input type="number" min="1" max="32" :value="font.height" @change="setHeight">
			</div>
			<div>
				Ширина по умолч.:&nbsp;<input type="number" min="1" max="32" :value="font.default_width" @change="setDfltWidth">
			</div>
			<div>
				Zoom: <input type="range" min=8 max=60 v-model="pixel_size">
			</div>
			<div>
				ON color: <input type="color" v-model="on_color">
			</div>
			<div>
				OFF color: <input type="color" v-model="off_color">
			</div>
			<button 
				title="Сортировать по алфавиту"
				:class="{active:font.is_sorted}" 
				class="icon-sort-name-up small"
				@click="toggleSort"
			>
			</button>
			<button 
				title="Использовать заглавные как строчные"
				:class="{active:font.is_only_upper}" 
				class="icon-fontsize"
				@click="toggleOnlyUpper"
			>
			</button>
			<button 
				title="Использовать похожие символы из другого алфавита"
				:class="{active:font.is_auto_similars}" 
				class="icon-language"
				@click="toggleAutoSimilars"
			>
			</button>
			<button class=auto @click="font_export_opened=1">Export</button>
		</div>
	
		<div class="symlist">
			<div class="symclass" v-for="cl in symlist">
				<div class="caption" v-html="cl.title+':'"></div>
				<div class="list">
					<span v-for="sym of cl.list" :class="{active: (font.presented_symbols || []).includes(sym)}" v-html="sym"></span>
				</div>
			</div>
		</div>
	
		<div class="glyphs_wrap">
			<div class="glyphs">
				<Glyph v-for="gl in c_glyphs" 
					:gl="gl" 
					:height="font.height"
					:key="gl.id"
					@save="save" 
					@delete="delGlyph"
					@duplicate="dupGlyph"
				/>
				<div class="glyph addnew" @click="addnew([])"></div>
			</div>
		</div>
		<FontExport 
			:font="font" 
			:name="name" 
			:opened="font_export_opened" 
			@close="closeFontExport" 
			@change="save"
		/>
	</div>`
}