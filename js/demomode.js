'use strict';

var VRDemo = (function() {
	function VRDemo() {
		this.currentIndex = 0;
		this.interval = null;
		this.running = false;
	}

	VRDemo.prototype.start = function() {
		var startDelay = 30*1000;
		var self = this;

		if (this.currentIndex >= DemoScript.length) {
			this.reset();
		}

		this.running = true;
		console.log('--- Demo mode started! Running in ' + startDelay + 'ms');
		setTimeout(function() {
			self.load(self.currentIndex);
		}, startDelay) // time before starting demo.
	}

	VRDemo.prototype.stop = function() {
		this.running = false;

		this.clearCurrentDemo();

		console.log('--- Demo canceled!');
	}

	VRDemo.prototype.clearCurrentDemo = function() {
		window.clearTimeout(this.interval);
	}

	VRDemo.prototype.reset = function() {
		this.currentIndex = 0;
		this.running = false;
		this.clearCurrentDemo();
	}

	VRDemo.prototype.load = function(index) {
		var self = this;
		var demo = DemoScript[index];
		var ui = VRManager.ui;
		var hud = ui.hud;

		function loadHudFavorite(id) {
			ui.showHud();

			var favorite = hud.favorites.find(function(fav) {
				return fav.id == id;
			});

			if (favorite) {
				setTimeout(function() {
					ui.load(favorite.url, favorite)
				}, 2000);
			}
		}

		if (demo.favorite) {
			loadHudFavorite(demo.favorite);
		} else {
			VRManager.ui.load(demo.url);
		}

		this.interval = setTimeout(function() { self.next() }, demo.playTime * 1000)
	}

	VRDemo.prototype.next = function() {
		if (!this.running) return false;

		this.clearCurrentDemo();

		var next = DemoScript[++this.currentIndex];

		if (next) {
			this.load(this.currentIndex);
		}	else {
			console.log('--- Demo done!')
			this.reset();
		}
	}

	VRDemo.prototype.prev = function() {
		if (!this.running) return false;

		this.clearCurrentDemo();

		var next = DemoScript[--this.currentIndex];

		if (next && this.currentIndex > -1) {
			this.load(this.currentIndex);
		}	else {
			console.log('--- Demo done!')
		}
	}


	return new VRDemo();
})();