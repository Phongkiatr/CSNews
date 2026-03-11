// ============================================================
// Services/AuthService.cs — Authentication business logic
//
// Responsibilities:
//   Register    : check duplicates → hash password → save → issue JWT
//   Login       : find user → verify password → issue JWT
//   Impersonate : Admin can login as another user
// ============================================================
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CSNews.Data;
using CSNews.Models.DTOs;
using CSNews.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace CSNews.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest req);
    Task<AuthResponse> LoginAsync(LoginRequest req);
    Task<AuthResponse> ImpersonateAsync(int targetUserId);
}

public class AuthService(AppDbContext db, IConfiguration config) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
    {
        var email = req.Email.ToLower().Trim();

        if (await db.Users.AnyAsync(u => u.Email == email))
            throw new InvalidOperationException("This email is already in use");

        if (await db.Users.AnyAsync(u => u.Username == req.Username))
            throw new InvalidOperationException("This username is already taken");

        var user = new User
        {
            Username     = req.Username.Trim(),
            Email        = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role         = "Editor"
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return Build(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        var email = req.Email.ToLower().Trim();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email)
            ?? throw new KeyNotFoundException("Account not found");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("This account has been suspended");

        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid password");

        return Build(user);
    }

    // --- Impersonate: Admin logs in as another user ---
    public async Task<AuthResponse> ImpersonateAsync(int targetUserId)
    {
        var user = await db.Users.FindAsync(targetUserId)
            ?? throw new KeyNotFoundException("User not found");

        if (!user.IsActive)
            throw new InvalidOperationException("This account has been suspended");

        return Build(user);
    }

    // --- Private helpers ---
    private AuthResponse Build(User user) =>
        new(GenerateJwt(user), ToDto(user));

    private string GenerateJwt(User user)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Claims embed user info in the token (readable but tamper-proof)
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name,            user.Username),
            new Claim(ClaimTypes.Email,           user.Email),
            new Claim(ClaimTypes.Role,            user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer:             config["Jwt:Issuer"],
            audience:           config["Jwt:Audience"],
            claims:             claims,
            expires:            DateTime.UtcNow.AddHours(24),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserResponse ToDto(User u) =>
        new(u.Id, u.Username, u.Email, u.Role, u.ProfileImage, u.IsActive);
}
