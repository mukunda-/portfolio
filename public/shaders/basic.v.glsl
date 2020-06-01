// just your basic ass shader

attribute vec3 a_position;
attribute vec2 a_uv;
attribute vec4 a_color;
uniform mat4 u_camera;

varying lowp vec2 f_uv;
varying lowp vec4 f_color;

void main() {
   f_uv        = a_uv;
   f_color     = a_color;
   gl_Position = vec4( u_camera * vec4( a_position, 1.0) );
}