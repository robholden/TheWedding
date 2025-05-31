using System.Collections.Concurrent;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;

namespace TheWedding.Api.Auth;

public sealed class LimitRequestAttribute : TypeFilterAttribute
{
    public LimitRequestAttribute(int maxLimit = 5, int timeFrame = 2) : base(typeof(LimitRequestFilter))
    {
        Arguments = [new LimitRequestOptions(maxLimit, timeFrame)];
    }

    public LimitRequestAttribute(params int[] values) : base(typeof(LimitRequestFilter))
    {
        var maxLimit = values?.Length > 0 ? values[0] : 30;
        var timeFrame = values?.Length > 1 ? values[1] : 30;

        Arguments = [new LimitRequestOptions(maxLimit, timeFrame)];
    }
}

public class LimitRequestOptions
{
    public LimitRequestOptions(int maxLimit, int timeFrame)
    {
        MaxLimit = maxLimit;
        TimeFrame = timeFrame;
    }

    public int MaxLimit { get; set; }

    public int TimeFrame { get; set; }
}

public class LimitRequestTracker
{
    public ConcurrentDictionary<string, DateTime> Executions { get; } = new();
}

public class LimitRequestFilter : IAsyncAuthorizationFilter
{
    private readonly ILogger<LimitRequestFilter> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMemoryCache _cache;
    private readonly LimitRequestTracker _tracker;

    public LimitRequestOptions Options { get; private set; }

    public LimitRequestFilter(ILogger<LimitRequestFilter> logger, IHttpContextAccessor httpContextAccessor, IMemoryCache cache, LimitRequestTracker tracker, LimitRequestOptions options)
    {
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
        _cache = cache;
        _tracker = tracker;

        Options = options;
    }

    public Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        // Stop if we've ran already
        if (_tracker.Executions.ContainsKey(context.ActionDescriptor.DisplayName))
        {
            return Task.CompletedTask;
        }

        // If there is another authorize filter, use its options
        Options = ((LimitRequestFilter)context.Filters.LastOrDefault(f => f is LimitRequestFilter)).Options;
        _tracker.Executions.TryAdd(context.ActionDescriptor.DisplayName, DateTime.UtcNow);

        // Get user (if there is one)
        var httpContext = _httpContextAccessor?.HttpContext;
        if (httpContext == null || !HasValidIdentity(httpContext, out var identity))
        {
            _logger.LogError("LimitRequestFilter => Missing identity header");
            context.Result = new ForbidResult();
            return Task.CompletedTask;
        }

        // Find an existing request
        var ip = httpContext.IpAddress();
        var path = httpContext.Request.Path;
        var cacheKey = ip + path + identity;

        // Incremenent total requests and date
        if (!_cache.TryGetValue<ApiRequest>(cacheKey, out var request) || request.Expired())
        {
            request = new();
        }

        request.Total++;
        request.ExpiresIn = Options.TimeFrame;

        // Cache request
        _cache.Set(cacheKey, request);

        // Validate total with our threshold
        if (request.Total > Options.MaxLimit)
        {
            _logger.LogError("LimitRequestFilter => total: {Total} > max: {MaxLimit} in {Seconds}s", request.Total, Options.MaxLimit, (DateTime.UtcNow - request.Created).TotalSeconds);
            context.Result = new StatusCodeResult(StatusCodes.Status429TooManyRequests);
        }

        return Task.CompletedTask;
    }

    private static bool HasValidIdentity(HttpContext context, out string identity)
    {
        return context.TryGetHeader("User-Agent", out identity);
    }

    private class ApiRequest
    {
        public DateTime Created { get; } = DateTime.UtcNow;

        public int ExpiresIn { get; set; }

        public int Total { get; set; }

        public bool Expired() => (DateTime.UtcNow - Created).TotalSeconds > ExpiresIn;
    }
}