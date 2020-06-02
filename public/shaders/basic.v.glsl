// just your basic ass shader
// (C) 2020 Mukunda Johnson
///////////////////////////////////////////////////////////////////////////////
// The 3D position of the vertex.
attribute vec3 a_position;

// The texture coordinate the vertex uses.
attribute vec2 a_uv;

// The color multiplier - not implemented yet.
attribute vec4 a_color;

// The modelViewProjection matrix for transforming the vertex coordinates to
// screen space.
uniform mat4 u_camera;

// Outputs to the fragment shader:
varying lowp vec2 f_uv;     // Texcoord.
varying lowp vec4 f_color;  // Color.

//-----------------------------------------------------------------------------
void main() {
   f_uv        = a_uv;
   f_color     = a_color;
   gl_Position = vec4( u_camera * vec4( a_position, 1.0) );
}

///////////////////////////////////////////////////////////////////////////////