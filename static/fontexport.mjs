const cl = console.log
export default {
    components:{
        
    },
	props: ['opened','font','name'],
	data(){return{
		visible: 1,
		off: 0,
		descr: [{num: 0},{num: 1},{num: 2},{num: 3},{num: 4},{num: 5},{num:6},{num:7}]
	}},
	created()
	{

	},
	watch:{
		opened(v){
			cl('opened')
			if(!v)this.close();
			else this.open();
		}
	},
	computed:{
		rows(){
			return this.descr[this.font.export.order];
		}
	},
	methods:{
		close(){
			this.visible = 0;
			setTimeout(()=>this.off=1,300);
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
		}
	},
    template: `<div class="fontexport" :class="{visible:visible, off:off}" @click="$emit('close')">
		<div class=modal @click.stop>
			<h3>Export font</h3>
			<div class=main>
				<div class="controls">
					<label>Word size: 
						<select :value="font.export.word_size" @change="updParam('word_size',$event)">
							<option>8</option>
							<option>16</option>
							<option>32</option>
							<option>64</option>
						</select>
					</label>
					<label>Word order: 
						<select :value="font.export.order" @change="updParam('order',$event)">
							<option>rows</option>
							<option>cols</option>
						</select>
					</label>
					<label>Word scan: 
						<select :value="font.export.scan" @change="updParam('scan',$event)">
							<option>rows_cols</option>
							<option>cols_rows</option>
						</select>
					</label>
					<label>Bit order: 
						<select :value="font.export.direction" @change="updParam('direction',$event)">
							<option value="msb_lsb">MSB to LSB</option>
							<option value="lsb_msb">LSB to MSB</option>
						</select>
					</label>
					
				</div>
				<div class=descr>
					<div class=win :class="'scan_'+font.export.scan+' order_'+font.export.order">
						<div v-for="word in descr" :class="font.export.direction">
							<span>0</span>
							<span v-html="word.num"></span>
							<span v-html="font.export ? font.export.word_size : 'q'"></span>
						</div>
					</div>
				</div>
			</div>
		</div>
    </div>`
}