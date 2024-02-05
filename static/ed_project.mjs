

export default {
    props: [],
    data(){return{
        q:0
    }},
    created(){
        this.q = Date.now();
    },
    template: `<div class=project_list>
		<ul>
			<li>Dummy project 1</li>
			<li>Project 2</li>
		</ul>
		<a class=add>Добавить проект</a>
	</div>`
}