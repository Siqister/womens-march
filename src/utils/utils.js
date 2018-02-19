import * as THREE from 'three';
import {randomNormal,pie,json,csv} from 'd3';

//export * from './layout';

//Fetch data
export const fetchImageList = url => {
	return new Promise((resolve, reject)=>{
		json(url, (err,json)=>{
			if(err){
				reject(err);
			}else{
				resolve(json.frames.map((v,i)=>{
					v.id = v.filename.slice(0,-4);
					//FIXME dummy categorical attributes, remove
					v.attr1 = `value ${Math.ceil(Math.random()*3)}`;
					v.attr2 = `value ${Math.ceil(Math.random()*5)}`;
					//-FIXME

					return v;
				}));
			}
		});
	});
}

export const fetchLayout = url => new Promise((resolve, reject) => {
	csv(url, 
		d => {if(d.file) return {x:+d.x, y:+d.y, z:+d.z, id:d.file.slice(0,-4)}},
		(err,data)=>{
			if(err){
				reject(err);
			}else{
				resolve(data);
			}
		});
});

export const fetchMetadata = fileName => {
	return fetch(`https://mfw-data-interface.herokuapp.com/api/v1/image/${fileName}`);
}

export const fetchSprite = url => {
	return new Promise((resolve, reject)=>{
		const t = new THREE.TextureLoader()
			.load(url, 
				texture => {
					resolve(texture);
				},
				xhr => {},
				xhr => {
					reject(new Error('Error loading sprite image'));
				}
			);
	});
}

//Facet browser dimensions
export const facetBrowserDimensions = [
	{name:'Attribute 1', accessor:d=>d.attr1, type:'single'}, //FIXME: dummy
	{name:'Attribute 2', accessor:d=>d.attr2, type:'multiple'}, //FIXME: dummy
	//{name:'Frame X', accessor:d=>d.frame.x, type:'continuous'},
	//{name:'Frame Y', accessor:d=>d.frame.y, type:'continuous'}
];

//Vertices data
export const signVerticesArray = [
	-1.0, 1.0, 0,
	1.0, 1.0, .05,
	1.0, -1.0, 0,
	1.0, -1.0, 0,
	-1.0, -1.0, .05,
	-1.0, 1.0, 0
];
export const signNormalsArray = Array.from({length:6}).reduce(result => result.concat([0.0, 0.0, 1.0]), []);
export const signUvArray = [
	0,0,
	1,0,
	1,1,
	1,1,
	0,1,
	0,0
];
export const arrowVerticesArray = [
	-0.2, 0, 0.2,
	0, 0, -0.5,
	0.2, 0, 0.2
];