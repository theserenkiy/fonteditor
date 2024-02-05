import env from "./env.mjs";
import {cl,debounce,p_confirm} from './lib.mjs';
import Drawarea from './drawarea.mjs';

export default {
    components:{
        Drawarea
    },
	props: ['gl','height'],
	data(){return{
        env,
        save: ()=>{}
	}},
    created(){
        this.save = debounce(()=>{
			cl('SAVE',{gl:this.gl})
            this.$emit('save')
        })
    },
	computed:{
		
	},
    watch:{
        "gl.name"(){
			let parts = this.gl.name.split(/\s+/);
			this.gl.symbols = parts.filter(v => v.length==1);
            this.save();
        }
    },
    methods:{
        changeWidth(val)
		{
			if((val < 0 && this.gl.width <= 1) || (val > 0 && this.gl.width >=32))
				return;
			this.gl.width += val;
            this.save()
		},

		remove()
		{
			if(!p_confirm("Точно удалить этот символ?"))
				return;
			this.$emit('delete',this.gl.id);
		},

		duplicate()
		{
			cl('emit duplicate')
			this.$emit('duplicate',this.gl.image);
		},

		setName(e)
		{
			cl('setname',e.target.value)
			this.gl.name = e.target.value;
			this.save();
		},

		saveImage(img)
		{
			this.save()
		}
    },
	template: `
	<div class="glyph">
		<div class="main">
			<div class="draw">
				<Drawarea :width="gl.width" :height="height" :image="gl.image" @change="saveImage" />
			</div>
			<div class="rpanel">
				<button class="icon-trash-empty" @click="remove" title="Удалить"></button>
				<button class="icon-docs" @click="duplicate" title="Дублировать"></button>
				<button class="icon-left-dir" @click="changeWidth(-1)" title="Уменьшить ширину"></button>
				<button class="icon-right-dir" @click="changeWidth(1)" title="Увеличить ширину"></button>
			</div>
		</div>
		<div class=controls>
			<input type="text" placeholder="Имя символа" :value="gl.name" @change="setName" />
			
		</div>
	</div>`
}