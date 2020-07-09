import React, {Component} from 'react';
import CKEditor from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import {getAuthTokens} from "../../utils/WildApricotOAuthUtils";
import {getEventById} from "../../utils/WildApricotEvents";
import {getContact} from "../../utils/WildApricotContacts";
import EventDataLoader from "../event-data-loader/EventDataLoader";
import {emptyEvent, searchForSessionAndAdjustFields} from "../EventCommon";
import "./EventEditor.css";
import DateTimeRange from "../date-time-range/DateTimeRange";

export default class EventEditor extends Component {
    constructor(props) {
        super(props);
        console.log("INCOMING PROPS", props);

        this.state = {
            event: emptyEvent(),
            isEditing: true,
            eventInfo: props.location.state.eventInfo,
            member: props.location.state.member,
            fetch: true
        }
        this.onSubmit = this.onSubmit.bind(this);
        this.onChangeEventLocation = this.onChangeEventLocation.bind(this);
        this.onChangeEventName = this.onChangeEventName.bind(this);
        this.startDateHandler = this.startDateHandler.bind(this);
        this.endDateHandler = this.endDateHandler.bind(this);
    }

    onSubmit(e) {
        e.preventDefault();

        let theEvent = Object.assign({}, this.state.event);
        console.log("SAVING EVENT", this.state, theEvent);
        // TODO: submit logic here

        this.setState({event: emptyEvent()});
    }

    onChangeEventName(e) {
        this.setState({event: {...this.state.event, Name: e.target.value }})
    }

    onChangeEventLocation(e) {
        this.setState({event:{...this.state.event, Location: e.target.value}})
    }

    async componentDidMount() {
        await getAuthTokens((data) => this.setState({waToken: data}));
        console.log("EVENT DETAILS", this.props.location.state);
        this.setState({
            member: this.props.location.state.member,
            eventInfo: this.props.location.state.eventInfo
        })

        console.log("STATE",this.state);
        // recurring event
        if (this.state.eventInfo.event && this.state.fetch) {   // user clicked on an event
            if (this.state.eventInfo.event.extendedProps.parentId && this.state.fetch) {
                await getEventById(this.state.waToken, this.state.eventInfo.event.extendedProps.parentId, (data) => {
                    this.setState({event: searchForSessionAndAdjustFields(data, this.state.eventInfo.event.id)});
                });
            } else {
                await getEventById(this.state.waToken, this.state.eventInfo.event.id, (data) => {
                    this.setState({event: data});
                });
            }
        } else if (this.state.eventInfo.date) {  // user clicked on a date to create event.
            this.setState({event: {...this.state.event, StartDate: new  Date(this.state.eventInfo.date)}})
        }
        this.setState({fetch:false});
        console.log('===>state', this.state);

        if (this.props.location.state.eventInfo.date) {
            let maxTime = new Date(this.props.location.state.eventInfo.date.getTime());
            this.setState({...this.state.event, startDate: this.props.location.state.eventInfo.date});
            this.setState({...this.state.event, endDate: new Date(maxTime.setHours(23,59,59))});
        }

        if (this.state.event && this.state.event.Details && this.state.event.Details.Organizer) {
            await getContact(this.state.waToken, this.state.event.Details.Organizer.Id, (data) => {
                this.setState({organizer: data});
                console.log("=====ORG", data, this.state.organizer);
            });
            console.log("contact", this.state.organizer);
        }
        console.log("state", this.state);
    }

    async startDateHandler(date) {
        await this.setState({startDate: date})
    }

    async endDateHandler(date) {
        await this.setState({endDate: date});
    }

    render() {
        if (this.state.fetch) {
            return <EventDataLoader name={this.props.location.state.name}/>;
        } else {
            return (
                <div className="App">
                     <div className="editor">
                        <form onSubmit={this.onSubmit}>
                            <div className="form-group">
                                <label>Event Id: </label>
                                {this.state.event.Id}
                            </div>
                            <div className="form-group">
                                <label>Event Name: </label>
                                <input type="text"
                                        className="form-control"
                                        value={this.state.event.Name}
                                        onChange={this.onChangeEventName}/>
                            </div>
                            <div className="form-group">
                                <DateTimeRange dateLabel="Event Date: "
                                               startLabel="Start Time: "
                                               endLabel="End Time: "
                                               endDate={this.state.endDate}
                                               startDate={this.state.startDate}
                                               onChangeStartDate={this.startDateHandler}
                                               onChangeEndDate={this.endDateHandler}/>
                            </div>
                            <div className="form-group">
                                <label>Event Location: </label>
                                <input type="text"
                                        className="form-control"
                                        value={this.state.event.Location}
                                        onChange={this.onChangeEventLocation}/>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <CKEditor
                                    editor={ ClassicEditor }
                                    data={this.state.event.Details.DescriptionHtml}
                                    onChange={ ( event, editor ) => {
                                        let details = this.state.event.Details;
                                        details.DescriptionHtml = editor.getData();
                                        this.setState({event: {...this.state.event, Details: details}});
                                    } }
                                />
                            </div>

                            <div className="form-group">
                                <input type="submit" value="Save Event" className="btn btn-primary" />
                            </div>

                        </form>
                    </div>
                </div>
            )
        }
    }

    handleStartChange = async (dt) => {
        await this.setState({date: {...this.state.date, date: dt}});
    }

}

