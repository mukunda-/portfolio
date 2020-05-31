

export default class PerlinStream {
	constructor( taps, factor ) {
   	this.samples = [];
      this.time = [];
      this.taps = taps;
      this.factor = factor;
      for( let i = 0; i < taps; i++ ) {
      	this.samples[i] = [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2];
         this.time[i] = 0;
		}
      
	}
   
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
         
         let d = (1-Math.cos(t*Math.PI))/2;
         sum += (this.samples[i][0] + (this.samples[i][1] - this.samples[i][0]) * d) / freq;
         
      	this.time[i] = t;
      }
      
      this.value = sum;
	}

}