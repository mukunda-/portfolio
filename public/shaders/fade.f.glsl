// (C) 2020 Mukunda Johnson
// Simple shader that multiplies a surface by the given factor.
// (Assuming [DST_COLOR, ZERO] blending mode)
// Or more generically - outputs a solid grayscale shade.
///////////////////////////////////////////////////////////////////////////////
uniform highp float u_factor;

//-----------------------------------------------------------------------------
void main() {
   gl_FragColor = vec4( u_factor, u_factor, u_factor, 1.0 );
}

///////////////////////////////////////////////////////////////////////////////