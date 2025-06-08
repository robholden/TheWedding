
using System.Threading.Channels;

namespace TheWedding.Data;

public class AuditProcessor : BackgroundService
{
    private readonly ILogger<AuditProcessor> _logger;
    private readonly Channel<AuditLogRequest> _channel;
    private readonly IServiceScopeFactory _scopeFactory;

    public AuditProcessor(ILogger<AuditProcessor> logger, Channel<AuditLogRequest> channel, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _channel = channel;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (await _channel.Reader.WaitToReadAsync(stoppingToken))
        {
            var request = await _channel.Reader.ReadAsync(stoppingToken);
            _logger.LogInformation("Processing audit log request from user: {UserId}, action: {Action}", request.UserId, request.Action);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                dbContext.AuditLogs.Add(new AuditLog
                {
                    UserId = request.UserId,
                    Action = request.Action,
                    Timestamp = DateTime.UtcNow
                });

                await dbContext.SaveChangesAsync(stoppingToken);
                _logger.LogInformation("Successfully logged audit action from user: {UserId}, action: {Action}", request.UserId, request.Action);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log audit action from user: {UserId}, action: {Action}", request.UserId, request.Action);
            }
        }
    }
}
