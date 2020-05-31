attribute vec2 a_position;
attribute vec3 a_angles;

varying lowp vec2 fragmentPoint;
varying lowp vec3 fragmentAngle;

void main(void) {
   fragmentPoint = a_position;
   fragmentAngle = a_angles;
   gl_Position = vec4( a_position, 0.0, 1.0 );
}

