/*! [[HC]] 
 * Copyright 2014 mukunda
 */
 
(function() {

function CC( str ) {
	return str.charCodeAt(0);
}
 
var	BYTE   = 0; var UBYTE  = 1;
var SHORT  = 2; var USHORT = 3;
var INT    = 4; var UINT   = 5;
var FLOAT  = 6; var DOUBLE = 7;

var TYPEMAP = {
	'b': BYTE,
	'B': UBYTE,
	's': SHORT,
	'S': USHORT,
	'i': INT,
	'I': UINT,
	'f': FLOAT,
	'd': DOUBLE
};

var SIZES = {};

SIZES[BYTE]  = 1; SIZES[UBYTE]  = 1;
SIZES[SHORT] = 2; SIZES[USHORT] = 2;
SIZES[INT]   = 4; SIZES[UINT]   = 4;
SIZES[FLOAT] = 4; SIZES[DOUBLE] = 8;

var ALLOC_SIZE = 64;

/****************************************************
 normal example of usage:
 
   // create buffer, float x2 and unsigned byte x4
   var buffer = HC_Packer( "ff BBBB" );
   
   // insert data
   buffer.Push( [ 1.0, 1.0, 255,255,255,255 ] );
   buffer.Push( [ 1.0, 1.0, 255,255,255,255 ] );
   buffer.Push( [ 1.0, 1.0, 255,255,255,255 ] );
   buffer.Push( [ 1.0, 1.0, 255,255,255,255 ] ); 
   
   // get resulting buffer with Buffer()
   gl_operation( a, b, buffer.Buffer(), c );
   
*****************************************************/

/** ---------------------------------------------------------------------------
 * [class] Data packer/serializer
 *
 * @param string format Format of data to be packed.
 *        each letter in the format is a data type that is in the packed
 *        format. Spaces can be used for 
 *        For example, "fff ff bbbb" would be a vertex struct like this:
 *                                   float x,y,z
 *                                   float u,v
 *                                   byte r,g,b,a;
 *        Data type list:
 *          b: signed 8-bit integer (byte)
 *          B: unsigned 8-bit integer
 *          s: signed 16-bit integer (short)
 *          S: unsigned 16-bit integer 
 *          i: signed 32-bit integer
 *          I: unsigned 32-bit integer
 *          f: 32-bit floating point (float)
 *          d: 64-bit floating point (double)
 */
HC_Packer = function( format ) {
	if( !format.match( /[bBsSiIfd ]+/ ) ) {
		throw new Error( "Invalid format string." );
	}
	
	var stripped_format = format.replace( / /g, "" );
	
	var p_format = [];
	
	for( var i = 0; i < stripped_format.length; i++ ) {
		p_format.push( TYPEMAP[stripped_format[i]] );
	}
	
	this.format = p_format;
	this.cell_size = ComputeSize( p_format );
	this.buffer = new ArrayBuffer(0);
	this.total = 0;
};

/** ---------------------------------------------------------------------------
 * Push data into the buffer.
 *
 * @param array values Values to push. Length must be divisible by
 *                     the format length.
 * @return int Total number of cells (formatted structs) in the buffer.
 */
HC_Packer.prototype.Push = function( values ) {
	var start = 0;
	
	while( start < values.length ) {
		if( this.write_buffer == null ) {
			this.CreateWriteBuffer();
		}
		
		var pos = this.write_index * this.cell_size;
		
		for( var i = 0; i < this.format.length; i++ ) {
			var value = values[start+i];
			var type = this.format[i];
			
			switch( type ) {
				case BYTE:
					this.buffer_view.setInt8( pos, value );
					break;
				case UBYTE:
					this.buffer_view.setUint8( pos, value );
					break;
				case SHORT:
					this.buffer_view.setInt16( pos, value, true );
					break;
				case USHORT:
					this.buffer_view.setUint16( pos, value, true );
					break;
				case INT:
					this.buffer_view.setInt32( pos, value, true );
					break;
				case UINT:
					this.buffer_view.setUint32( pos, value, true );
					break;
				case FLOAT:
					this.buffer_view.setFloat32( pos, value, true );
					break;
				case DOUBLE:
					this.buffer_view.setFloat64( pos, value, true );
					break;
			}
			pos += SIZES[type];
		}
		this.write_index++;
		if( this.write_index == ALLOC_SIZE ) {
			// our temp buffer has been maxed out, concatenate to the main buffer.
			this.Flush();
		}
		this.total++;
		start += this.format.length;
	}
	return this.total;
};

/** ---------------------------------------------------------------------------
 * Return the data buffer.
 */
HC_Packer.prototype.Buffer = function() {
	this.Flush();
	return this.buffer;
};

/** ---------------------------------------------------------------------------
 * Create a writing buffer.
 *
 * This is not called normally.
 */
HC_Packer.prototype.CreateWriteBuffer = function() {
	this.write_buffer = new ArrayBuffer( this.cell_size * ALLOC_SIZE );
	this.write_index = 0;
	this.buffer_view = new DataView( this.write_buffer );
};

/** ---------------------------------------------------------------------------
 * Push the write buffer into the main buffer, and delete the write buffer.
 *
 * This is called by Buffer, so you don't have to worry about it.
 */
HC_Packer.prototype.Flush = function() {
	if( this.write_buffer == null ) return;
	this.buffer_view = null;
	var bucket = new Uint8Array( this.buffer.byteLength + 
							     this.write_buffer.byteLength );
	bucket.set( new Uint8Array( this.buffer ), 0 );
	bucket.set( new Uint8Array( this.write_buffer ), this.buffer.byteLength );
	this.buffer = null;
	this.buffer = bucket.buffer;
	this.write_buffer = null;
	this.write_index = 0;
};

/** ---------------------------------------------------------------------------
 * Compute the size per format cell.
 *
 * @param string format A format string.
 * @return int Size in bytes.
 */
function ComputeSize( format ) {
	var size = 0;
	
	for( var i = 0; i < format.length; i++ ) {
		size += SIZES[format[i]];
	}
	return size;
}

})();