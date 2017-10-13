import React from 'react';
import {Link} from 'react-router-dom';

//ANIMATED BUTTON HOC
const animatedButton = Component => class extends React.Component{

	constructor(props){
		super(props);

		this.state = {
			color:'rgb(120,120,120)'
		}

		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
	}

	handleMouseEnter(){
		this.outerCircle.style.strokeDasharray = `${Math.PI*2*19}px ${Math.PI*2*19}px`;
		this.setState({
			color:'rgb(50,50,50)'
		});
	}

	handleMouseLeave(){
		this.outerCircle.style.strokeDasharray = `0px ${Math.PI*2*19}px`;
		this.setState({
			color:'rgb(120,120,120)'
		});
	}

	render(){

		const style = {};
		if(this.props.centered){
			style.left = '50%';
			style.position = 'absolute';
			style.transform = 'translate(-50%)';
		} 
		if(this.props.pullRight){
			style.float = 'right';
		}

		const {disabled,onClick,url} = this.props;

		return (<button 
				style={style}
				onMouseEnter={this.handleMouseEnter}
				onMouseLeave={this.handleMouseLeave}
				onClick={onClick}
				disabled={disabled}
			>
				<Link to={{pathname:url}}>
				<svg width={40} height={40} style={{position:'absolute'}}>
					<circle cx={20} cy={20} r={19} fill='rgba(255,255,255,.01)' stroke={disabled?'rgb(120,120,120)':'rgb(120,120,120)'} strokeWidth='2px'/>
					<circle cx={20} cy={20} r={19} fill='none' stroke={disabled?'rgb(120,120,120)':'rgb(50,50,50)'} strokeWidth='2px' 
						ref={node=>{this.outerCircle=node}}
						style={{transition:'stroke-dasharray 500ms', strokeDasharray:`0px ${Math.PI*2*19}px`}}
					/>
				</svg>
				<Component style={{margin:8}} color={disabled?'rgb(120,120,120)':this.state.color}/>
				</Link>
		</button>);

	}

}

export default animatedButton;