import * as THREE from 'three';
import {randomNormal,pie} from 'd3';
const uuidv4 = require('uuid/v4');

//Fetch data
export const fetchData = () => {
	return new Promise((resolve, reject)=>{
		//TODO: placeholder for importing data
		//Generate 6000 random data points
		const data = Array.from({length:6000}).map((v,i)=>{
			return {
				id:uuidv4(),
				//pickingColor:[Math.random(),Math.random(),Math.random(),1]
			}
		});

		resolve(data);
	});
}

//Data layout functions
function WheelLayout(){

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
			scale.set(Math.random()*5+8, Math.random()*5+8, 10);
			transformMatrixSign.compose(position,rotation,scale);

			//For arrows
			z = Math.cos(theta)*(radius+rStdDev);
			y = Math.sin(theta)*(radius+rStdDev);

			position.set(x,y,z);
			rotation.setFromAxisAngle(X_AXIS, Math.PI/2-theta);
			scale.set(10,10,10);
			transformMatrixArrow.compose(position,rotation,scale);

			return {
				id:v.id,
				index:i,
				transformMatrixSign:transformMatrixSign.clone(),
				transformMatrixArrow:transformMatrixArrow.clone(),
				pickingColor: color.clone().setHex(i),
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

export {WheelLayout};