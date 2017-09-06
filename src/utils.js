import * as THREE from 'three';
import {randomNormal,pie,json} from 'd3';

//Fetch data
export const fetchImageList = () => {
	return new Promise((resolve, reject)=>{
		json('./assets/all_images.json',(err,json)=>{
			if(err){
				reject(err);
			}else{
				resolve(json.frames.map(v=>{
					v.id = v.filename;
					return v;
				}));
			}
		});
	});
}

export const fetchMetadata = () => {
	return fetch('https://mfw-data-interface.herokuapp.com/api/v1/images?limit=1000');
}

export const fetchSprite = () => {
	return new Promise((resolve, reject)=>{
		const t = new THREE.TextureLoader()
			.load('./assets/all_images_sprite_4096.png', 
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

//Data layout functions
function WheelLayout(){

/*	WheelLayout:
	Constructs a layout that, given an array, returns a new array of instances, with positions at polor coordinate (x,r), randomized by standard deviation
*/
	let x = 0, xStdDev = 0;
	let r = 0, rStdDev = 0;
	let randomX, randomR;
	let groupByAccessor = null;

	const position = new THREE.Vector3();
	const rotation = new THREE.Quaternion();
	const scale = new THREE.Vector3();
	const transformMatrixSign = new THREE.Matrix4();
	const transformMatrixArrow = new THREE.Matrix4();
	const color = new THREE.Color();

	const X_AXIS = new THREE.Vector3(1,0,0);
	const pieLayout = pie().padAngle(Math.PI/180*15).value(v=>v[1]);
	let layout;

	function exports(data){

		//If the wheel needs to be sorted, create a d3.pie layout to distribute theta
		if(groupByAccessor){
			const groups = data.map(groupByAccessor)
				.reduce((result,value)=>{
					if(result[value]==undefined){
						result[value] = 0;
					}else{
						result[value] += 1;
					}
					return result;
				},{}) //reduce to a map of unique values

			layout = pieLayout(Object.entries(groups))
				.reduce((result,value)=>{
					result[value.data[0]] = value;
					return result;
				},{});
		}

		return data.map((v,i)=>{

			//Texture mapping-related
			const {frame} = v;

			//Position-related
			const radius = randomR();
			let theta;
			if(groupByAccessor){
				const {startAngle, endAngle, padAngle} = layout[groupByAccessor(v,i)];
				theta = Math.random()*(endAngle-padAngle-startAngle) + startAngle;
			}else{
				theta = Math.random()*Math.PI*2;
			}

			//For signs: per instance position, rotation, and scale
			let z = Math.cos(theta)*radius;
			let y = Math.sin(theta)*radius;
			const x = randomX();

			position.set(x,y,z);
			rotation.setFromAxisAngle(X_AXIS, Math.PI/2-theta-Math.PI/8*(Math.random()*.5+1));
			scale.set(frame.w/10, frame.h/10, 10);
			transformMatrixSign.compose(position,rotation,scale);

			//For arrows
			z = Math.cos(theta)*(radius+rStdDev);
			y = Math.sin(theta)*(radius+rStdDev);

			position.set(x,y,z);
			rotation.setFromAxisAngle(X_AXIS, Math.PI/2-theta);
			scale.set(7,7,7);
			transformMatrixArrow.compose(position,rotation,scale);

			//Per instance datum
			return {
				id:v.id,
				index:i,
				transformMatrixSign:transformMatrixSign.clone(),
				transformMatrixArrow:transformMatrixArrow.clone(),
				pickingColor: color.clone().setHex(i),
				textureUvOffset: [(frame.x+2)/2/4096, (frame.y+2)/2/4096], //FIXME: hardcoded
				textureUvSize: [(frame.w-4)/2/4096, (frame.h-4)/2/4096], //FIXME: hardcoded
				x,
				theta,
				radius
			};
		});

	}

	//Getter and setter
	exports.x = function(value, stdDev){
		x = value;
		xStdDev = stdDev;
		randomX = randomNormal(x, xStdDev);
		return this;
	}

	exports.r = function(value, stdDev){
		r = value;
		rStdDev = stdDev;
		randomR = randomNormal(r, rStdDev);
		return this;
	}

	exports.groupBy = function(accessor){
		groupByAccessor = accessor;
		return this;
	}

	return exports;
}


//FIXME: math is off
function TileLayout(){

	let x = 0, xStdDev = 0;
	let r = 0, rStdDev = 0;
	let randomX, randomR;
	let groupByAccessor = null;

	const position = new THREE.Vector3();
	const rotation = new THREE.Quaternion();
	const scale = new THREE.Vector3();
	const transformMatrixSign = new THREE.Matrix4();
	const transformMatrixArrow = new THREE.Matrix4();
	const color = new THREE.Color();

	function exports(data){

		return data.map((v,i)=>{

			//Texture mapping-related
			const {frame} = v;

			position.set(frame.x/10, frame.y/10, 0);
			scale.set(frame.w/10, frame.h/10, 10);
			transformMatrixSign.compose(position, rotation, scale);

			position.set(frame.x/10, frame.y/10, 10);
			scale.set(7,7,7);
			transformMatrixArrow.compose(position, rotation, scale);

			return {
				id:v.id,
				index:i,
				transformMatrixSign:transformMatrixSign.clone(),
				transformMatrixArrow:transformMatrixArrow.clone(),
				pickingColor: color.clone().setHex(i),
				textureUvOffset: [(frame.x+2)/2/4096, (frame.y+2)/2/4096], //FIXME: hardcoded
				textureUvSize: [(frame.w-4)/2/4096, (frame.h-4)/2/4096] //FIXME: hardcoded
			};

		});

	}

	return exports;
}

function SphereLayout(){

/*	SphereLayout:
	Constructs a layout that, given array, returns new array of instances arranged as a sphere with radius r, oriented towards center
*/
	let r = 0;

	const position = new THREE.Vector3();
	const rotation = new THREE.Quaternion();
	const scale = new THREE.Vector3();
	const transformMatrixSign = new THREE.Matrix4();
	const transformMatrixArrow = new THREE.Matrix4();
	const color = new THREE.Color();

	const center = new THREE.Vector3(0,0,0);
	const up = new THREE.Vector3();
	const X_AXIS = new THREE.Vector3(1,0,0);

	function exports(data){
		const LNG_BANDS = Math.ceil(Math.sqrt(data.length)); 
		const LAT_BANDS = Math.ceil(data.length/LNG_BANDS);

		//Compute position based on theta (lat) and phi (lng)
		const sphericalNormals = []; //array of possible spherical normals in (x,y,z)

		for(let lat=0; lat<=LAT_BANDS; lat++){
			const theta = lat*Math.PI/LAT_BANDS; //TODO: range may be <180deg
			const sinTheta = Math.sin(theta);
			const cosTheta = Math.cos(theta);

			for(let lng=0; lng<=LNG_BANDS*(sinTheta*1.56); lng++){
				const phi = lng*Math.PI*2/(LNG_BANDS*(sinTheta*1.56)); //TODO: range may be < 360deg FIXME: hardcoded fudge constant
				const sinPhi = Math.sin(phi);
				const cosPhi = Math.cos(phi);

				const sphericalNormal = [cosPhi*sinTheta, cosTheta, sinPhi*sinTheta];
				sphericalNormals.push(sphericalNormal);
			}
		} 

		return data.map((v,i)=>{

			//Texture-mapping related
			const {frame} = v;

			//Construct per instance transform matrices 
			const instanceNormal = sphericalNormals[i];
			const instanceR = r + Math.random()*40-20;
			let instancePosition = instanceNormal.map(v=>v*instanceR);
			const rotationMat4 = new THREE.Matrix4();

			position.set(...instancePosition);

			up.set(Math.random()*.6-.3, 1, 0).normalize();
			rotationMat4.lookAt(position, center, up);
			
			scale.set(frame.w/8, frame.h/8, 10);
			transformMatrixSign.compose(position, rotation, scale);
			transformMatrixSign.multiply(rotationMat4);

			instancePosition = instanceNormal.map(v=>v*(instanceR-10));
			position.set(...instancePosition);
			rotation.setFromAxisAngle(X_AXIS, Math.PI*2);
			scale.set(7,7,7);
			transformMatrixArrow.compose(position, rotation, scale);
			transformMatrixArrow.multiply(rotationMat4);

			return {
				id:v.id,
				index:i,
				transformMatrixSign:transformMatrixSign.clone(),
				transformMatrixArrow:transformMatrixArrow.clone(),
				pickingColor: color.clone().setHex(i),
				textureUvOffset: [(frame.x+2)/2/4096, (frame.y+2)/2/4096], //FIXME: hardcoded
				textureUvSize: [(frame.w-4)/2/4096, (frame.h-4)/2/4096] //FIXME: hardcoded
			};

		});

	}

	exports.r = function(value){
		r = value;
		return this;
	}

	return exports;
}

export {WheelLayout, TileLayout, SphereLayout};

//Vertices data
const signVerticesArray = [
	-1.0, 1.0, 0,
	1.0, 1.0, .05,
	1.0, -1.0, 0,
	1.0, -1.0, 0,
	-1.0, -1.0, .05,
	-1.0, 1.0, 0
];
const signUvArray = [
	0,0,
	1,0,
	1,1,
	1,1,
	0,1,
	0,0
];
const arrowVerticesArray = [
	-0.2, 0, 0.2,
	0, 0, -0.5,
	0.2, 0, 0.2
];

export {signVerticesArray, signUvArray, arrowVerticesArray};