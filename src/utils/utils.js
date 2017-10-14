import * as THREE from 'three';
import {randomNormal,pie,json} from 'd3';

//export * from './layout';

//Fetch data
export const fetchImageList = () => {
	return new Promise((resolve, reject)=>{
		json('/assets/all_images.json',(err,json)=>{
			if(err){
				reject(err);
			}else{
				resolve(json.frames.map((v,i)=>{
					v.id = v.filename;
					v.index = i;
					return v;
				}));
			}
		});
	});
}

export const fetchMetadata = fileName => {
	return fetch(`https://mfw-data-interface.herokuapp.com/api/v1/image/${fileName}`);
}

export const fetchSprite = () => {
	return new Promise((resolve, reject)=>{
		const t = new THREE.TextureLoader()
			.load('/assets/all_images_sprite_4096.png', 
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