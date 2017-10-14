import React from 'react';

import Scene from '../components/Scene';
import FacetBrowser from '../components/FacetBrowser';
import Intro from '../pages/Intro';

const ScrollContent = props => {

	const lastScene = props.scenes.length - 1;

	const vizStateScenes = props.scenes.map((v,i) => {
		return <Scene
			id={v.id}
			height={i===lastScene?props.height:props.height*2}
			onSceneEnter={()=>{props.onSceneChange(i)}}
			key={v.id}
		>
			{(i===lastScene)&&<FacetBrowser />}
		</Scene>
	});

	return <div className='scroll-content' style={{pointerEvents:'none'}}>
		<Scene id='intro'>
			<Intro colors={props.colors}/>
		</Scene>
		{vizStateScenes}
	</div>

}

export default ScrollContent;