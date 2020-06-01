import hc from "./hc/hc.js";
import Camera from "./camera.js";
///////////////////////////////////////////////////////////////////////////////
let m_texture, m_shader, m_buffer;

async function Setup() {
   m_texture = new hc.Texture( "res/cubemap.jpg", hc.RGB, () => {

   });

   m_shader = new hc.Shader();
   await Promise.all( [
      m_shader.AttachFromURL( "shaders/basic.v.glsl", "vertex" ),
      m_shader.AttachFromURL( "shaders/basic.f.glsl", "fragment" )
   ]);

   m_shader.Link();

   m_buffer = new hc.Buffer();
}

function Render( projview ) {
   m_shader.Use();
   hc.gl.blendFunc( hc.gl.ONE, hc.gl.ZERO );
    
   { // Set camera parameters.
      const u_camera = m_shader.GetUniform( "u_camera" );
      hc.gl.uniformMatrix4fv( u_camera, false, projview );
   }

   const a_position = m_shader.GetAttribute( "a_position" );
   const a_uv = m_shader.GetAttribute( "a_uv" );
   //const a_color = m_shader.GetAttribute( "a_color" );
   hc.Context.EnableVertexAttribArrays( [a_position, a_uv] );//, a_uv, a_color] );
   {
      const packer = new hc.Packer( "fff ff" );// ff bbbb" );

      const corners = [
         [-1, 1, -1],
         [-1, -1, -1],
         [1, -1, -1],
         [1, 1, -1],

         [-1, 1, 1],
         [-1, -1, 1],
         [1, -1, 1],
         [1, 1, 1],
      ];
      
      const faces = [
         [0, 1, 5, 4,  0, 1], // Left.
         [4, 5, 6, 7,  1, 1], // Forward.
         [7, 6, 2, 3,  2, 1], // Right.
         [3, 2, 1, 0,  3, 1], // Back.
         [0, 4, 7, 3,  1, 0], // Up.
         [5, 1, 2, 6,  1, 2]  // Down.
      ];

      const [cameraEye] = Camera.Get();

      for( const f of faces ) {
         let output = [];
         for( let i = 0; i < 4; i++ ) {
            let [x,y,z] = corners[f[i]];
          
            x += cameraEye[0];
            y += cameraEye[1];
            z += cameraEye[2];
            //z += 3.5;
            let u = f[4] * 0.25 + Math.floor(i/2) * 0.25;
            let v = f[5] * 0.25;// + (i&2) * 0.25;
            if( i == 1 || i == 2 ) v += 0.25;
            output.push( [x, y, z, u, v] );
            //packer.Push(  );//, u, v, 255, 255, 255, 255] );
         }

         // Expand quad to triangle.
         packer.Push( output[0] );
         packer.Push( output[1] );
         packer.Push( output[2] );

         packer.Push( output[2] );
         packer.Push( output[3] );
         packer.Push( output[0] );
      }

    //  attribute vec3 a_position;
    //  attribute vec2 a_uv;
    //  attribute vec4 a_color;
      //const packer2 = new hc.Packer( "fff" );
      
      m_buffer.Load( packer.Buffer(), hc.gl.STATIC_DRAW );
      hc.gl.vertexAttribPointer( a_position, 3, hc.gl.FLOAT, false, 20, 0 );
      hc.gl.vertexAttribPointer( a_uv, 2, hc.gl.FLOAT, false, 20, 12 );
     // hc.gl.vertexAttribPointer( a_position, 2, hc.gl.FLOAT, false, 8, 0 );
   }

   const u_sampler = m_shader.GetUniform( "u_sampler" );
   m_texture.Bind();
   hc.gl.uniform1i( u_sampler, 0 );

   hc.gl.drawArrays( hc.gl.TRIANGLES, 0, 6*6 );

   // Cleanup.
   hc.Context.DisableVertexAttribArrays( [a_position, a_uv] );
}

///////////////////////////////////////////////////////////////////////////////
export default {
    Setup, Render
};
