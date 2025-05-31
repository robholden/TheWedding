using System.Security.Claims;

namespace TheWedding.Api;

public static class ApiExtensions
{
    public static int UserId(this ClaimsPrincipal principal)
    {
        return int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier));
    }

    public static bool TryGetHeader(this HttpContext context, string key, out string value)
    {
        value = string.Empty;
        if (context?.Request?.Headers == null)
            return false;

        if (context.Request.Headers.TryGetValue(key, out var v))
            value = v;

        return !string.IsNullOrEmpty(value);
    }

    public static string IpAddress(this HttpContext context)
    {
        return context.Request.Headers["X-Forwarded-For"].FirstOrDefault() ?? context.Connection.RemoteIpAddress.ToString();
    }
}