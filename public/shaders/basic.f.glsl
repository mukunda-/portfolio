// A basic fragment shader. Copies from a texture to the output.
// (C) 2020 Mukunda Johnson
///////////////////////////////////////////////////////////////////////////////
precision mediump float;

// Texture to sample from.
uniform sampler2D u_sampler;

// Texture coordinates.
varying lowp vec2 f_uv;

// Color is not yet implemented.
varying lowp vec4 f_color;

//-----------------------------------------------------------------------------
void main() {
    vec4 col = texture2D( u_sampler, f_uv );
    gl_FragColor = vec4(col.rgb, 1.0);
}

///////////////////////////////////////////////////////////////////////////////