using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace TheWedding.Api;

public static class ApiExtensions
{
    public static Guid UserId(this ClaimsPrincipal principal)
    {
        var subClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(subClaim, out var userId) ? userId : Guid.Empty;
    }

    public static Guid TokenId(this ClaimsPrincipal principal)
    {
        var jtiClaim = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
        return Guid.TryParse(jtiClaim, out var tokenId) ? tokenId : Guid.Empty;
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