// (C) 2020 Mukunda Johnson
// Generic shader that just outputs the vertex position directly.
///////////////////////////////////////////////////////////////////////////////
attribute vec2 a_position;
varying lowp vec2 fragmentPoint;

void main() {
    fragmentPoint = a_position;
    gl_Position   = vec4( a_position, 0.0, 1.0 );
}

///////////////////////////////////////////////////////////////////////////////