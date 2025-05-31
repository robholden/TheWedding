using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using TheWedding.Api.Auth;
using TheWedding.Data;
using TheWedding.Data.Repos;

namespace TheWedding.Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class UserController : ControllerBase
{
    private readonly UserRepo _repo;

    public UserController(UserRepo repo)
    {
        _repo = repo;
    }

    [HttpGet("me")]
    public async Task<User.UserDto> GetMe()
    {
        var me = AuthenticatedUser.FromClaims(User);
        var user = await _repo.GetByToken(me.TokenId);
        return user.ToDto(withId: false);
    }
}