using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<BasicAuthSettings>(builder.Configuration.GetSection("BasicAuth"));

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? "Data Source=wedding.db";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddCors();

// Add basic authentication for admin endpoints
builder.Services.AddAuthentication("BasicAuthentication")
    .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, BasicAuthenticationHandler>("BasicAuthentication", null);
builder.Services.AddAuthorization();

var app = builder.Build();

// Ensure DB is created on startup (use migrations in production)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseCors(policy =>
{
    policy.WithOrigins(builder.Configuration.GetSection("AllowedUrls").Get<string[]>() ?? [])
          .AllowAnyHeader()
          .AllowAnyMethod();
});

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api", () => @"
          __
         _\/__
       //----\\
      ||      ||
      ||      ||
       \\____//
         ----
");



app.MapGet("/api/admin/responses", [Authorize] async (AppDbContext db) =>
{
    var qas = await db.QuestionAnswers.ToListAsync();

    // Generate simple HTML table of responses grouped by UserId but taking the latest Submission only
    var groupedResponses = qas.GroupBy(qa => qa.UserId)
        .Select(g => new
        {
            UserId = g.Key,
            Emails = g.Select(qa => qa.EmailId).Distinct(),
            Answers = g.Where(q => q.SaveCode == g.OrderByDescending(qa => qa.SubmittedAt).First().SaveCode).ToList(),
        });

    var html = @"<html><head>
    <title>Responses</title>
    <link href='https://fonts.googleapis.com/css2?family=Radley:ital@0;1&display=swap' rel='stylesheet'>
    <style>
        body { font-family: 'Radley', sans-serif; margin: 20px; }
        h1 { color: #333; font-size: 24px; margin: 40px 0 5px; }
        table { border-collapse: collapse; border: none; margin-top: 10px; }
        th { text-transform: capitalize; }
        th, td { padding: 8px; border: 1px solid #999; text-align: left;  }
        table.yes th { background-color: #4d7d58ff; color: white; border-color: #2e4c35ff; }
        table.no th { background-color: #984049ff; color: white; border-color: #6a2b32ff; }

    </style>
    </head><body>";

    // Retrieve QAs for categories 'Fort Kochi'
    var cats = new[] { "Fort Kochi", "Cruise" };
    foreach (var cat in cats)
    {
        html += $"<h1>{cat} Responses</h1>";

        var responses = groupedResponses
                .Select(g => new
                {
                    g.UserId,
                    g.Emails,
                    Answers = g.Answers.Where(qa => qa.Category == cat),
                });
        var isNoResponses = responses.Where(r => r.Answers.Any(a => a.Question == "reason"));
        var isYesResponses = responses.Where(r => r.Answers.Any(a => a.Question != "reason"));

        var eachResponses = new[] { new { Yes = false, Responses = isNoResponses }, new { Yes = true, Responses = isYesResponses } };
        foreach (var rg in eachResponses.Where(rg => rg.Responses.Any()))
        {
            html += $"<table class={(rg.Yes ? "yes" : "no")}><tr><th>Email</th><th>User Id</th><th>Date Submitted</th>";

            var questions = rg.Responses.SelectMany(r => r.Answers).Select(a => a.Question).Distinct();
            foreach (var question in questions)
            {
                html += $"<th>{question}</th>";
            }
            html += "</tr>";

            foreach (var response in rg.Responses)
            {
                html += $"<tr><td>{string.Join(", ", response.Emails)}</td><td>{response.UserId}</td><td>{response.Answers.Max(a => a.SubmittedAt)}</td>";
                foreach (var question in questions)
                {
                    var answer = response.Answers.FirstOrDefault(a => a.Question == question)?.Answer ?? "";
                    html += $"<td>{answer}</td>";
                }
                html += "</tr>";
            }
            html += "</table>";
        }
    }

    html += "</body></html>";

    // Change response output to text/html
    return Results.Content(html, "text/html");
});

app.MapGet("/api/answers/{saveCode}", async (AppDbContext db, string saveCode) =>
{
    var qa = await db.QuestionAnswers.Where(qa => qa.SaveCode == saveCode).ToListAsync();
    return Results.Ok(qa);
});

app.MapPost("/api/answers", async (AppDbContext db, List<QuestionAnswer> qa, [FromQuery] string? saveCode) =>
{
    // If save code is provided, delete existing answers with that code
    if (!string.IsNullOrEmpty(saveCode))
    {
        var existingAnswers = db.QuestionAnswers.Where(qa => qa.SaveCode == saveCode);
        db.QuestionAnswers.RemoveRange(existingAnswers);
        await db.SaveChangesAsync();
    }
    else
    {
        // Generate a new save code if not provided: 10 character unique identifier based on current ticks
        saveCode = DateTime.UtcNow.Ticks.ToString("x").PadLeft(10, '0').Substring(0, 10);
    }

    // Assign the save code to each question answer
    foreach (var questionAnswer in qa)
    {
        questionAnswer.SaveCode = saveCode;
    }

    await db.QuestionAnswers.AddRangeAsync(qa);
    await db.SaveChangesAsync();
    return Results.Ok(new { saveCode });
});

// Host wwwwroot static files for an angular app
app.UseDefaultFiles();
app.UseStaticFiles();

app.Run();

