using System.Text;

using Microsoft.IdentityModel.Tokens;

namespace TheWedding.Api.Auth;

public class JwtSettings
{
    public string IssuerSigningKey { get; set; }

    public string Issuer { get; set; }

    public SymmetricSecurityKey GetKey() => new(Encoding.UTF8.GetBytes(IssuerSigningKey));

    public SigningCredentials GetSigningCredentials() => new(GetKey(), SecurityAlgorithms.HmacSha256);
}