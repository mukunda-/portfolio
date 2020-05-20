// HC
// Copyright 2020 mukunda
///////////////////////////////////////////////////////////////////////////////
import gl from "./context.js"

///////////////////////////////////////////////////////////////////////////////
// Vertex Buffer
//
// Controls a single GL vertex buffer.
//
class Buffer {
	constructor() {
		this.buffer = gl.createBuffer();
		this.Bind();
	}

	//---------------------------------------------------------------------------
	// Bind this buffer to the gl context.
	//
	Bind() {
		gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
	}

	//---------------------------------------------------------------------------
	// Load vertex data.
	//
	// `data` is an ArrayBuffer. And `usage` is the rendering hint, passed to
	//  WebGL bufferData.
	Load( data, usage ) {
		this.Bind();
		gl.bufferData( gl.ARRAY_BUFFER, data, usage );
	}
}

export default Buffer;