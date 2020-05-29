
///////////////////////////////////////////////////////////////////////////////
let m_active = [];
let m_time   = 0;

function GetTime() {
   return m_time;
}

// start an animation. this will overwrite any animation in the slot
//  this calls the func every frame until the func returns true. that means
//  the animation is finished.
function Start( slot, func) {
    m_active[slot] = {
        func,
        time: 0
    }
    return m_active[slot];
}

function Stop( slot ) {
   if( m_active[slot] ) {
      delete m_active[slot];
      return true;
   }
   return false;
}

function Slide( a, b, type, time, from, to ) {
   // i'd use ?? but then i'd have to add transpiling.
   if( from === undefined ) from = 0;
   if( to === undefined ) to = 1;

   let d = (time - from) / (to - from);
   d = d < 0 ? 0 : d;
   d = d > 1 ? 1 : d;
   
   if( type == "lerp" ) {
      //return a + (b - a) * d;
   } else if( type == "ease" ) {
      d = (1 - Math.cos( d * Math.PI )) / 2;
      // d = 1 to -1
      
      //return a + (b - a) * d;
   } else if( type == "fall" ) {
      d = (1 - d) ** 2;
      d = 1 - d;
      //return a + (b - a) * d;
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

function Update( time ) {
    
   let ms = new Date().getTime();
   ms = new Date().getTime();
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
/*
class Slider {
	
   constructor( speed, slide, start ) {
      start = start || 0;
      this.currentLinear = start;
      this.currentReal   = start;
      this.desired       = start;
      this.value         = start;
     
      this.speed   = speed;//500;   // every period = 1 unit closer.
      this.slide   = slide;//0.025; // every period = 50% closer.
   }
  
  update( elapsed ) {
      if( this.currentLinear < this.desired ) {
         this.currentLinear += this.speed * elapsed;
         this.currentLinear = this.currentLinear > this.desired ? this.desired : this.currentLinear;
      } else {
         this.currentLinear -= this.speed * elapsed;
         this.currentLinear = this.currentLinear < this.desired ? this.desired : this.currentLinear;
      }
       
      let d = this.slide ** elapsed;
     
      let diff = this.currentLinear - this.value;
      this.value += diff * (1-d);
      return this.value;
   }
  
   reset( y ) {
      this.from = this.to = this.value = y;
   }
  
   slideTo( y ) {
      this.desired = y;
   }
}*/
class Slider {
	
 	constructor( slide, start ) {
   	this.v1            = start;
      this.v2            = start;
   	this.value         = start;
      this.desired       = start;
      this.slide         = slide;
	}
   
   update( elapsed ) {
      let d = this.slide ** elapsed;
      // i admit i have no idea what i did here
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

   remaining() {
      return Math.abs(this.desired - this.value);
   }
   
   reset( y ) {
      this.v1 = this.v2 = this.value = this.desired = y;
	}
}

///////////////////////////////////////////////////////////////////////////////
export default {
   Start, Stop, Update, GetTime, Slide, Slider
};
