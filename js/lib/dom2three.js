'use strict';

function DOM2three(uiData, searchRoot) {
	var self = this;
	self.page = null;
	self.dataPath = null;
	self.data = null;
	self.root = null;
	self.onload = null;

	self.getJson(uiData).then( function(response) {
		return JSON.parse(response)
	}).then( function(response) {
		self.data = response;
		self.findRoot(response, searchRoot);
		if (typeof self.onload == 'function') {
			self.onload.call(self);
		}
	});
}

DOM2three.prototype.getRectangle = function(el) {
	var rect = el.getBoundingClientRect();
	console.log(el, rect);
	return {
		x: rect.x,
		y: rect.y,
		width: el.offsetWidth,
		height: el.offsetHeight
	};
}

DOM2three.prototype.applyContent = function(items, dom) {
	var self = this;

	items.forEach(function(item) {
		var select = dom.querySelector(item.selector);

		var el;

		// clone element
		if (item.clone) {
			el = select.cloneNode(true);
			el.id = '';	// clear ID so that we don't collide with cloned element.
			select.parentNode.appendChild(el);
		} else {
			el = select;
		}

		// project content into element.
		if (item.content) {
			item.content.forEach(function(content) {
				if (content.selector) {
					var cel = el.querySelector(content.selector)
					if (cel) {
						cel.innerHTML = content.content;
					} else {
						console.error(content.selector + " not found");
					}
					content.rectangle = self.getRectangle(cel);
				}
			});
		};

		// get bounding rect for element.
		item.rectangle = self.getRectangle(el);


	});

	return items;
}

DOM2three.prototype.findRoot = function(object, searchRoot) {
	for (var property in object) {
		if (typeof object[property] == 'object') {

			if (object[property].hasOwnProperty('page')
				&& object[property].hasOwnProperty('datapath')) {

			 	if (property == searchRoot || !searchRoot) {
			 		this.root = object[property];

			 		return false;
			 	}
			}
			this.findRoot(object[property], searchRoot);
		}
	}
	return false;
};

DOM2three.prototype.getJson = function(url) {
	return new Promise( function(resolve, reject) {
		var xhr = new XMLHttpRequest();

		xhr.onload = function() {
			resolve(xhr.response);
		}

		xhr.onerror = function() {
			reject(new Error('Some kind of network error, XHR failed.'))
		}

		xhr.open('GET', url);
		xhr.send();
	});
};
