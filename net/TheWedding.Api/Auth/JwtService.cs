using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using Microsoft.Extensions.Options;

using TheWedding.Data;

namespace TheWedding.Api.Auth;

public class JwtService
{
    private readonly JwtSettings _settings;

    public JwtService(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }

    public (string JWT, long ExpiresAt) GenerateToken(AuthToken authToken)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, $"{authToken.UserId}"),
            new Claim(JwtRegisteredClaimNames.Jti, $"{authToken.Id}")
        };

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Issuer,
            claims: claims,
            expires: DateTime.Now.AddMinutes(30),
            signingCredentials: _settings.GetSigningCredentials()
        );

        // Get JWT string
        var jwt = new JwtSecurityTokenHandler().WriteToken(token);

        // Get epoch time for expiration
        var expiresAt = new DateTimeOffset(token.ValidTo).ToUnixTimeSeconds();

        return (jwt, expiresAt);
    }
}