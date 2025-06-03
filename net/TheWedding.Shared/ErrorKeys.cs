using System.ComponentModel;

namespace TheWedding.Shared;

public enum ErrorKeys
{
    [Description("unknown")]
    Unknown,
    [Description("rsvp_missing")]
    RsvpNotMatched,
    [Description("user_not_found")]
    UserNotFound,
    [Description("user_disabled")]
    UserDisabled,
    [Description("session_expired")]
    SessionExpired
}