import {forceSimulation, forceManyBody, forceLink} from 'd3-force-3d';

//https://www.npmjs.com/package/worker-loader
self.addEventListener('message', event => {

	const {nodes, links, r} = event.data;

	//Custom force
	const centrifugalForce = alpha => {
		for(let i=0, n=nodes.length, node, k=alpha*.5; i<n; i++){
			node = nodes[i];
			node.vx -= node.x * k;
			node.vy -= node.y * k;
			node.vz -= node.z * k;
		}
	}

	//Create force simulation and forces
	const simulation = forceSimulation().numDimensions(3)
		.force('link', forceLink(links).distance(r*2).strength(1))
		.force('manyBody', forceManyBody().strength(d=>d.depth===2?-50:0))
		.force('centrifugal', centrifugalForce)
		.nodes(nodes)
		.stop();

	for(let i = 0; i < 300; i ++){
		simulation.tick();
		self.postMessage({type:'tick'});
	}

	self.postMessage({
		type:'end',
		nodes,
		links
	});

});