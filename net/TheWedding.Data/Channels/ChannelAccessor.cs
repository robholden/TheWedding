using System.Threading.Channels;

namespace TheWedding.Data;

public class ChannelAccessor
{
    private readonly Channel<AuditLogRequest> _audit;

    public ChannelAccessor(Channel<AuditLogRequest> audit)
    {
        _audit = audit;
    }

    public void Audit(AuditLogRequest request)
    {
        _audit.Writer.TryWrite(request);
    }
}

public record AuditLogRequest(Guid? UserId, string Action)
{
    public async Task AddToQueue(Channel<AuditLogRequest> channel)
    {
        await channel.Writer.WriteAsync(this);
    }
}