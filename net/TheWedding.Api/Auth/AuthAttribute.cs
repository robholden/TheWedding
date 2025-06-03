using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;

using TheWedding.Data.Repos;

namespace TheWedding.Api.Auth;

public class AuthorizedUserRequirement : IAuthorizationRequirement { }

public class AuthorizedUserHandler : AuthorizationHandler<AuthorizedUserRequirement>
{
    private readonly AuthRepo _repo;

    public AuthorizedUserHandler(AuthRepo repo)
    {
        _repo = repo;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, AuthorizedUserRequirement requirement)
    {
        // Get auth token id
        var jtiClaim = context.User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
        if (jtiClaim == null || !Guid.TryParse(jtiClaim, out var tokenId))
        {
            // If no Jit claim is found or invalid, fail authorization
            context.Fail();
            return;
        }

        // Get http context 
        if (context.Resource is not HttpContext httpContext)
        {
            // If the resource is not an HttpContext, fail authorization
            context.Fail();
            return;
        }

        // Check if the user exists in the database
        var token = await _repo.IsTokenValid(tokenId, httpContext.IpAddress());
        if (!token)
        {
            context.Fail();
            return;
        }

        context.Succeed(requirement);
    }
}

public record AuthenticatedUser(Guid UserId, Guid TokenId)
{
    public static AuthenticatedUser FromClaims(ClaimsPrincipal claims)
    {
        var userId = Guid.Parse(claims.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var tokenId = Guid.Parse(claims.FindFirst(JwtRegisteredClaimNames.Jti)?.Value ?? Guid.Empty.ToString());
        return new AuthenticatedUser(userId, tokenId);
    }
}
