import {cl} from '/lib.mjs';

export default {
	props: ['value','addr'],
	data(){
		return {
			
		}
	},
	created(){
		this.resize()
	},
	watch:{
		
	},
	computed:{
	},
	methods:{
		resize(){
			
		},
		mOver(ev){
			if(this.readonly)
				return;
			cl('over',ev.buttons)
			this.isOver = true;
			if(ev.buttons>0){
				this.$emit('set',{addr:this.addr,value:ev.buttons==1})
			}
		},
		mOut(){
			this.isOver = false
		},
		click(ev){
			if(this.readonly)
				return;
			cl(ev.button)
			this.$emit('set',{addr:this.addr,value:ev.button==0})
			return false;
		}
	},
	template: `
	<div class="pixel nodrag noselect" 
		draggable="false"
		:class="{active:value}" 
		@mousedown="click"
		@mouseenter="mOver" 
		@mouseleave="mOut"
		@dragstart.prevent.stop=""
	></div>`
};