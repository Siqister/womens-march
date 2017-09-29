import {forceSimulation, forceManyBody, forceLink} from 'd3-force-3d';

//https://www.npmjs.com/package/worker-loader
self.addEventListener('message', event => {

	const {nodes, links, r} = event.data;

	//Custom force
	const centrifugalForce = alpha => {

		for(let i=0, n=nodes.length, node, k=alpha*.05; i<n; i++){

			node = nodes[i];
			if(node.depth===2){
				node.vx -= (node.x - node.parent.x) * k;
				node.vy -= (node.y - node.parent.y) * k;
				node.vz -= (node.z - node.parent.z) * k;
			}

		}

	}

	const surfaceForce = alpha => {

		for(let i=0, n=nodes.length, node, k=alpha*.07; i<n; i++){

			node = nodes[i];
			if(node.depth>0){
				const length = Math.sqrt(node.x*node.x + node.y*node.y + node.z*node.z);
				node.vx -= (node.x - node.x/length*r) * k;
				node.vy -= (node.y - node.y/length*r) * k;
				node.vz -= (node.z - node.z/length*r) * k;
			}

		}

	}

	//Create force simulation and forces
	const simulation = forceSimulation().numDimensions(3)
		//.force('link', forceLink(links).distance(r*2).strength(1))
		.force('manyBody', forceManyBody().strength(d=>d.depth===1?-2000:-1200))
		.force('centrifugal', centrifugalForce)
		.force('surface', surfaceForce)
		.nodes(nodes)
		.stop();

	for(let i = 0; i < 50; i ++){
		simulation.tick();
		self.postMessage({type:'tick'});
	}

	self.postMessage({
		type:'end',
		nodes,
		links
	});

});