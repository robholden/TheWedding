using System.Text.Json;

using TheWedding.Shared;

namespace TheWedding.Api.Exceptions;

public class ExceptionHandler
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandler> _logger;

    private static readonly JsonSerializerOptions _serializerOptions = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public ExceptionHandler(RequestDelegate next, ILogger<ExceptionHandler> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // Call the next middleware in the pipeline
            await _next(context);
        }
        catch (Exception ex)
        {
            if (ex is HandledException handledEx)
            {
                _logger.LogError("Handled Exception => {Message} [{StatusCode}]", ex.Message, handledEx.StatusCode);
            }
            else
            {
                handledEx = HandledException.Unhandled();
                _logger.LogError(ex, "An error occurred while processing the request.");
            }

            context.Response.StatusCode = (int)handledEx.StatusCode;
            context.Response.ContentType = "application/json";
            var result = JsonSerializer.Serialize(handledEx.ToDto, _serializerOptions);
            await context.Response.WriteAsync(result);
        }
    }
}
