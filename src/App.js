import React from 'react';
import { HashRouter, Route } from 'react-router-dom';
//import logo from './logo.svg';
import './App.css';
import EventCalendar from "./components/event-calendar/EventCalendar";
import EventDisplay from "./components/event-display/EventDisplay";
import EventEditor from "./components/event-edit/EventEditor";

function App() {
  return (
    <div className="App">
        <HashRouter basename="/">
            <Route exact path="/:memberId" component={EventCalendar} />
            <Route exact path="/" component={EventCalendar} />
            <Route exact path="/showEvent" component={EventDisplay} />
            <Route exact path="/editEvent" component={EventEditor} />
        </HashRouter>
      {/*<EventCalendar />*/}
    </div>
  );
}

export default App;
