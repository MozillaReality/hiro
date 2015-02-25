'use strict';

var content = [
	{
		'favorite': 'fav-xibalba.png',
		'playTime': 20
	},
	{
		'favorite': 'fav-sechelt.png',
		'playTime': 20
	},
	{
		'favorite': 'fav-polarsea.png',
		'playTime': 20
	},
	{
		'favorite': 'fav-rex.png',
		'playTime': 20
	},
	{
		'favorite': 'fav-couchknights.png',
		'playTime': 20
	},
	{
		'favorite': 'fav-rainbow.png',
		'playTime': 20
	},
	{
		'favorite': 'fav-nickycase.png',
		'playTime': 20
	},
	
]

var VRDemo = (function() {
	function VRDemo() {
		this.currentIndex = 0;
		this.interval = null;
	}

	VRDemo.prototype.start = function() {
		var self = this;
		setTimeout(function() {
			self.load(self.currentIndex);
		},5000)	
	}

	VRDemo.prototype.stop = function() {
		window.clearTimeout(this.interval);
		console.alert('Demo canceled!');
	}

	VRDemo.prototype.load = function(index) {
		var self = this;
		var demo = content[index];
		var ui = VRManager.ui;
		var hud = ui.hud;

		function loadHudFavorite(id) {
			ui.showHud();

			var favorite = hud.favorites.find(function(fav) {
				return fav.id == id;
			});

			if (favorite) {
				setTimeout(function() {
					ui.load(favorite.url)
				}, 2000);
			}
		}

		if (demo.favorite) {
			loadHudFavorite(demo.favorite);
		} else {
			VRManager.ui.load(demo.url);
		}

		this.interval = setTimeout(function() {
			var next = content[++index];
			if (next) {
				self.load(index);
			}	else {
				console.log('Demo done!')
			}
		}, demo.playTime * 1000)
		
		
	}


	return new VRDemo();
})();