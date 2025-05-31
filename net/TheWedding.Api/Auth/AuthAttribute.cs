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
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
        {
            // If no UserId claim is found or invalid, fail authorization
            context.Fail();
            return;
        }

        // Get Sid
        var sidClaim = context.User.FindFirst(ClaimTypes.Sid)?.Value;
        if (sidClaim == null || !Guid.TryParse(sidClaim, out var sid))
        {
            // If no Sid claim is found or invalid, fail authorization
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
        var token = await _repo.IsTokenValid(sid, httpContext.IpAddress());
        if (!token)
        {
            context.Fail();
            return;
        }

        context.Succeed(requirement);
    }
}

public record AuthenticatedUser(int UserId, Guid TokenId)
{
    public static AuthenticatedUser FromClaims(ClaimsPrincipal claims)
    {
        var userId = int.Parse(claims.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var sid = Guid.Parse(claims.FindFirst(ClaimTypes.Sid)?.Value ?? Guid.Empty.ToString());
        return new AuthenticatedUser(userId, sid);
    }
}
