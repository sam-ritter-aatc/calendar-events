import React, {Component} from 'react';
import {getAuthTokens} from "../../utils/WildApricotOAuthUtils";
import {getEvents} from '../../utils/WildApricotEvents';
import eventConvert from '../../utils/WildApricotConversions';

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction' // needed for dayClick
import bootstrapPlugin from "@fullcalendar/bootstrap";
import listPlugin from '@fullcalendar/list';
import {Redirect} from 'react-router-dom';
import queryString from 'query-string';

import "./EventCalendar.css";
import {getContact} from "../../utils/WildApricotContacts";


export default class EventCalendar extends Component {
    calendarComponentRef = React.createRef()

    state = {
        events: [],
        member: null,
        calendarWeekends: true,
        waToken: {},
        showEvent: false,
        editEvent: false
    }

    async componentDidMount() {
        const queryStringValues = queryString.parse(this.props.location.search);
        console.log("QUERY_PARAMS", this.props.location.search,queryStringValues);
        let firstDate = new Date();
        firstDate.setFullYear(firstDate.getFullYear() - 1);
        firstDate.setMonth(firstDate.getMonth() - 6);
        console.log("FIRST DATE", firstDate)

        await getAuthTokens((data) => this.setState({waToken: data}));
        if ( queryStringValues.mid && queryStringValues.mid !== "0") {
            await getContact(this.state.waToken, queryStringValues.mid, (contact) => {this.setState({member: contact})})
            console.log("Retrieve Member", this.state.member);
        }
        await getEvents(this.state.waToken, firstDate.toISOString(), (data) => {
            var myEvents = eventConvert(data).map((event) => {
                return {
                    id: event.Id,
                    title: event.Name.replace("Weekly Workout - ", "")
                        .replace("Weekly Workout- ",""),  // shorten string in event
                    start: event.StartDate,
                    end: event.EndDate,
                    Url: event.Url,
                    Tags: event.Tags,
                    backgroundColor: this.getEventColor(event),
                    parentId: event.parentId
                }
            });
            this.setState({events: myEvents});
        });
    }

    fixEventName(name) {
        return name;
    }

    getEventColor(event) {
        if ( /Race/.test(event.Name) ) {
            return 'red'
        }
        return 'blue';
    }

    buildRedirect(path) {
        return <Redirect to={{
            pathname: path,
            state: {
                member: this.state.member,
                eventInfo: this.state.eventInfo
            }
        }} push/>
    }

    render() {
        if (this.state.showEvent) {
            return this.buildRedirect('showEvent');
        }
        if (this.state.editEvent) {
            return this.buildRedirect('editEvent');
        }
        return (
            <div className='EventCalendar'>
                <FullCalendar
                    defaultView="dayGridMonth"
                    firstDay={1}
                    fixedWeekCount={false}
                    header={{
                        left: 'prev today next',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,listMonth'
                    }}
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, bootstrapPlugin]}
                    themeSystem="bootstrap"
                    displayEventTime={true}
                    selectable={true}
                    ref={this.calendarComponentRef}
                    weekends={this.state.calendarWeekends}
                    events={this.state.events}
                    dateClick={this.handleDateClick}
                    eventClick={this.handleEventClick}
                />
                <button onClick={this.createEvent}>Create Event</button>
            </div>
        )
    }

    createEvent = () => {
        this.setState({editEvent: true, eventInfo: {}})
    }

    handleEventClick = (arg) => {
        console.log("going to event", arg);
        this.setState({showEvent: true, eventInfo: arg});
    }

    handleDateClick = (e) => {
        console.log("DATE CLICKED", e);
        this.setState({editEvent: true, eventInfo: e});
    }
}