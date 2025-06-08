using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TheWedding.Data;

public class AuditLog
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }
    public virtual User User { get; set; }

    [MaxLength(500)]
    public string Action { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
