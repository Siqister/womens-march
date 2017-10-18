import React from 'react';
import {render} from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import {
	BrowserRouter as Router,
	Route,
	Switch
} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory';

import App from './components/App';

import 'bootstrap/dist/css/bootstrap.css';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import './stylesheet/main.css';

//const history = createBrowserHistory();
injectTapEventPlugin();

render(
	<Router>
		<MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
			<Switch>
				<Route path='/images/:index?' component={App} />
				<Route component={App} />
			</Switch>
		</MuiThemeProvider>
	</Router>, 
	document.getElementById('root'));

