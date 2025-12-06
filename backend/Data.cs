using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<QuestionAnswer> QuestionAnswers => Set<QuestionAnswer>();
}

public class QuestionAnswer
{
    public int Id { get; set; }
    public string SaveCode { get; set; } = string.Empty;
    public string EmailId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}