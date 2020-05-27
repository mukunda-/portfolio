// shitmath
function RotateAroundAxis( axis, angle ) {
   //http://ksuweb.kennesaw.edu/~plaval//math4490/rotgen.pdf
   let C = Math.cos( angle );
   let S = Math.sin( angle );
   let t = 1 - C;
   let [ux, uy, uz] = axis;
   
   return [
      t * ux**2 + C, t*ux*uy - S*uz, t*ux*uz + S*uy,
      t*ux*uy+S*uz, t*uy**2+C, t*uy*uz - S*ux,
      t*ux*uz - S*uy, t*uy*uz + S*ux, t*uz**2 + C
   ];
}

function MultiplyVec3ByMatrix3( vec, matrix ) {
   return [
      matrix[0] * vec[0] + matrix[1] * vec[1] + matrix[2] * vec[2],
      matrix[3] * vec[0] + matrix[4] * vec[1] + matrix[5] * vec[2],
      matrix[6] * vec[0] + matrix[7] * vec[1] + matrix[8] * vec[2]
   ];
}

function MultiplyMatrixAndPoint(matrix, point) {
   // Give a simple variable name to each part of the matrix, a column and row number
   let c0r0 = matrix[ 0], c1r0 = matrix[ 1], c2r0 = matrix[ 2], c3r0 = matrix[ 3];
   let c0r1 = matrix[ 4], c1r1 = matrix[ 5], c2r1 = matrix[ 6], c3r1 = matrix[ 7];
   let c0r2 = matrix[ 8], c1r2 = matrix[ 9], c2r2 = matrix[10], c3r2 = matrix[11];
   let c0r3 = matrix[12], c1r3 = matrix[13], c2r3 = matrix[14], c3r3 = matrix[15];
   
   // Now set some simple names for the point
   let x = point[0];
   let y = point[1];
   let z = point[2];
   let w = point[3];
   if( w === undefined ) w = 1.0;
   
   // Multiply the point against each part of the 1st column, then add together
   let resultX = (x * c0r0) + (y * c0r1) + (z * c0r2) + (w * c0r3);
   
   // Multiply the point against each part of the 2nd column, then add together
   let resultY = (x * c1r0) + (y * c1r1) + (z * c1r2) + (w * c1r3);
   
   // Multiply the point against each part of the 3rd column, then add together
   let resultZ = (x * c2r0) + (y * c2r1) + (z * c2r2) + (w * c2r3);
   
   // Multiply the point against each part of the 4th column, then add together
   let resultW = (x * c3r0) + (y * c3r1) + (z * c3r2) + (w * c3r3);
   
   return [resultX, resultY, resultZ, resultW];
}

function MultiplyMatrices(matrixA, matrixB) {
   // Slice the second matrix up into rows
   let row0 = [matrixB[ 0], matrixB[ 1], matrixB[ 2], matrixB[ 3]];
   let row1 = [matrixB[ 4], matrixB[ 5], matrixB[ 6], matrixB[ 7]];
   let row2 = [matrixB[ 8], matrixB[ 9], matrixB[10], matrixB[11]];
   let row3 = [matrixB[12], matrixB[13], matrixB[14], matrixB[15]];
 
   // Multiply each row by matrixA
   let result0 = MultiplyMatrixAndPoint(matrixA, row0);
   let result1 = MultiplyMatrixAndPoint(matrixA, row1);
   let result2 = MultiplyMatrixAndPoint(matrixA, row2);
   let result3 = MultiplyMatrixAndPoint(matrixA, row3);
 
   // Turn the result rows back into a single matrix
   return [
      result0[0], result0[1], result0[2], result0[3],
      result1[0], result1[1], result1[2], result1[3],
      result2[0], result2[1], result2[2], result2[3],
      result3[0], result3[1], result3[2], result3[3]
   ];
}

function MakeProjectionMatrix( fov, a, near, far ) {
   fov = fov * Math.PI / 180.0;
   const rtan = 1 / Math.tan( fov / 2 );
   const range = far - near;
   return [
      rtan/a, 0 , 0, 0,
      0, rtan, 0, 0,
      0, 0, -(near + far) / range, -1,
      0, 0, -2 * near * far / range, 0 
   ];
}

//-----------------------------------------------------------------------------
function IdentityMatrix() {
   return [ 1, 0, 0, 0,
             0, 1, 0, 0,
             0, 0, 1, 0,
             0, 0, 0, 1 ];
}

//-----------------------------------------------------------------------------
function Cross( a, b ) {
   return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
   ]
}

//-----------------------------------------------------------------------------
function Normalize( a ) {
   const len = Math.hypot( a[0], a[1], a[2] ); // should change to handle Nd vectors
   if( len > 0.000001 ) {
      return [ a[0] / len, a[1] / len, a[2] / len ];
   } else {
      throw "Normalizing zero-length vector.";
      console.warn( "Normalized zero-length vector." );
      return [0, 0, 0];
   }
}

//-----------------------------------------------------------------------------
function SubtractVectors( a, b ) {
   return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

//-----------------------------------------------------------------------------
function LookAt( from, to, sky ) {
   sky = sky || [0, 1, 0];
   let forward = Normalize( SubtractVectors(from, to) );
   let left    = Normalize( Cross(sky, forward) );
   let up      = Normalize( Cross(forward, left) );

   return [
      left[0],    up[0],    forward[0],    0,
      left[1],    up[1],    forward[1],    0,
      left[2],    up[2],    forward[2],    0,

      -(   left[0]*from[0] +    left[1]*from[1] +    left[2]*from[2]),
      -(     up[0]*from[0] +      up[1]*from[1] +      up[2]*from[2]),
      -(forward[0]*from[0] + forward[1]*from[1] + forward[2]*from[2]),
      1
   ];
}

function Copy( vectorDest, vectorSource ) {
   for( let i = 0; i < vectorSource.length; i++ ) {
      vectorDest[i] = vectorSource[i];
   }
}

function Distance( vec1, vec2, vectorSize ) {
   vectorSize = vectorSize || vec1.length;
   let d = 0;
   for( let i = 0; i < vectorSize; i++ ) {
      let a = vec1[i] - vec2[i];

      d += a*a;
   }
   return Math.sqrt( d );
}

//-----------------------------------------------------------------------------
// Snaps a vector to a single axis. `magnitude` is how long it should be
//  after the snap.
function Snap( vector, magnitude ) {
   if( magnitude === undefined ) magnitude = 1;

   let max = 0;//Number.MIN_VALUE;
   let bestMax;
   for( let i = 0; i < vector.length; i++ ) {
      if( Math.abs(vector[i]) > Math.abs(max) ) {
         max = vector[i];
         bestMax = i;
      }
   }

   for( const i in vector ) {
      vector[i] = 0;
   }

   if( max < 0 ) {
      vector[bestMax] = -magnitude;
   } else {
      vector[bestMax] = magnitude;
   }
}

function Clamp( a, min, max ) {
   if( a < min ) return min;
   if( a > max ) return max;
   return a;
}

export default {
   LookAt, SubtractVectors, IdentityMatrix, Cross, Normalize,
   MultiplyMatrixAndPoint, MultiplyMatrices, MakeProjectionMatrix,
   Copy, Distance, Snap, RotateAroundAxis, MultiplyVec3ByMatrix3,
   Clamp
}
