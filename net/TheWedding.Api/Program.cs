using System.Reflection;
using System.Text.Json.Serialization;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

using NSwag.Generation.Processors.Security;

using Serilog;

using TheWedding.Api;
using TheWedding.Api.Auth;
using TheWedding.Api.Exceptions;
using TheWedding.Data;
using TheWedding.Data.Repos;
using TheWedding.Shared;

// Init
Console.WriteLine("...");
Console.WriteLine("...");
Console.WriteLine("... Starting API");

var builder = WebApplication.CreateBuilder(args);

// Add local settings
builder.Configuration.AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true);

// Configure logging
var useSerilog = builder.Configuration.GetSection("Serilog").GetValue<bool?>("Enabled") != false;
if (useSerilog)
{
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console()
    );
}

// Register Settings from appsettings.json
builder.Services.Configure<AppSettings>(builder.Configuration.GetSection("App"));

// Register "JWT" from appsettings.json
var jwtSection = builder.Configuration.GetSection("JWT");
builder.Services.Configure<JwtSettings>(jwtSection);
var jwt = jwtSection.Get<JwtSettings>();

// Add db context to DI container
builder.Services.AddDatabase(builder.Configuration);

// Configure CORS policy
builder.Services.AddCors();

// Enable distributed memory cache
builder.Services.AddDistributedMemoryCache();

// Add Redis cache if connection string is present
var redisConnString = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConnString))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnString;
        options.InstanceName = "TheWedding";
    });

    Console.WriteLine("... Redis Enabled");
}

// Configure JWT authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddScheme<AuthenticationSchemeOptions, BasicAuthHandler>("BasicAuth", null)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwt.Issuer,
        ValidAudience = jwt.Issuer,
        IssuerSigningKey = jwt.GetKey()
    };
});

// Add auth policy for authorized users
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AuthorizedUser", policy => policy.Requirements.Add(new AuthorizedUserRequirement()));
    options.DefaultPolicy = options.GetPolicy("AuthorizedUser");
});

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("BasicAuth", new AuthorizationPolicyBuilder("BasicAuth").RequireAuthenticatedUser().Build());

// Add tracker for limit requests
builder.Services.AddHttpContextAccessor();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<LimitRequestTracker>();

builder.Services.AddSingleton<CacheService>();
builder.Services.AddSingleton<JwtService>();

builder.Services.AddTransient<IAuthorizationHandler, AuthorizedUserHandler>();
builder.Services.AddTransient<UserRepo>();
builder.Services.AddTransient<AuthRepo>();

builder.Services
    .AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new DateConverterUtc());
        opts.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// Register NSwag
builder.Services.AddOpenApiDocument(document =>
{
    document.AddSecurity("bearer", [], new NSwag.OpenApiSecurityScheme
    {
        Type = NSwag.OpenApiSecuritySchemeType.Http,
        BearerFormat = "JWT",
        Name = "Authorization",
        In = NSwag.OpenApiSecurityApiKeyLocation.Header,
        Description = "Add your bearer token here",
        Scheme = "bearer",
    });

    document.AddSecurity("basic", [], new NSwag.OpenApiSecurityScheme
    {
        Type = NSwag.OpenApiSecuritySchemeType.Basic,
        In = NSwag.OpenApiSecurityApiKeyLocation.Header,
        Description = "Enter username and password",
        Scheme = "basic",
    });

    document.OperationProcessors.Add(new OperationSecurityScopeProcessor("bearer"));
    document.OperationProcessors.Add(new OperationSecurityScopeProcessor("basic"));
});

var app = builder.Build();

// Use swagger
app.UseOpenApi();
app.UseSwaggerUi();

if (useSerilog) app.UseSerilogRequestLogging();

// Migrate db after services are built
app.Services.MigrateDatabase();

// Set which cors policy to use
app.UseRouting();
app.UseCors(options =>
{
    options
        .WithOrigins(builder.Configuration["Origins"].Split(", "))
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
});

// Enable authentication
app.UseAuthentication();
app.UseAuthorization();

// Register the exception handling middleware
app.UseMiddleware<ExceptionHandler>();

app.MapControllers();

app.MapGet("/", ([FromServices] IOptions<AppSettings> options) => new
{
    message = $"Only {(new DateTime(2025, 12, 29, 12, 0, 0) - DateTime.UtcNow).TotalDays} days to go!",
    version = builder.Configuration["Version"] ?? Assembly.GetEntryAssembly().GetName().Version.ToString()
});

Console.WriteLine("...");
Console.WriteLine("...");
Console.WriteLine("... App Started");
Console.WriteLine("");
Console.WriteLine("");

app.Run();