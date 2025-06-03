using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using TheWedding.Shared;

namespace TheWedding.Data.Repos;

public class UserRepo
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<UserRepo> _logger;

    public UserRepo(AppDbContext dbContext, ILogger<UserRepo> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<IEnumerable<User>> GetAll()
    {
        // Fetch all users from database
        return await _dbContext.Users
            .IgnoreAutoIncludes()
            .Include(u => u.PlusOne)
            .Include(u => u.PlusOnes)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<User> GetByToken(Guid tokenId)
    {
        var token = await _dbContext.AuthTokens
            .AsNoTracking()
            .Include(t => t.User).ThenInclude(u => u.PlusOnes)
            .FirstOrDefaultAsync(t => t.Id == tokenId);

        return token?.User ?? throw HandledException.NotFound(ErrorKeys.UserNotFound);
    }

    public async Task<User> Save(User.UserDto dto)
    {
        // Add or update user in database
        var user = dto.Id.HasValue ? await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == dto.Id.Value) : null;
        if (user == null)
        {
            user = dto.ToUser();
            user = (await _dbContext.Users.AddAsync(user)).Entity;
        }
        else
        {
            user.ApplyDto(dto);
            _dbContext.Users.Update(user);
        }

        await _dbContext.SaveChangesAsync();

        if (user.Disabled)
        {
            _logger.LogWarning("User {UserId} is disabled", user.Id);
            throw HandledException.Forbidden(ErrorKeys.UserDisabled);
        }

        return user;
    }

    public async Task<User> ToggleActiveness(Guid userId)
    {
        // Find user by ID and toggle active status
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId) ?? throw HandledException.NotFound(ErrorKeys.UserNotFound);

        user.Disabled = !user.Disabled;
        _dbContext.Users.Update(user);

        await _dbContext.SaveChangesAsync();

        return user;
    }

    public async Task Delete(Guid userId)
    {
        // Find user by ID and delete
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return;

        _dbContext.Users.Remove(user);
        await _dbContext.SaveChangesAsync();
    }
}
