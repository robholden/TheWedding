using System.Net;

namespace TheWedding.Shared;

public class HandledException : Exception
{
    public HttpStatusCode StatusCode { get; set; }

    public HandledException(string message, HttpStatusCode statusCode) : base(message)
    {
        StatusCode = statusCode;
    }

    public HandledException(string message = "") : this(message, HttpStatusCode.BadRequest) { }

    public static HandledException NotFound(ErrorKeys key) => new(key.GetDescription(), HttpStatusCode.NotFound);

    public static HandledException BadRequest(ErrorKeys key) => new(key.GetDescription(), HttpStatusCode.BadRequest);

    public static HandledException Unauthorized(ErrorKeys key) => new(key.GetDescription(), HttpStatusCode.Unauthorized);

    public static HandledException Forbidden(ErrorKeys key) => new(key.GetDescription(), HttpStatusCode.Forbidden);

    public static HandledException Unhandled() => new(ErrorKeys.Unknown.GetDescription(), HttpStatusCode.InternalServerError);

    public HandledExceptionDto ToDto => new(Message, (int)StatusCode);
}

public record HandledExceptionDto(string Message, int Status);
