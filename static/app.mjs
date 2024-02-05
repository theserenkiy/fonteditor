import env from '/env.mjs'
import {cl,debounce,initSettings,apiCall,p_confirm,p_prompt} from '/lib.mjs'

import ed_project from '/ed_project.mjs';
// import ed_frames from '/ed_frames.mjs';
import ed_fonts from '/ed_fonts.mjs';
// import ed_objects from '/ed_objects.mjs';
//import ed_clips from '/ed_clips.mjs';
//import ed_settings from '/ed_settings.mjs';

const workspace_keys = ['cur_project','cur_tab','tabs'];

export default {
	components: {
		ed_project,
		//ed_frames,
		ed_fonts,
		//ed_objects,
		//ed_clips,
		//ed_settings
	},
	data(){
		return {
			env,
			editors: [
				{name: 'ed_project', title: 'Проект'},
				//{name: 'ed_frames', title: 'Кадры'},
				{name: 'ed_fonts', title: 'Шрифт'},
				// {name: 'ed_objects', title: 'Символы'},
				// {name: 'ed_clips', title: 'Клипы'},
				// {name: 'ed_settings', title: 'Настройки'}
			],
			tabs: [],
			cur_tab: '',
			lpanel: {
				projects: {title:'Проект',list:[]},
				fonts: {title:'Шрифты',list:[]},
				// objects: {title:'Объекты',list:[]},
				// clips: {title:'Клипы',list:[]},
				// settings: {title:'Настройки'},
				// export: {title:'Экспорт'},
			},
			cur_project: '',
			workspace: {}
		}
	},
	mounted(){
		//this.calcSettings()
	},
	async created(){
		this.debouncedSaveWS = debounce(() => {
			let ws = {}
			for(let k of workspace_keys)
				ws[k] = this[k];
			localStorage.workspace = JSON.stringify(ws);
		});

		await this.initProjectList()
		
		this.workspace = JSON.parse(localStorage.workspace || '{}');
		if(this.workspace.cur_project)
		{
			this.cur_project = this.workspace.cur_project;
		}
		// for(let k of workspace_keys)
		// {
		// 	if(ws[k])
		// 		this[k] = ws[k];
		// }
		
	},
	watch:{
		async cur_project(name,prev)
		{
			if(!name)return;

			if(prev)
			{
				this.tabs = [];
				this.cur_tab = '';
			}
			let d = await apiCall('loadProject',{name});

			this.lpanel.fonts.list = d.fonts;
			//this.lpanel.objects.list = d.objects;
			//this.lpanel.clips.list = d.clips;

			//TODO tabs set for each project
			if(this.workspace.cur_project == name)
			{
				this.tabs = this.workspace.tabs.filter(tab => d[tab.type].includes(tab.name));

				if(this.workspace.cur_tab && this.tabs.find(t => t.tabid==this.workspace.cur_tab))
					this.cur_tab = this.workspace.cur_tab;
				else if(this.tabs.length)
					this.cur_tab = this.tabs[0].tabid;

				this.updSettings(d.settings);
				this.env.cur_project = name;
			}
			


			this.debouncedSaveWS();
		},
		
		tabs:{
			handler(){
				this.debouncedSaveWS()
			},
			deep: true
		},
		cur_tab(){
			this.debouncedSaveWS()
		}
	},
	computed: {
		c_tabs(){
			if(0 && !this.prj.name)
				return this.tabs.filter(t => t.name=='ed_project');
			else return this.tabs;
		},
		c_cur_tab(){
			return 0 && !this.prj.name ? 'ed_project' : this.cur_tab;
		},
		c_lpanel(){
			return this.cur_project 
				? this.lpanel
				: {projects: this.lpanel.projects}
		}
	},
	methods:{
		async initProjectList()
		{
			let d = await apiCall('getProjectList');
			this.lpanel.projects.list = d.projects;

		},
		
		setTab(name){
			this.cur_tab = name;
		},

		closeTab(tabid){
			let ind = this.tabs.findIndex(t => t.tabid==tabid);
			if(ind < 0)return;
			if(this.tabs.length > 1)
				this.cur_tab = (ind > 0 ? this.tabs[ind-1] : this.tabs[1]).tabid;
			else this.cur_tab = null;
			this.tabs = this.tabs.filter(t => t.tabid != tabid);
		},

		setProject(name){
			this.cur_project = name;
		},
		updSettings(sett){
			
			initSettings(sett)
			//Object.assign(this.sett,sett);
			this.env.settings = sett;
		},
		
		async lpanel_click(what,name)
		{
			if(what=='projects')
				this.setProject(name);
			else{
				this.openTab(what,name);
			}
		},

		openTab(what,name){
			let tabid = this.cur_project+'/'+what+'/'+name;

			if(!this.tabs.find(t => t.tabid==tabid))
			{
				this.tabs.push({
					tabid,
					name,
					type: what,
					editor: 'ed_'+what
				})
			}
			
			this.cur_tab = tabid;
		},

		async lpanel_create(what,name=""){
			let title = {projects:'проекта',objects:'объекта',fonts:'шрифта'}[what];
			name = await p_prompt('Введите имя '+title,name);
			if(!name || !name.trim())return;
			let lcname = name.toLowerCase();
			if(this.lpanel[what].list.find(v => v.toLowerCase()==lcname))
			{
				if(!await p_confirm('Такое имя уже занято. Придумаем другое?'))
					return;
				this.lpanel_create(what,name);
			}

			if(what=='projects')
			{
				let d = await apiCall('createProject',{name});
				this.lpanel.projects.list = d.projects;
				this.setProject(name)
			}
			else{
				let d = await apiCall('create',{type:what,project:this.cur_project,name});
				this.lpanel[what].list = d.list;
				this.openTab(what,name);
			}
			
		}
	},
	// :class="{'icon-angle-right':bl.closed,'icon-angle-down':!bl.closed}"
	template: `
	<div>
		<div class=lpanel>
			<div class=block v-for="(bl,ind) in c_lpanel">
				<h3 v-if="bl.list" class="foldable" :class="{closed:bl.closed}" @click="bl.closed=!bl.closed">
					<span 
						class="icon-angle-down"
					></span>{{bl.title}}
				</h3>
				<h3 v-else @click="lpanel_click(ind,name)">
					{{bl.title}}
				</h3>
				<ul v-if="bl.list && !bl.closed">
					<li v-for="name in bl.list" v-html="name" @click="lpanel_click(ind,name)" />
					<li @click="lpanel_create(ind)">+ создать</li>
				</ul>
			</div>
		</div>
		<div class=editor>
			<div class=tabs>
				<div class=tab v-for="tab in tabs" :key="tab.tabid">
					<div class=title :class="{active:tab.tabid==cur_tab}" @click=setTab(tab.tabid)><b v-html="tab.name"></b><i class="icon-cancel" style="cursor:pointer" @click.stop="closeTab(tab.tabid)"></i></div>
				</div>
			</div>
			<div class=editor_window>
				
					<component 
						v-for="tab in tabs"
						:style="{display: tab && (tab.tabid==cur_tab) ? 'flex' : 'none'}"
						v-bind:is="tab.editor" 
						
						:name="tab.name"
						:project="cur_project"
					/>
				
			</div>
		</div>
	</div>
	`
	
}