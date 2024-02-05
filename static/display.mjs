
import env from './env.mjs'
import { cl, debounce } from './lib.mjs'

export default {
	props: ['width','height','image'],
	created(){
		cl({
			width: this.width
		})
	},
	computed: {
		cols(){return [...new Array(+this.width).keys()]},
		rows(){return [...new Array(+this.height).keys()]},
	},
	template: `<div class=display>
		<div class=col v-for="col in cols">
			<div class="pixel" 
				v-for="row in rows" 
				:key="col+'.'+row" 
				:class="{active:image[col] && image[col][row]}">
			</div>
		</div>
	</div>`
}