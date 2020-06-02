// Animation/timer stuff.
// (C) 2020 Mukunda Johnson
///////////////////////////////////////////////////////////////////////////////
let m_active = [];
let m_time   = 0;

function GetTime() {
   return m_time;
}

//-----------------------------------------------------------------------------
// Start an animation. This will overwrite any existing animation in the slot.
// i.e. this is effectively the same as calling Stop first on it.
//
// The `func` will be called every render frame until it returns `true`, which
// means the animation is finished. `func` is passed two args (time, elapsed).
//
// `time` is the total time since Start. and `elapsed` is how much time passed
// since the last callback. Both are in milliseconds.
//
// Take care when Starting another animation inside of a handler. If the slot
// is the same, returning true will kill the new one.
//
function Start( slot, func) {
    m_active[slot] = {
        func,
        time: 0
    }
    return m_active[slot];
}

//-----------------------------------------------------------------------------
// Stops an animation slot. It will not receive further callbacks.
//
function Stop( slot ) {
   if( m_active[slot] ) {
      delete m_active[slot];
      return true;
   }
   return false;
}

//-----------------------------------------------------------------------------
// This is an interpolation utility. Returns a value between `a` and `b`
//  depending on the `type` of interpolation, the `time` to sample from,
//  and the range--a time slice to sample between. `a` and `b` can be arrays,
//  where an array is returned as well (like vector interpolation).
//
// Example:
//  returns (a * .25 + b * .75) for time 1750 in range [1000,2000] with linear
//  type.
//
// Types are "lerp" (linear), "ease" (cosine), and "fall" (squared slope, sharp
// attack).
function Slide( a, b, type, time, from, to ) {
   // i'd use ?? but then i'd have to add transpiling.
   if( from === undefined ) from = 0;
   if( to === undefined ) to = 1;

   let d = (time - from) / (to - from);
   d = d < 0 ? 0 : d;
   d = d > 1 ? 1 : d;
   
   if( type == "lerp" ) {
      // `d` doesn't need adjustment.
   } else if( type == "ease" ) {
      d = (1 - Math.cos( d * Math.PI )) / 2;
   } else if( type == "fall" ) {
      d = (1 - d) ** 2;
      d = 1 - d;
   }

   if( Array.isArray(a) ) {
      const result = [];
      for( const i in a ) {
         result[i] = a[i] + (b[i] - a[i]) * d;
      }
      return result;
   } else {
      return a + (b - a) * d;
   }
}

//-----------------------------------------------------------------------------
// Update all animations active, called from the main render loop.
//
function Update( time ) {
    
   let ms = new Date().getTime();
   let elapsed = ms - m_time;
   // Maximum of 200ms step per frame - the threshold where things
   //  start to choke.
   elapsed = Math.min( elapsed, 200 );
   m_time = ms;

   for( const idx in m_active ) {
      let timer = m_active[idx];
      timer.time += elapsed;
      if( timer.func( timer.time, elapsed )) {
         delete m_active[idx];
      }
   }
}

//-----------------------------------------------------------------------------
// A utility class that slides values towards other values. The key here is
//  that it has a slower/easing start and finish with the flexibility of
//                               constantly changing the desired endpoint.
class Slider {
	
 	constructor( slide, start ) {
   	this.v1            = start;
      this.v2            = start;
   	this.value         = start;
      this.desired       = start;
      this.slide         = slide;
	}
   
   //--------------------------------------------------------------------------
   // Call this to update the current value and return it. `elapsed` is
   // received from an animation function, although direct milliseconds is
   //                                           probably not what you want.
   update( elapsed ) {
      if( !elapsed || elapsed == 0 ) return this.value;

      let d = this.slide ** elapsed;
      // I admit I have no idea what I did here.
      // The .25 extra is to help out the decay not being too slow.
      // v1 follows desired. v2 follows v1, and value follows v2.
      this.v1 += (this.desired - this.v1) * 1.25 * (1-d);
      this.v2 += (this.v1 - this.v2) * 1.25 * (1-d);
      if( this.value < this.desired ) {
         this.value += (this.v2 - this.value) * 1.25 * (1-d);
         if( this.value > this.desired ) this.value = this.desired;
      } else {
         this.value += (this.v2 - this.value) * 1.25 * (1-d);
         if( this.value < this.desired ) this.value = this.desired;
      }
      
      return this.value;
   }

   //--------------------------------------------------------------------------
   // Returns the absolute difference between the desired value and the
   // current value (update must be called first).
   remaining() {
      return Math.abs(this.desired - this.value);
   }
   
   //--------------------------------------------------------------------------
   // Snap the current value to `y` without sliding.
   reset( y ) {
      this.v1 = this.v2 = this.value = this.desired = y;
	}
}

///////////////////////////////////////////////////////////////////////////////
export default {
   Start, Stop, Update, GetTime, Slide, Slider
};
