// HC
// Copyright 2020 mukunda
///////////////////////////////////////////////////////////////////////////////
import {gl} from "./context.js"

///////////////////////////////////////////////////////////////////////////////

//-----------------------------------------------------------------------------
// Shader component. `source` can either be a DOM id, which is loaded with
//  `GetShaderScript`, or an object with these fields:
//     type - "fragment" or "vertex"
//     code - Shader source code.
//
/*
function ShaderSource( source ) {
   if( typeof source === "string" ) {
      source = HC_ReadShaderScript( source );
   }
   
   if( source.type == "fragment" ) {
      this.shader = gl.createShader( gl.FRAGMENT_SHADER );
   } else if( source.type == "vertex" ) {
      this.shader = gl.createShader( gl.VERTEX_SHADER );
   } else {
      throw new Error("Invalid shader type.");
   }

   gl.shaderSource( this.shader, source.code );
   gl.compileShader( this.shader );
   
   if( !gl.getShaderParameter( this.shader, gl.COMPILE_STATUS ) ) {  
      
      console.error( "Error compiling shader \"" + source.id + "\":\n" 
                     + gl.getShaderInfoLog( this.shader ));  
      throw new Error( "Shader compilation error" );
   }
}*/

class ShaderSource {
   constructor( id, content, type ) {
      this.id = id;

      if( type == "fragment" ) {
         type = gl.FRAGMENT_SHADER;
      } else if( type == "vertex" ) {
         type = gl.VERTEX_SHADER;
      } else {
         throw new Error( "Invalid shader type." );
      }

      this.shader = gl.createShader( type );
      gl.shaderSource( this.shader, content );
      gl.compileShader( this.shader );
      
      if( !gl.getShaderParameter( this.shader, gl.COMPILE_STATUS ) ) {
         throw new Error( "Error compiling shader \"" + this.id + "\":\n" 
                          + gl.getShaderInfoLog( this.shader ) );
      }
   }

   static FromURL( url, type ) {
      if( type === undefined ) {
         // todo: urls with query strings
         if( url.match( /\.v\.glsl$/ )) {
            type = "vertex";
         } else if( url.match( /\.f\.glsl$/ )) {
            type = "fragment";
         }
      }
      
      return fetch( url ).then( response => {
         if( !response.ok ) throw Error( "Couldn't fetch shader source. " + url );
         return response.text();
      }).then( text => {
         return new ShaderSource( url, text, type );
      });
   }
}

//-----------------------------------------------------------------------------
// Holds a shader program.
//
class Shader {
   constructor() {
      this.program = gl.createProgram();
   }

   //--------------------------------------------------------------------------
   // Attach a shader source. `source` is a `ShaderSource`.
   //
   Attach( source ) {
      gl.attachShader( this.program, source.shader );
   };

   AttachFromURL( url, type ) {
      return ShaderSource.FromURL( url, type ).then( source => {
         this.Attach( source );
      });
   }

   //--------------------------------------------------------------------------
   // Link the program.
   //
   Link() {
      gl.linkProgram( this.program );
      if( !gl.getProgramParameter( this.program, gl.LINK_STATUS ) ) {
         console.error( "Unable to link shader!" );  
         throw "Shader link error.";
      }
   };
   
   //--------------------------------------------------------------------------
   // Activate this shader program for rendering.
   //
   Use() {
      gl.useProgram( this.program );
   };

   //--------------------------------------------------------------------------
   // Wrapper for getAttribLocation.
   //
   // `name` is the name of the attribute in the shader.
   // Returns attribute location. (see gl docs...)
   //
   GetAttribute( name ) {
      return gl.getAttribLocation( this.program, name );
   };

   ///---------------------------------------------------------------------------
   // Wrapper for getUniformLocation.
   //
   // `name` is the name of the uniform varaible.
   // Returns uniform variable location. (see gl docs...)
   //
   GetUniform( name ) {
      return gl.getUniformLocation( this.program, name );
   };
}

//-----------------------------------------------------------------------------
// Read a shader script from the DOM.
//
// @param string id ID of element to read from.
// @return object Shader script object for HC_ShaderSource constructor.
//
function ReadShaderScript( id ) {
   var out = {};
   
   var e = document.getElementById(id);
   if( e === null ) {
      console.log( "Missing script ID." );  
      throw "Shader script error.";
   }
   
   out.id = id;
   if( e.type == "x-shader/x-fragment" ) {
      out.type = "fragment";
   } else if( e.type == "x-shader/x-vertex" ) {
      out.type = "vertex";
   } else {
      console.log( "Unknown script type." );  
      throw "Shader script error.";
   }
   
   out.code = e.text;
   
   return out;
}

export { ReadShaderScript, ShaderSource };
export default Shader;
