/*! [[HC]] 
 * Copyright 2014 mukunda
 */
import {gl} from "./context.js"
 
/** ---------------------------------------------------------------------------
 * [class] Create a texture from a file.
 *
 * @param string path Path to texture file.
 * @param GLenum [format] Format of texture. Default = RGBA
 */
class Texture {
	constructor( path, format, onload ) {
		this.format = format || gl.RGBA;
		this.texture = gl.createTexture();
		this.onload = onload;

		var image = new Image();
		var m_this = this;
		image.onload = function() { m_this.OnImageLoaded( image ) }; 
		image.src = path;
	}

	OnImageLoaded( image ) {
		gl.bindTexture( gl.TEXTURE_2D, this.texture );
		gl.texImage2D( gl.TEXTURE_2D, 0, this.format, this.format, gl.UNSIGNED_BYTE, image );
	//	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
	//	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
		
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE ); 
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE ); 

		gl.generateMipmap( gl.TEXTURE_2D );
		this.onload();
		gl.bindTexture( gl.TEXTURE_2D, null );
	}

	/** ---------------------------------------------------------------------------
	 * Bind this texture to the active texture unit.
	 */
	Bind() {
		gl.bindTexture( gl.TEXTURE_2D, this.texture );
	};
}


///////////////////////////////////////////////////////////////////////////////
export default Texture;
