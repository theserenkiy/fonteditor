import Pixel from '/pixel.mjs'
import env from './env.mjs'
import { cl, debounce } from './lib.mjs'

const drawareas_registry = {};
const cur_drawarea_regid=0;


export default {
    components: {
        Pixel
    },
    props: ['width','height','image','readonly'],
    data(){
        return {
            pixels: [],
            env,
            regid:0,
            height_bytes: 0,

            pixel_size: 15,
            pixel_padding: 1
        }
    },
    created(){
        this.debouncedSave = debounce(()=>{
           
            this.$emit('change');

            //this.saved = this.pixels.filter(v => v.value).map(v => v.addr)
        },100)
        //this.init();
    },
    watch:{
        
    },
    computed:{
        image_view(){
            let out = [];
            for(let y=0;y < this.height; y++)
            {
                out[y] = [];
                if(!this.image[y])
                    this.image[y] = [];
                for(let x=0; x < this.width; x++)
                {
                    if(!this.image[y][x])
                        this.image[y][x] = 0;
                    out[y][x] = this.image[y][x] ? 1 : 0;
                }
            }
            return out;
        }
    },
    methods:{
        focus(){
            cur_drawarea_regid = this.regid;
        },
        onPixel(ev){
            this.focus = true;
            this.image[ev.addr[1]][ev.addr[0]] = ev.value ? 1 : 0;
            this.debouncedSave()
        }
    },
    template: `<div class=drawarea>
        <div class=row v-for="(row,y) in image_view">
            <Pixel v-for="(pixel,x) in row" 
                :addr="[x,y]" 
                :value="pixel" 
                :key="x+'_'+y"
                @set="onPixel">
            </Pixel>
        </div>
        
    </div>`
}