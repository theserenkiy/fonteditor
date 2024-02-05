import env from "./env.mjs";

export function debounce(func, timeout = 300)
{
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => { func.apply(this, args); }, timeout);
	};
}

export const cl = console.log;

export const dbg = (name,obj='') => cl(name,obj ? JSON.stringify(obj) : '')

export const warn = msg => cl('WARN: ',msg);

export function initSettings(s)
{
	s.frame_height_dots = s.frame_height_bytes*8;
	s.frame_width_mm = s.rotator_radius_mm*2*Math.PI;
	s.frame_width_dots = Math.floor(s.frame_width_mm/s.led_distance_mm);
	s.led_spacing_mm = s.led_distance_mm-s.led_diameter_mm;
	s.frame_dim = [s.frame_width_dots,s.frame_height_dots];
	s.frame_size_bytes = s.frame_height_bytes * s.frame_width_dots;
	s.pzu_capacity_bytes = s.pzu_capacity_kb*1024;
	s.hw_frame_size_bytes = s.hw_frame_width_dots*s.frame_height_bytes;
	s.total_frames = Math.floor(s.pzu_capacity_bytes/s.hw_frame_size_bytes);
	s.total_time_sec = s.total_frames/s.rotator_rps;
	s.clk_freq_hz = s.frame_size_bytes*s.rotator_rps;
	s.editor_pixel_scale = s.editor_pixel_size/s.led_diameter_mm;
	s.editor_pixel_padding = Math.round((s.led_spacing_mm/2)*s.editor_pixel_scale);
	s.editor_pixel_fullsize = s.editor_pixel_size+(s.editor_pixel_padding*2);
}


export async function apiCall(cmd,params)
{
	try{
		let res = await fetch('/api/'+cmd,{
			method:'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		});
		let d = await res.json();
		if(d.error)
			throw d.error;
		return d;

	}catch(e){
		alert('ОШИБКА во время обработки запроса: '+e+'\n\nПопробуйте перезапустить сервер');
		throw e
	}
}

export async function p_alert(msg)
{
	return alert(msg);
}

export async function p_prompt(title,value='')
{
	return prompt(title,value)
}

export async function p_confirm(title)
{
	return confirm(title)
}