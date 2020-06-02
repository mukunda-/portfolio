// A helper utility that outputs perlin noise samples
// (C) 2020 Mukunda Johnson
//-----------------------------------------------------------------------------

///////////////////////////////////////////////////////////////////////////////
export default class PerlinStream {
   //--------------------------------------------------------------------------
   // `taps` is how many different levels are sampled.
   // `factor` is the multiplier for each level, e.g., 1.5 means 1.0 base tap
   // 1.5 frequency 1/1.5 amplitude on the next tap, 2.25 frequency 1/2.25
   // amp on the next tap, etc.
	constructor( taps, factor ) {
   	this.samples = [];
      this.time    = [];
      this.taps    = taps;
      this.factor  = factor;

      // Initialize the sample map. We only store two samples for each tap,
      // which are what we are currently interpolating between.
      for( let i = 0; i < taps; i++ ) {
      	this.samples[i] = [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2];
         this.time[i]    = 0;
		}
   }
   
   //--------------------------------------------------------------------------
   // Advance the sampler by `time`, and return the new sample.
   update( time ) {
   	let sum = 0;
   	for( let i = 0; i < this.taps; i++ ) {
     
      	let freq = this.factor ** i;
      	let t = this.time[i] + time * freq;
         if( t > 2.0 ) {
         	this.samples[i][0] = (Math.random() - 0.5) * 2;
            this.samples[i][1] = (Math.random() - 0.5) * 2;
            t = t - Math.floor( t );
			} else if( t > 1.0 ) {
         	this.samples[i][0] = this.samples[i][1];
            this.samples[i][1] = (Math.random() - 0.5) * 2;
            t -= 1.0;
			}
         
         // Cosine interpolation. Perlin noise does not work well with linear
         // interpolation.
         let d = (1-Math.cos(t*Math.PI))/2;
         sum += (this.samples[i][0] + (this.samples[i][1] - this.samples[i][0]) * d) / freq;
         
      	this.time[i] = t;
      }
      
      this.value = sum;
	}
}
