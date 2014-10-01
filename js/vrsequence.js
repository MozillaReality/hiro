function VRSequence() {
	this.currentIndex = 0;

	this.sequence = [{
		showTitle: true,
		siteInfo: {
			'.url': './sequence/1/index.html',
			'.title': 'Intro sequence',
			'.author': 'Josh Carpenter', 
			'.tech': 'Cinema 4D, VR Dom'
		}
	},{
		showTitle: false,
		siteInfo: {
			'.url': './sequence/2/index.html'
		}
	},{
		showTitle: true,
		siteInfo: {
			'.url': './content/sechelt/index.html',
			'.title': 'Sechelt',
			'.author': 'Mr Doob', 
			'.tech': 'three.js'
		}
	}];
}

VRSequence.prototype.start = function() {	
	this.load(this.currentIndex);
}

VRSequence.prototype.load = function(index) {
	var s = this.sequence[index];
	if (!s) {
		return false;
	}
	VRManager.load(s.siteInfo['.url'], s);
}

VRSequence.prototype.next = function() {
	this.load(++this.currentIndex);
}