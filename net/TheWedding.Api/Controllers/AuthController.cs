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
        var token = await _repo.RefreshToken(User.TokenId(), HttpContext.IpAddress());

        // Generate token
        var (JWT, ExpiresAt) = _jwtService.GenerateToken(token);
        return new AuthResult(JWT, ExpiresAt);
    }

    [LimitRequest(2, 10)]
    [HttpPost("rsvp")]
    public async Task<AuthResult> RSVP([FromBody] AuthRequest request)
    {
        // Get user
        var ip = HttpContext.IpAddress();
        var token = await _repo.FindUser(request.LastName, request.Email, ip);

        // Generate token
        var (JWT, ExpiresAt) = _jwtService.GenerateToken(token);
        return new AuthResult(JWT, ExpiresAt);
    }
}

public record AuthRequest(string LastName, string Email);
public record AuthResult(string Token, long ExpiresAt);