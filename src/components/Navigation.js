import React, {Component} from 'react';

import Scrollspy from 'react-scrollspy';

const NavigationStyle = {
	position:'fixed',
	top:'50%',
	transform:'translate(0,-50%)'
};

class NavigationLink extends Component{

	constructor(props){

		super(props);

		this.state = {
			focus:false,
			marginLeft:-50
		};

	}

	componentDidMount(){

		this.setState({
			marginLeft:0
		});

	}

	render(){

		const {focus, marginLeft} = this.state;
		const {colors, layoutComputing, desc, active, size, sequence} = this.props;
		const width = size, height = size;
		const radiusInner = 3, radiusOuter = 10;

		return (
			<li 
				className='scene-navigation-link' 
				style={{
					height:height,
					cursor:'pointer',
					marginLeft,
					transition:`margin-left 1s ${sequence*200}ms`
				}}
				onMouseEnter={() => {this.setState({focus:true}); }}
				onMouseLeave={() => {this.setState({focus:false}); }}
			>
				<a href={`#${this.props.id}`}>
					<svg className='target' style={{
						width:width,
						height:height,
						float:'left'
					}}>
						<circle 
							className='halo'
							cx={width/2}
							cy={height/2}
							r={focus?radiusOuter+2:radiusOuter}
							fill={colors[2]}
							fillOpacity={active||focus?1:0}
							style={{
								transition:'all 100ms'
							}}
						/>
						<circle 
							className='spinning'
							cx={width/2}
							cy={height/2}
							r={focus?radiusOuter+2:radiusOuter}
							fill='none'
							stroke={active&&layoutComputing?colors[1]:'none'}
							strokeWidth='2px'
							style={{strokeDasharray:`${Math.PI*19}px ${Math.PI*19}px`, animation:'spinning 500ms infinite'}}
						/>
						<circle
							className='center'
							cx={width/2}
							cy={height/2}
							r={radiusInner}
							fill={colors[0]}
						/>
					</svg>
					<span
						style={{
							lineHeight:`${height}px`,
							height:height,
							float:'left',
							padding:'0 5px',
							color:colors[0],
							visibility:focus?'visible':'hidden',
							fontSize:'16px'
						}}
					>
						{desc}
					</span>
				</a>
			</li>
		);

	}

}

const Navigation = ({scenes,colors,layoutComputing,currentScene,onSceneChange,initialDataLoaded}) => {

	const links = scenes.map((v,i) => <NavigationLink 
			layoutComputing={layoutComputing}
			colors={colors}
			key={v.id}
			id={v.id}
			sequence={i}
			desc={v.desc}
			size={40}
			active={i===currentScene}
		/>);

	const idToIndex = scenes.reduce((acc,v,i)=>{
			acc[v.id] = i;
			return acc;
		},{});

	return (
		<nav className='scene-navigation' style={NavigationStyle}>
			<Scrollspy 
				items={scenes.map(v => v.id)} 
				onUpdate={(...args) => {
					if(args[0]&&idToIndex[args[0].id]>-1){
						onSceneChange( idToIndex[args[0].id] );
					}
				}}>
				{initialDataLoaded&&links}
			</Scrollspy>
		</nav>
	);

}

export default Navigation;