import React from "react";
import ReactDOM from "react-dom";
import ForceGraph from "./ForceGraph";
import About from './About';
import Consultations from './Consultations';
import Vince from './Vince';
import Feedback from './Feedback';
import Showcase from './Showcase';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import "./styles.css";

function App() {
  return (
       <BrowserRouter>
        <div>
            <Switch>
             <Route path="/" component={ForceGraph} exact/>
             <Route path="/about" component={About}/>
             <Route path="/consultations" component={Consultations}/>
             <Route path="/vince" component={Vince}/>
             <Route path="/showcase" component={Showcase}/>
             <Route path="/feedback" component={Feedback}/>
           </Switch>
        </div> 
      </BrowserRouter>

  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

