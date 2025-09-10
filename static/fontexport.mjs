import exportFont from './fontexport_lib.mjs';

const cl = console.log


export default {
    components:{
        
    },
	props: ['opened','font','name'],
	data(){return{
		visible: 0,
		off: 1,
		descr: [{num: 0},{num: 1},{num: 2},{num: 3},{num: 4},{num: 5},{num:6},{num:7}],
		export_code: ''
	}},
	created()
	{
		if(this.opened)this.open();
	},
	watch:{
		font(v){
			if(!this.font.export)return;
			if(!this.font.export.name)
				this.font.export.name = this.name;
		},
		opened(v){
			cl('opened')
			if(!v)this.close();
			else this.open();
		}
	},
	computed:{
		rows(){
			return this.descr[this.font.export.order];
		},
		fontdata()
		{
			return (this.font && this.font.export) ? this.font.export : {};
		}
	},
	methods:{
		close(){
			this.visible = 0;
			setTimeout(()=>{
				this.off=1;
				this.export_code = ''
			},300);
		},

		open(){
			this.off=0;
			setTimeout(()=>this.visible=1,10);
		},

		updParam(name,ev)
		{
			let v = ev.target.value;
			if(name=='word_size')v = +v;
			this.font.export[name] = v;
			this.$emit('change');

			this.doExport()
		},

		doExport()
		{
			this.export_code = exportFont(this.font,this.font.export)
		}
	},
    template: `<div class="fontexport" :class="{visible:visible, off:off}" @click="$emit('close')">
		<div class=modal @click.stop>
			<h3>Export font</h3>
			<div class=main>
				<div class="controls">
					<label>Word size: 
						<select :value="fontdata.word_size" @change="updParam('word_size',$event)">
							<option>1</option>
							<option>8</option>
							<option>16</option>
							<option>32</option>
						</select>
					</label>
					<label>Word orientation: 
						<select :value="fontdata.word_orient" @change="updParam('word_orient',$event)">
							<option>rows</option>
							<option>cols</option>
						</select>
					</label>
					<label>Word scan: 
						<select :value="fontdata.scan" @change="updParam('scan',$event)">
							<option>rows_cols</option>
							<option>cols_rows</option>
						</select>
					</label>
					<label>Bit order: 
						<select :value="fontdata.bit_direction" @change="updParam('bit_direction',$event)">
							<option value="msb_lsb">MSB to LSB</option>
							<option value="lsb_msb">LSB to MSB</option>
						</select>
					</label>

					<label>Language: 
						<select :value="fontdata.lang" @change="updParam('lang',$event)">
							<option>C</option>
							<option>PYTHON</option>
						</select>
					</label>

					<label>Numerical format: 
						<select :value="fontdata.format" @change="updParam('format',$event)">
							<option>DEC</option>
							<option>HEX</option>
							<option>BIN</option>
						</select>
					</label>
					
				</div>
				<div class=descr>
					<h4>Glyph export model:</h4>
					<div class=model_area>
						<div class=model :class="'scan_'+fontdata.scan+' orient_'+fontdata.word_orient">
							<div v-for="word in descr" :class="fontdata.bit_direction">
								<span>0</span>
								<span v-html="word.num"></span>
								<span v-html="fontdata.word_size-1"></span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<button @click="doExport">Export!</button>
			<div class=export>
				<textarea :value=export_code></textarea>
			</div>
		</div>
    </div>`
}