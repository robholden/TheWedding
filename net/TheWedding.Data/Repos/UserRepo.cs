using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using TheWedding.Shared;

namespace TheWedding.Data.Repos;

public class UserRepo
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<UserRepo> _logger;
    private readonly ChannelAccessor _channels;

    public UserRepo(AppDbContext dbContext, ILogger<UserRepo> logger, ChannelAccessor channels)
    {
        _dbContext = dbContext;
        _logger = logger;
        _channels = channels;
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
        var user = token?.User ?? throw HandledException.NotFound(ErrorKeys.UserNotFound);

        // If this user is a plus one, we need to include the main user
        if (user.PlusOneId.HasValue)
        {
            var mainGuest = await _dbContext.Users
                .AsNoTracking()
                .Include(u => u.PlusOnes)
                .FirstOrDefaultAsync(u => u.Id == user.PlusOneId.Value);

            user.PlusOnes = (ICollection<User>)(mainGuest?.PlusOnes?.Where(p => p.Id != user.Id));
        }

        return user;
    }

    public async Task<User> Save(User.UserDto dto, Guid? updater = null)
    {
        // Track changes
        AuditLogRequest log;

        // Add or update user in database
        var user = dto.Id.HasValue ? await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == dto.Id.Value) : null;
        if (user == null)
        {
            user = dto.ToUser();
            user = (await _dbContext.Users.AddAsync(user)).Entity;

            log = new(updater, $"Created User: {user.Id} ({user.FirstName} {user.LastName})");
        }
        else
        {
            // Workout which fields were updated and there values
            var updatedFields = new List<string>();
            if (user.FirstName != dto.FirstName) updatedFields.Add($"FirstName: {dto.FirstName}");
            if (user.LastName != dto.LastName) updatedFields.Add($"LastName: {dto.LastName}");
            if (user.Nickname != dto.Nickname) updatedFields.Add($"Nickname: {dto.Nickname}");
            if (user.Email != dto.Email) updatedFields.Add($"Email: {dto.Email}");
            if (user.PlusOneId != dto.PlusOneId) updatedFields.Add($"PlusOneId: {dto.PlusOneId}");

            user.ApplyDto(dto);
            _dbContext.Users.Update(user);

            log = new(updater, $"Updated User: {user.Id} ({user.FirstName} {user.LastName}) - Updated Fields: {string.Join(", ", updatedFields)}");
        }

        await _dbContext.SaveChangesAsync();

        // Log the audit action
        _channels.Audit(log);

        return user;
    }

    public async Task<User> ToggleActiveness(Guid userId)
    {
        // Find user by ID and toggle active status
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId) ?? throw HandledException.NotFound(ErrorKeys.UserNotFound);

        user.Disabled = !user.Disabled;
        _dbContext.Users.Update(user);

        await _dbContext.SaveChangesAsync();

        // Log the audit action
        _channels.Audit(new AuditLogRequest(user.Id, $"Toggled active status for User: {user.Id} ({user.FirstName} {user.LastName}) - Now Disabled: {user.Disabled}"));

        return user;
    }

    public async Task Delete(Guid userId)
    {
        // Find user by ID and delete
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return;

        _dbContext.Users.Remove(user);
        await _dbContext.SaveChangesAsync();

        // Log the audit action
        _channels.Audit(new AuditLogRequest(user.Id, $"Deleted User: {user.Id} ({user.FirstName} {user.LastName})"));
    }
}
