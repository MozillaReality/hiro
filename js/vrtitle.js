function VRTitle(container, t, data) {
	var key, clone, node;

	// match key with element in template
	for (key in data) {
		t.content.querySelector(key).textContent = data[key];	
	};
	clone = document.importNode(t.content, true);
	container.style.display = 'block';
	container.appendChild(clone);
	node = container.lastElementChild;
	
	// animate
	Velocity(node, { width: ['20rem', '0rem'] }, { easing: 'easeOutQuint', duration: 1000, delay: 1000 })
    .then( function() {
    	Velocity(node, { width: ['0rem', '20rem'] }, { easing: 'easeOutQuint', duration: 1000, delay: 3000 })
		    .then( function() {
		    	node.parentNode.removeChild(node);	
		    	container.style.display = 'none';
				});
		});	
}

