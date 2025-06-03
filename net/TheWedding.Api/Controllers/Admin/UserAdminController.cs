using Microsoft.AspNetCore.Mvc;

using TheWedding.Api.Auth;
using TheWedding.Data;
using TheWedding.Data.Repos;

namespace TheWedding.Api.Controllers;

[BasicAuth]
[ApiController]
[Route("admin/user")]
public class UserAdminController : ControllerBase
{
    private readonly UserRepo _repo;

    public UserAdminController(UserRepo repo)
    {
        _repo = repo;
    }

    [HttpGet]
    public async Task<IEnumerable<User.UserDto>> GetAll()
    {
        var users = await _repo.GetAll();
        return users.Select(u => u.ToDto());
    }

    [HttpGet("{id}/info")]
    public async Task<object> GetInfo()
    {
        return new
        {
            Text = "hi there!"
        };
    }

    [HttpPost]
    public async Task<User.UserDto> Save([FromBody] User.UserDto dto)
    {
        var user = await _repo.Save(dto);
        return user.ToDto();
    }

    [HttpPut("{id}/activeness")]
    public async Task<User.UserDto> SetActiveness(Guid id)
    {
        var user = await _repo.ToggleActiveness(id);
        return user.ToDto();
    }

    [HttpDelete("{id}")]
    public async Task Delete(Guid id)
    {
        await _repo.Delete(id);
    }
}