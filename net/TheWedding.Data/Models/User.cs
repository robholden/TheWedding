using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TheWedding.Data;

public class User
{
    public static readonly string[] AdminEmails = ["robertandreshma@gmail.com"];

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

    public Guid? PlusOneId { get; set; }
    public virtual User PlusOne { get; set; }

    public virtual ICollection<User> PlusOnes { get; set; }

    public DateOnly Dob { get; set; }

    public bool Disabled { get; set; }

    public bool IsAdmin => AdminEmails.Contains(Email.ToLowerInvariant());

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User SetMatchName()
    {
        MatchName = $"{FirstName}{LastName}".Trim().ToLowerInvariant().Replace(" ", "");
        return this;
    }

    public User ApplyDto(UserDto dto)
    {
        Dob = dto.Dob;
        Email = dto.Email;
        FirstName = dto.FirstName;
        LastName = dto.LastName;
        Nickname = dto.Nickname;
        UpdatedAt = DateTime.UtcNow;
        PlusOneId = dto.PlusOneId;

        return SetMatchName();
    }

    public UserDto ToDto(bool includePlusOnes = true) =>
        new()
        {
            Id = Id,
            Dob = Dob,
            Email = Email,
            FirstName = FirstName,
            LastName = LastName,
            Nickname = Nickname,
            Disabled = Disabled,
            IsAdmin = IsAdmin,
            PlusOneId = PlusOneId,
            PlusOne = includePlusOnes ? PlusOne?.ToDto(includePlusOnes: false) : null,
            PlusOnes = includePlusOnes ? PlusOnes?.Select(u => u.ToDto()) : []
        };

    public class UserDto
    {
        public Guid? Id { get; set; }
        public DateOnly Dob { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Nickname { get; set; }
        public string IpAddress { get; set; }
        public bool Disabled { get; set; }
        public bool IsAdmin { get; set; }
        public string Name => $"{FirstName} {LastName}".Trim();
        public Guid? PlusOneId { get; set; }
        public UserDto PlusOne { get; set; }
        public IEnumerable<UserDto> PlusOnes { get; set; }

        public User ToUser() =>
            new User()
            {
                Id = Id ?? Guid.CreateVersion7(),
                Dob = Dob,
                Email = Email,
                FirstName = FirstName,
                LastName = LastName,
                Nickname = Nickname,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                PlusOneId = PlusOneId
            }
            .SetMatchName();
    }
}
