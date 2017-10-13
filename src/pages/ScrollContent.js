import React from 'react';

import Scene from '../components/Scene';
import FacetBrowser from '../components/FacetBrowser';
import Intro from '../pages/Intro';

const ScrollContent = props => {

	const vizStateScenes = props.scenes.map((v,i) => {
		return <Scene
			height={props.height*2}
			onSceneEnter={()=>{props.onSceneChange(i)}}
			key={v.id}
		/>
	});

	return <div className='scroll-content' style={{pointerEvents:'none'}}>
		<Scene>
			<Intro colors={props.colors}/>
		</Scene>
		{vizStateScenes}
		<Scene>
			<FacetBrowser />
		</Scene>
	</div>

}

export default ScrollContent;