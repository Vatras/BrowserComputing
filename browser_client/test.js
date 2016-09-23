//an easy test to get cpu speed and num of cores
function calculate(){
	var y;
	var array=[];

	for(var i=0;i<250000;i++)
	{
		array.push(Math.random());
	}

	array.sort(function(a,b){return a-b;});

	self.postMessage({});
}
self.onmessage = function(e) {

  	calculate();
}