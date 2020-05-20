//uniform sampler2D u_sampler;

varying lowp vec4 f_color;

void main(void) {
	//lowp vec4 texel = texture2D( u_sampler, f_uv );
	//if( texel.a == 0.0 ) discard;
	//texel *= f_color;
	
	gl_FragColor = f_color;
}
