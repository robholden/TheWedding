using System.Text.Json;

using Microsoft.Extensions.Caching.Distributed;

namespace TheWedding.Shared;

public class CacheService
{
    private readonly IDistributedCache _cache;

    public CacheService(IDistributedCache memoryCache)
    {
        _cache = memoryCache;
    }

    public async Task<T> Get<T>(string key)
    {
        var data = await _cache.GetStringAsync(key);
        return data == null ? default : JsonSerializer.Deserialize<T>(data);
    }

    public async Task Set<T>(string key, T value, TimeSpan? expiry = null)
    {
        var data = JsonSerializer.Serialize(value);
        await _cache.SetStringAsync(key, data, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry
        });
    }

    public async Task Remove(string key)
    {
        await _cache.RemoveAsync(key);
    }
}

