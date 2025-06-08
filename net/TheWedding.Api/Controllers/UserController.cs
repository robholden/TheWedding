using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using TheWedding.Api.Auth;
using TheWedding.Data;
using TheWedding.Data.Repos;
using TheWedding.Shared;

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
        var user = await _repo.GetByToken(User.TokenId());
        return user.ToDto();
    }

    [HttpPut]
    public async Task<User.UserDto> UpdateUser([FromBody] User.UserDto userDto)
    {
        if (!User.IsInRole($"{userDto.Id}")) throw HandledException.Forbidden(ErrorKeys.Unknown);

        var user = await _repo.Save(userDto, User.UserId());
        return user.ToDto();
    }
}