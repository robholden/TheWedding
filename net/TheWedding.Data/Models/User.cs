using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TheWedding.Data;

public class User
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    [EmailAddress, MaxLength(500)]
    public string Email { get; set; }

    [MaxLength(100)]
    public string FirstName { get; set; }

    [MaxLength(100)]
    public string LastName { get; set; }

    [MaxLength(255)]
    public string Nickname { get; set; }

    [MaxLength(500)]
    public string MatchName { get; set; }

    public DateOnly Dob { get; set; }

    public bool Disabled { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User SetMatchName()
    {
        MatchName = $"{FirstName}{LastName}".Trim().ToLowerInvariant().Replace(" ", "");
        return this;
    }

    public User ApplyDto(UserDto dto)
    {
        Email = dto.Email;
        FirstName = dto.FirstName;
        LastName = dto.LastName;
        Nickname = dto.Nickname;
        UpdatedAt = DateTime.UtcNow;

        return SetMatchName();
    }

    public UserDto ToDto(bool withId = false) =>
        new()
        {
            Id = withId ? Id : null,
            Email = Email,
            FirstName = FirstName,
            LastName = LastName,
            Nickname = Nickname
        };

    public class UserDto
    {
        public Guid? Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Nickname { get; set; }
        public string IpAddress { get; set; }
        public string Name => $"{FirstName} {LastName}".Trim();

        public User ToUser() =>
            new User()
            {
                Id = Id ?? Guid.CreateVersion7(),
                Email = Email,
                FirstName = FirstName,
                LastName = LastName,
                Nickname = Nickname,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
            .SetMatchName();
    }
}
