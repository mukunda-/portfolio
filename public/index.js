import hc from "./hc/context.js";

console.log( "Hello %s.", "world" );


hc.Init( "background", {
   premultipliedAlpha : false,

   alpha   : false,
   depth   : false,
   stencil : false
});

hc.gl.clear( hc.gl.COLOR_BUFFER_BIT );
