using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TheWedding.Data;

public class AuthToken
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(1);

    public Guid UserId { get; set; }

    public virtual User User { get; set; }

    [MaxLength(100)]
    public string IpAddress { get; set; }

    public bool IsRevoked { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
