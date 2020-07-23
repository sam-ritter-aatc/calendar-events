import React, {Component} from 'react';
import {Button} from 'react-bootstrap-buttons';
import {getAuthTokens} from "../../utils/WildApricotOAuthUtils";
import {getEventById} from "../../utils/WildApricotEvents";
import EventDataLoader from "../event-data-loader/EventDataLoader";
import {getContact} from "../../utils/WildApricotContacts";
import "./EventDisplay.css";
import {searchForSessionAndAdjustFields, buildRedirect} from "../EventCommon";
import {getRegistrationsForEventId, registerUserForEventId, unregisterFromEvent, addGuestToRegistration} from "../../utils/WildApricotRegistrations";
import renderHTML from "react-render-html";

export default class EventDisplay extends Component {
    state = {
        fetch: true,
        eventId: '',
        waToken: {},
        url: '',
        event: null,
        organizer: null,
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
        if (this.state.eventInfo.event.extendedProps.parentId && this.state.fetch) {
            await getEventById(this.state.waToken, this.state.eventInfo.event.extendedProps.parentId, (data) => {
                this.setState({event: searchForSessionAndAdjustFields(data, this.state.eventInfo.event.id),});
            });
        } else {
            await getEventById(this.state.waToken, this.state.eventInfo.event.id, (data) => {
                this.setState({event: data});
            });
        }
        await getRegistrationsForEventId(this.state.waToken, this.state.eventInfo.event.id, (data) => {
            let regArray = data.map((reg) => this.convertRegistrationData(reg))
            this.setState({registrations: regArray});
        })
        this.setState({fetch:false});
        console.log('state', this.state);

        if (this.state.event && this.state.event.Details && this.state.event.Details.Organizer) {
            await getContact(this.state.waToken, this.state.event.Details.Organizer.Id, (data) => {
                this.setState({organizer: data});
                console.log("=====ORG", data, this.state.organizer);
            });
            console.log("contact", this.state.organizer);
        }
        console.log("state", this.state);
        console.log("CAN EDIT", this.canEdit());
    }

    convertRegistrationData(reg) {
        console.log("CONVERT REG", reg);
        return {
            regId: reg.Id,
            memberId: reg.Contact.Id,
            eventId: reg.Event.Id,
            name: reg.DisplayName,
            message: reg.Memo,
            numGuests: reg.GuestRegistrationsSummary.NumberOfGuests,
            dateRegistered: reg.RegistrationDate
        }
    }

    handleEditClick() {
        this.setState({editEvent: true});
    }

    canEdit() {
        return  this.state.member && this.state.eventInfo.event.extendedProps.parentId === undefined && (
            this.state.member.isAdmin
            || (this.state.event.Details && this.state.event.Details.Organizer && this.state.member.id === this.state.event.Details.Organizer.Id)
        )
    }

    notAlreadyRegistered() {
        return this.state.member && this.state.registrations.filter( x => this.state.member.id === x.memberId).length === 0
    }

    async handleRegisterClick() {
        await registerUserForEventId(this.state.waToken, this.state.event.Id, this.state.member.id, (data) => {
            console.log("registration response", data);
            this.setState( state => {
                const registrations = [this.convertRegistrationData(data), ...state.registrations];
                return {
                    registrations
                }
            });
        });
    }

    async handleUnRegisterClick(regId) {
        await unregisterFromEvent(this.state.waToken, regId, (data) => {});
        this.setState( state => {
            const registrations = state.registrations.filter(reg => reg.regId !== regId);
            return {
                registrations
            }
        })
    }

    async handleAddGuest(regId) {
        let reg = this.findRegistrationByRegId(regId);
        await addGuestToRegistration(this.state.waToken, reg, (data) => {
            console.log("ADDED GUEST", data);
            this.setState(state => {
                console.log("REGISTRATION convertedDAta", this.convertRegistrationData(data));
                const registrations = state.registrations.map((item) => {
                    return item.regId === regId ? this.convertRegistrationData(data) : item;
                });
                console.log("REGISTRATION", registrations);

                return {
                    registrations
                };
            })
        });
        console.log("STATE", this.state);
    }

    async handleAddMessage() {

    }

    findRegistrationByRegId(regId) {
        let regArray = this.state.registrations.filter(reg => reg.regId === regId);
        if (regArray.length === 1) {
            return regArray[0];
        } else {
            return null;
        }
    }

    renderRegistrationData() {
        return this.state.registrations.map( (reg, index) => {
            const { regId, memberId, name, message, numGuests, dateRegistered} = reg;
            return <tr key={regId}>
                <td>{regId}</td>
                <td>{name}</td>
                <td>{numGuests}</td>
                <td>{dateRegistered}</td>
                <td>{message}</td>
                <td style={{display:'inline-block'}}>
                    {memberId===this.state.member.id && <Button xs btnStyle="danger" onClick={() => this.handleUnRegisterClick(regId) }>Unregister</Button> }
                    {memberId===this.state.member.id && <Button xs btnStyle="secondary" onClick={() => this.handleAddGuest(regId)}>Add Guest</Button> }
                    {memberId===this.state.member.id && <Button xs btnStyle="secondary" onClick={() => this.handleAddMessage(regId)}>Add/Edit Message</Button> }
                </td>
            </tr>
        })
    }

    render() {
        if (this.state.fetch) {
            return (<EventDataLoader name={this.props.location.state.name}/>);
        } else if (this.state.editEvent) {
            return buildRedirect('editEvent', this.state.member, this.state.eventInfo);
        } else {
            return (
                <div>
                    {this.canEdit() && <Button xs btnStyle="primary" onClick={() => this.handleEditClick()}>Edit Event</Button>}
                    {this.notAlreadyRegistered() && <Button xs btnStyle="success" onClick={() => this.handleRegisterClick()}>RSVP</Button>}
                    <h2>{this.state.event.Name}</h2>
                    <div className="event_id">
                        <label>Event Id: </label>
                        {this.state.event.Id}
                    </div>
                    <div className="event-title">
                        <label>Event Name: </label>
                        {this.state.event.Name}
                    </div>
                    <div className="event-start">
                        <label>Event Start Date/Time: </label>
                        {this.state.event.StartDate}
                    </div>
                    <div className="event-end">
                        <label>Event End Date/Time: </label>
                        {this.state.event.EndDate}
                    </div>
                    <div className="location">
                        <label>Event Location: </label>
                        {this.state.event.Location}
                    </div>

                    {this.state.organizer && <div className="organizer">
                        <label>Organizer: </label>
                        {this.state.organizer.displayName + '(' + this.state.organizer.email + ')'}
                    </div>}

                    <div className="descriptionHtml">
                        <label>Description: </label><br/>
                        <div>{renderHTML(this.state.event.Details.DescriptionHtml)}</div>
                    </div>

                    <div className="registrations">
                        <label>Registrations: </label><br/>
                        <table id='registrations' className="table-striped">
                            <tbody>
                                <tr>
                                    <th scope="col">Registration Id</th>
                                    <th scope="col">Name</th>
                                    <th scope="col">#Guests</th>
                                    <th scope="col">Date Registered</th>
                                    <th scope="col">Message</th>
                                    <th scope="col"></th>
                                </tr>
                                {this.renderRegistrationData()}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
    }
}