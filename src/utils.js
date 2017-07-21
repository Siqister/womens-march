const uuidv4 = require('uuid/v4');

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