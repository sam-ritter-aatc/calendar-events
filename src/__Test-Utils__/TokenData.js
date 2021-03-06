export const makeAToken = () => {
    return {
        "access_token" : "the access token",
        "token_type" : "Bearer",
        "expires_in" : 1800,
        "refresh_token" : "the refresh token",
        "Permissions" : [
            {
                "AccountId": 123456,
                "SecurityProfileId": 13136969,
                "AvailableScopes": [
                    "contacts_view",
                    "contacts_edit",
                    "contacts_membership_edit",
                    "finances_edit",
                    "finances_view",
                    "emails_view",
                    "emails_edit",
                    "events_view",
                    "events_edit",
                    "event_registrations_edit",
                    "event_registrations_view",
                    "account_view",
                    "membership_levels_view"
                ]
            }
        ]
    }
}