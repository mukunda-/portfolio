/*! [[HC]] 
 * Copyright 2014 mukunda
 */
 
/** ---------------------------------------------------------------------------
 * [class] Create a texture from a file.
 *
 * @param string path Path to texture file.
 * @param GLenum [format] Format of texture. Default = RGBA
 */
function HC_Texture( path, format, onload ) {
	this.format = format || hc_gl.RGBA;
	this.texture = hc_gl.createTexture();
	this.onload = onload;

	var image = new Image();
	var m_this = this;
	image.onload = function() { m_this.OnImageLoaded( image ) }; 
	image.src = path;
}

HC_Texture.prototype.OnImageLoaded = function( image ) {
	hc_gl.bindTexture( hc_gl.TEXTURE_2D, this.texture );
	hc_gl.texImage2D( hc_gl.TEXTURE_2D, 0, this.format, this.format, hc_gl.UNSIGNED_BYTE, image );
//	hc_gl.texParameteri( hc_gl.TEXTURE_2D, hc_gl.TEXTURE_MAG_FILTER, hc_gl.LINEAR );
//	hc_gl.texParameteri( hc_gl.TEXTURE_2D, hc_gl.TEXTURE_MIN_FILTER, hc_gl.LINEAR_MIPMAP_LINEAR );
	
	hc_gl.texParameteri( hc_gl.TEXTURE_2D, hc_gl.TEXTURE_WRAP_S, hc_gl.CLAMP_TO_EDGE ); 
	hc_gl.texParameteri( hc_gl.TEXTURE_2D, hc_gl.TEXTURE_WRAP_T, hc_gl.CLAMP_TO_EDGE ); 

	hc_gl.generateMipmap( hc_gl.TEXTURE_2D );
	this.onload();
	hc_gl.bindTexture( hc_gl.TEXTURE_2D, null );
};

/** ---------------------------------------------------------------------------
 * Bind this texture to the active texture unit.
 */
HC_Texture.prototype.Bind = function() {
	hc_gl.bindTexture( hc_gl.TEXTURE_2D, this.texture );
};

///////////////////////////////////////////////////////////////////////////////
export default Texture;