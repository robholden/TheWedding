using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using TheWedding.Shared;

namespace TheWedding.Data.Repos;

public class AuthRepo
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<AuthRepo> _logger;

    public AuthRepo(AppDbContext dbContext, ILogger<AuthRepo> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<bool> IsTokenValid(Guid tokenId, string ip)
    {
        // Check if the token exists in the database
        var token = await _dbContext.AuthTokens.FirstOrDefaultAsync(t => t.Id == tokenId);
        if (token == null)
        {
            _logger.LogWarning("Invalid token {TokenId}", tokenId);
            return false;
        }

        // Check if the token is expired
        if (token.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogWarning("Token {TokenId} has expired", tokenId);
            return false;
        }

        // Check ip address
        if (token.IpAddress != null && !string.Equals(token.IpAddress, ip, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Token {TokenId} used from different IP {Ip} (expected {ExpectedIp})", tokenId, ip, token.IpAddress);
            return false;
        }

        // Update token's last used timestamp
        token.UpdatedAt = DateTime.UtcNow;
        _dbContext.AuthTokens.Update(token);

        await _dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<AuthToken> RefreshToken(Guid tokenId, string ip)
    {
        // Find the token in the database
        var token = await _dbContext.AuthTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == tokenId);
        if (token == null)
        {
            _logger.LogWarning("Token {TokenId} not found", tokenId);
            throw HandledException.NotFound(ErrorKeys.SessionExpired);
        }
        // Check if the token is expired
        if (token.ExpiresAt < DateTime.UtcNow.AddMinutes(5))
        {
            _logger.LogWarning("Token {TokenId} has expired", tokenId);
            throw HandledException.Unauthorized(ErrorKeys.SessionExpired);
        }

        // Update the token's expiration date and IP address
        token.ExpiresAt = DateTime.UtcNow.AddDays(1); // Extend expiration by 30 days
        token.UpdatedAt = DateTime.UtcNow;
        _dbContext.AuthTokens.Update(token);

        await _dbContext.SaveChangesAsync();

        return token;
    }

    public async Task<AuthToken> FindUser(string lastName, string email, string ip)
    {
        // Find user by name and date of birth
        var loweredName = lastName.ToLower().Trim();
        var loweredEmail = email.ToLower().Trim();

        var user = await _dbContext.Users
            .Include(u => u.PlusOnes)
            .FirstOrDefaultAsync(u => u.LastName.ToLower() == loweredName && u.Email.ToLower() == loweredEmail);
        if (user == null)
        {
            _logger.LogWarning("Login failed for {LastName}/{Email} from {Ip}", lastName, email, ip);
            throw HandledException.NotFound(ErrorKeys.RsvpNotMatched);
        }

        // Check if user is disabled
        if (user.Disabled)
        {
            _logger.LogWarning("User {UserId} is disabled", user.Id);
            throw HandledException.Forbidden(ErrorKeys.UserDisabled);
        }

        // Create or update auth token for the user
        var token = await _dbContext.AuthTokens.FirstOrDefaultAsync(t => t.UserId == user.Id && t.IpAddress == ip);
        if (token == null)
        {
            token = new AuthToken
            {
                UserId = user.Id,
                IpAddress = ip,
                ExpiresAt = DateTime.UtcNow.AddDays(30), // Set token expiration to 30 days
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            token = (await _dbContext.AuthTokens.AddAsync(token)).Entity;
        }
        else
        {
            token.IsRevoked = false;
            token.UpdatedAt = DateTime.UtcNow;

            _dbContext.AuthTokens.Update(token);
        }

        await _dbContext.SaveChangesAsync();

        return token;
    }
}
