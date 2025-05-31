using System.Text;

namespace TheWedding.Shared;

public static class SharedExtensions
{
    public static string ToRandomKey(this int Id)
    {
        // Generate a random 8 character looking code like "42xh216b" but unique to the user id
        var baseId = Id.ToString("X8");

        // Make each 0 a random letter or number. This is to make the code look more like a code and less like an id
        var random = new Random();
        var supportId = new StringBuilder();
        foreach (var c in baseId)
        {
            if (c != '0')
            {
                supportId.Append(c);
                continue;
            }

            var r = random.Next(0, 36);
            supportId.Append(r < 10 ? (char)(r + 48) : (char)(r + 87));
        }

        // Move the final character to the 3rd position
        var final = supportId[^1];
        supportId.Remove(supportId.Length - 1, 1);
        supportId.Insert(2, final);

        return supportId.ToString();
    }
}