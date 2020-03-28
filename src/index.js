import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './js/App';
import * as serviceWorker from './js/serviceWorker';

import { BrowserRouter as Router } from 'react-router-dom';
import { Route, Switch, Redirect } from "react-router-dom";

ReactDOM.render(
    <Router>
        <Switch>
            <Redirect from="/" exact to="/en"/>
            <Route path="/:language" exact component={App} />
        </Switch>
    </Router>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();