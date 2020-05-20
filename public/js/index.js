import hc from "./hc/context.js";

console.log( "%cwondering how this puppy works?", 
   "background-color:#222; color:white; font-size: 1.4em" );

hc.Init( "background", {
   premultipliedAlpha : false,

   alpha   : false,
   depth   : false,
   stencil : false
});


hc.gl.clear( hc.gl.COLOR_BUFFER_BIT );
