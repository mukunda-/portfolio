// The cubemap background.
// (C) 2020 Mukunda Johnson
import hc from "./hc/hc.js";
import Camera from "./camera.js";
///////////////////////////////////////////////////////////////////////////////
// The cubemap texture (hc.Texture).
let m_texture;
// Cubemap shader (hc.Shader). (But it's just a generic shader.)
let m_shader;
// Cube vertex buffer (hc.Buffer).
let m_buffer;

//-----------------------------------------------------------------------------
async function Setup() {
   // This is actually my first promise, I think. Yay.
   let myFirstPromise = new Promise( (resolve, reject) => {
      m_texture = new hc.Texture( "res/cubemap.jpg", hc.RGB, () => {
         resolve();
      });
      
   });

   m_shader = new hc.Shader();
   await Promise.all([
      myFirstPromise,
      m_shader.AttachFromURL( "shaders/basic.v.glsl", "vertex" ),
      m_shader.AttachFromURL( "shaders/basic.f.glsl", "fragment" )
   ]);

   m_shader.Link();
   m_buffer = new hc.Buffer();
}

//-----------------------------------------------------------------------------
// Render the background.
//
// Really should move projview to a shared state and not pass it around
// like this.
function Render( projview ) {
   m_shader.Use();
   hc.gl.blendFunc( hc.gl.ONE, hc.gl.ZERO );
    
   { // Set camera parameters.
      const u_camera = m_shader.GetUniform( "u_camera" );
      hc.gl.uniformMatrix4fv( u_camera, false, projview );
   }

   const a_position = m_shader.GetAttribute( "a_position" );
   const a_uv = m_shader.GetAttribute( "a_uv" );
   // Color is not implemented yet on the shader side.
   //const a_color = m_shader.GetAttribute( "a_color" );
   hc.Context.EnableVertexAttribArrays( [a_position, a_uv] );
   {
      const packer = new hc.Packer( "fff ff" );// ff bbbb" );

      // Generating cube geometry.
      const corners = [
         [-1,  1, -1],
         [-1, -1, -1],
         [ 1, -1, -1],
         [ 1,  1, -1],

         [-1,  1, 1],
         [-1, -1, 1],
         [ 1, -1, 1],
         [ 1,  1, 1],
      ];
      
      // Helps if you look at a picture of a cube with
      // numbered vertexes while writing this.
      const faces = [
         [0, 1, 5, 4,  0, 1], // Left.
         [4, 5, 6, 7,  1, 1], // Forward.
         [7, 6, 2, 3,  2, 1], // Right.
         [3, 2, 1, 0,  3, 1], // Back.
         [0, 4, 7, 3,  1, 0], // Up.
         [5, 1, 2, 6,  1, 2]  // Down.
      ];

      // The camera will always sit in the very center of the cube.
      const [cameraEye] = Camera.Get();

      for( const f of faces ) {
         // Pack to temporary "quad" buffer first, and then expand them into
         // two triangles below for the packer.
         let output = [];
         for( let i = 0; i < 4; i++ ) {
            let [x,y,z] = corners[f[i]];
          
            x += cameraEye[0];
            y += cameraEye[1];
            z += cameraEye[2];
            
            // uv coordinates. Each of the faces is always oriented in the
            // order of top-left, bottom-left, bottom-right, top-right.
            let u = f[4] * 0.25 + Math.floor(i/2) * 0.25;
            let v = f[5] * 0.25;
            if( i == 1 || i == 2 ) v += 0.25;
            output.push( [x, y, z, u, v] );
         }

         // Expand quad to triangle.
         packer.Push( output[0] );
         packer.Push( output[1] );
         packer.Push( output[2] );

         packer.Push( output[2] );
         packer.Push( output[3] );
         packer.Push( output[0] );
      }
      
      // Load the buffer. STREAM_DRAW is the buffering hint for one-way
      // data that will only be rendered once.
      m_buffer.Load( packer.Buffer(), hc.gl.STREAM_DRAW );
      hc.gl.vertexAttribPointer( a_position, 3, hc.gl.FLOAT, false, 20, 0 );
      hc.gl.vertexAttribPointer( a_uv, 2, hc.gl.FLOAT, false, 20, 12 );
   }

   // Bind the cubemap texture to the default sampler (0).
   const u_sampler = m_shader.GetUniform( "u_sampler" );
   m_texture.Bind();
   hc.gl.uniform1i( u_sampler, 0 );

   // Six vertexes times six faces.
   hc.gl.drawArrays( hc.gl.TRIANGLES, 0, 6*6 );

   // Cleanup.
   hc.Context.DisableVertexAttribArrays( [a_position, a_uv] );
}

///////////////////////////////////////////////////////////////////////////////
export default {
    Setup, Render
};
