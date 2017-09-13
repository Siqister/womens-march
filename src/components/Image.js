import React from 'react';
import {CSSTransitionGroup} from 'react-transition-group';

import {animatedButton, LoadingIndicator} from './ui';
import NavigationBefore from 'material-ui/svg-icons/image/navigate-before';
import NavigationAfter from 'material-ui/svg-icons/image/navigate-next';
import Close from 'material-ui/svg-icons/navigation/close';

const color = 'rgb(80,80,80)';

const imageDetailStyle = {
	position:'absolute',
	width:'100%',
	bottom:'25%',
	top:'25%',
	pointerEvents:'none'
}

const imageDetailListItemStyle = {
	color:`${color}`,
	background:'rgb(255,255,255)',
	display:'inline'
}

const buttonContainerStyle = {
	position:'absolute',
	width:160,
	height:50,
	top:'100%',
	left:'50%',
	transform:'translate(-50%,-20px)',
	pointerEvents:'auto'
}

const PrevButton = animatedButton(NavigationBefore);
const NextButton = animatedButton(NavigationAfter);
const ExitButton = animatedButton(Close);

const ImageDetailListItem = props => {
	return <li>
		<span style={imageDetailListItemStyle}>
			<span style={{fontSize:'.6em', display:'block'}}>{props.id.toUpperCase()}</span>
			<span style={{fontSize:'1.3em', padding:'10px', boxSizing:'border-box'}}>{JSON.stringify(props.data[props.id])}</span>
		</span>
	</li>
}

const Image = props => {

	return (
		<div className='image-detail'
			style={imageDetailStyle}
		>
			<div className='container'>
				<ul className='image-detail-list'>
					<CSSTransitionGroup
						transitionName='image-detail-list'
						transitionAppear={true}
						transitionAppearTimeout={300}
						transitionEnterTimeout={300}
						transitionLeaveTimeout={300}
					>
						<ImageDetailListItem data={props.data} id='id' key='id'/>
						<ImageDetailListItem data={props.data} id='rotated' key='rotated'/>
					</CSSTransitionGroup>
				</ul>
			</div>
			<div className='button-container'
				style={buttonContainerStyle}>
				<PrevButton disabled={props.loading} url={`/images/${props.prev}`}/>
				{props.loading&&<LoadingIndicator />}
				{!props.loading&&<ExitButton centered url='/'/>}
				<NextButton disabled={props.loading} pullRight url={`/images/${props.next}`}/>
			</div>
		</div>
	);
}

export default Image;