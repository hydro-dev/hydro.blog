Array.prototype.forEach.call(document.getElementsByClassName('paper'), function (e) {
	var style = getComputedStyle(e);
	var pos = style.backgroundPosition.split(',').map(function (s){ return s.trim(); });
	var x = Math.ceil(Math.random()*10);
	pos[0] = "5px "+x+"px";
	pos[1] = "5px "+(x-1)+"px";
	if(pos[2]){
		pos[2] = "50% "+(x-1)+"px";
	}
	e.style.backgroundPosition = pos.join(', ');
});
