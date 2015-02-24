'use strict';

var content = [
	{
		'url': 'content/construct',
		'playTime': 30
	},
	{
		'url': 'content/animatic_test_3/index.html',
		'playTime': 45
	},
	{
		'url': 'content/xibalba/index.html',
		'playTime': 45
	},
	{
		'url': 'http://dev.aerys.in/oculus-rex/release/super-trex.html',
		'playTime': 45
	},
	{
		'favorite': 'diving',
		'playTime': 20
	},
	{
		'url': 'content/couchknights/CouchKnights-s.html',
		'playTime': 20
	},
	{
		'url': 'content/sechelt/index.html?mode=vr',
		'playTime': 20
	},
	{
		'favorite': 'polar',
		'playTime': 20
	}
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
	}

	VRDemo.prototype.load = function(index) {
		var self = this;
		var demo = content[index];
		var ui = VRManager.ui;
		var hud = ui.hud;

		function loadHudFavorite(id) {
			ui.showHud();

			var favorite = hud.favorites.filter(function(fav) {
				return fav.id == id;
			});

			setTimeout(function() {
				ui.load(favorite[0].url)
			}, 2000);
			
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