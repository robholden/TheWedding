using Microsoft.AspNetCore.Mvc;

using TheWedding.Api.Auth;
using TheWedding.Data.Repos;

namespace TheWedding.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthRepo _repo;
    private readonly JwtService _jwtService;

    public AuthController(JwtService jwtService, AuthRepo repo)
    {
        _jwtService = jwtService;
        _repo = repo;
    }

    [HttpGet("refresh")]
    public async Task<AuthResult> Refresh()
    {
        // Get user
        var me = AuthenticatedUser.FromClaims(User);
        var token = await _repo.RefreshToken(me.TokenId, HttpContext.IpAddress());

        // Generate token
        var (JWT, ExpiresAt) = _jwtService.GenerateToken(token);
        return new AuthResult(JWT, ExpiresAt);
    }

    [LimitRequest(1, 15)]
    [HttpPost("login")]
    public async Task<AuthResult> Login([FromBody] AuthRequest request)
    {
        // Get user
        var ip = HttpContext.IpAddress();
        var token = await _repo.FindUser(request.Name, request.Dob, ip);

        // Generate token
        var (JWT, ExpiresAt) = _jwtService.GenerateToken(token);
        return new AuthResult(JWT, ExpiresAt);
    }
}

public record AuthRequest(string Name, DateOnly Dob);
public record AuthResult(string Token, long ExpiresAt);