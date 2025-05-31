using Microsoft.AspNetCore.Authorization;

namespace TheWedding.Api.Auth;

public class BasicAuthAttribute : AuthorizeAttribute
{
    public BasicAuthAttribute()
    {
        Policy = "BasicAuth";
    }
}