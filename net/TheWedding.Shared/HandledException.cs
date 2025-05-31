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

    public static HandledException NotFound(string message = "") => new(message, HttpStatusCode.NotFound);

    public static HandledException BadRequest(string message = "") => new(message, HttpStatusCode.BadRequest);

    public static HandledException Unauthorized(string message = "") => new(message, HttpStatusCode.Unauthorized);

    public static HandledException Forbidden(string message = "") => new(message, HttpStatusCode.Forbidden);

    public HandledExceptionDto ToDto => new(Message, (int)StatusCode);
}

public record HandledExceptionDto(string Message, int Status);
