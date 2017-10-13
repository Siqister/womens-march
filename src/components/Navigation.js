import React, {Component} from 'react';

const NavigationStyle = {
	position:'fixed',
	top:'50%',
	padding:'0 15px',
	transform:'translate(0,-50%)'
};

class NavigationLink extends Component{

	constructor(props){

		super(props);

		this.state = {
			focus:false
		};

	}

	render(){

		const {focus} = this.state;
		const {colors, layoutComputing, desc, height, active, onClick} = this.props;

		return (
			<li 
				className='scene-navigation-link' 
				style={{
					height:height,
					background:focus?'black':'none',
					cursor:'pointer',
					transition:'background 200ms'
				}}
				onMouseEnter={() => {this.setState({focus:true}); }}
				onMouseLeave={() => {this.setState({focus:false}); }}
				onClick={onClick}
			>
				<svg className='target' style={{
					width:height,
					height:height,
					float:'left'
				}}>
					<circle 
						className='halo'
						cx={height/2}
						cy={height/2}
						r={focus?12:10}
						fill={colors[2]}
						fillOpacity={active||focus?1:0}
						style={{
							transition:'all 100ms'
						}}
					/>
					<circle 
						className='spinning'
						cx={height/2}
						cy={height/2}
						r={focus?12:10}
						fill='none'
						stroke={active&&layoutComputing?colors[1]:'none'}
						strokeWidth='2px'
						style={{strokeDasharray:`${Math.PI*19}px ${Math.PI*19}px`, animation:'spinning 500ms infinite'}}
					/>
					<circle
						className='center'
						cx={height/2}
						cy={height/2}
						r={3}
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
			</li>
		);

	}

}

const Navigation = ({scenes,colors,layoutComputing,currentScene,onSceneChange}) => {

	const links = scenes.map((v,i) => <NavigationLink 
			layoutComputing={layoutComputing}
			colors={colors}
			key={v.id}
			id={v.id}
			desc={v.desc}
			height={40}
			active={i===currentScene}
			onClick={()=>{onSceneChange(i)}}
		/>);

	return (
		<nav className='scene-navigation' style={NavigationStyle}>
			<ul>
				{links}
			</ul>
		</nav>
	)

}

export default Navigation;