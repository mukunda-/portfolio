attribute vec2 a_position;
attribute vec4 a_color;
 
varying vec4 f_color;

void main(void) {
	gl_Position = vec4( a_position, 0.0, 1.0 );
	f_color = a_color;
}

