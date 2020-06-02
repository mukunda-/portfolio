// (C) 2020 Mukunda Johnson
// Cube/colors shader.
///////////////////////////////////////////////////////////////////////////////
// This is a fullscreen shader, so the only input here is four coordinates
// that are the four screen corners. `angles` contains vectors that point to
// those corners from the camera's eye.
attribute vec2 a_position;
attribute vec3 a_angles;

// fragmentPoint is the screen space. (do we need this?)
varying lowp vec2 fragmentPoint;

// fragmentAngle will interpolate an angle that points towards the fragment.
varying lowp vec3 fragmentAngle;

//-----------------------------------------------------------------------------
void main() {
   fragmentPoint = a_position;
   fragmentAngle = a_angles;
   gl_Position = vec4( a_position, 0.0, 1.0 );
}

///////////////////////////////////////////////////////////////////////////////