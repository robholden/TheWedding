using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;

using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

using TheWedding.Shared;

namespace TheWedding.Api.Auth;

public class BasicAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly AppSettings _settings;

    public BasicAuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder, IOptions<AppSettings> appOptions) : base(options, logger, encoder)
    {
        _settings = appOptions.Value;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check if the request contains the custom X-User header
        var authHeader = "";
        if (Request.Headers.TryGetValue("X-User", out var value1))
        {
            authHeader = value1.ToString();
        }

        // Check if the request contains the Authorization header
        else if (Request.Headers.TryGetValue("Authorization", out var value2))
        {
            authHeader = value2.ToString();
        }

        // Handle basic auth header only
        if (authHeader?.StartsWith("basic", StringComparison.OrdinalIgnoreCase) != true)
        {
            Response.StatusCode = StatusCodes.Status401Unauthorized;
            Response.Headers.Append("WWW-Authenticate", "Basic realm=\"reshandrob.net\"");
            return Task.FromResult(AuthenticateResult.Fail("Invalid Authorization Header; either null (missing) or wrongly specified"));
        }

        try
        {
            var token = authHeader["Basic ".Length..].Trim();
            var credentialstring = Encoding.UTF8.GetString(Convert.FromBase64String(token));
            var credentials = credentialstring.Split(':');

            if (credentials[0] == _settings.DevKey)
            {
                var claims = new[] { new Claim(ClaimTypes.NameIdentifier, credentials[0]), new Claim("name", credentials[0]), new Claim(ClaimTypes.Role, "Admin") };
                var identity = new ClaimsIdentity(claims, "Basic");
                var claimsPrincipal = new ClaimsPrincipal(identity);
                return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(claimsPrincipal, Scheme.Name)));
            }

            Logger.LogWarning("Invalid credentials: {Creds}", credentials[0]);

            Response.StatusCode = StatusCodes.Status401Unauthorized;
            Response.Headers.Append("WWW-Authenticate", "Basic realm=\"scorecaddy.app\"");
            return Task.FromResult(AuthenticateResult.Fail("Invalid Authorization Header; invalid credentials"));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error while processing basic auth header");
            Response.StatusCode = StatusCodes.Status401Unauthorized;
            Response.Headers.Append("WWW-Authenticate", "Basic realm=\"scorecaddy.app\"");
            return Task.FromResult(AuthenticateResult.Fail("Invalid Authorization Header; invalid credentials"));
        }
    }
}