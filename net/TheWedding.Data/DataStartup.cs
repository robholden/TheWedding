using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace TheWedding.Data;

public static class DataStartup
{
    public static void AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        // Register DbContext with DI container
        services
            .AddDbContext<AppDbContext>(options => options
                .UseSqlite(configuration.GetConnectionString("DefaultConnection"), b => b.MigrationsAssembly("TheWedding.Api"))
                .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.NonTransactionalMigrationOperationWarning))
            );
    }

    public static void MigrateDatabase(this IServiceProvider serviceProvider)
    {
        // Apply any pending migrations
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Create the database if it doesn't exist
        context.Database.EnsureCreated();

        // Seed products
        // Uncomment if you have a seeding method

        Console.WriteLine("... App Started");
        Console.WriteLine("");
        Console.WriteLine("");
    }
}
