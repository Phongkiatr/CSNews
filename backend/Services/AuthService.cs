// ============================================================
// Services/AuthService.cs — Business Logic ของ Authentication
//
// Service Layer = ชั้นที่เก็บ Logic ทั้งหมด
// Controller รับ Request → เรียก Service → Service คืนผล
//
// AuthService รับผิดชอบ:
//   Register : ตรวจ duplicate → Hash password → บันทึก → ออก JWT
//   Login    : หา User → ตรวจ password → ออก JWT
// ============================================================
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
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
}

public class AuthService(AppDbContext db, IConfiguration config) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
    {
        if (await db.Users.AnyAsync(u => u.Email == req.Email))
            throw new InvalidOperationException("อีเมลนี้ถูกใช้งานแล้ว");

        if (await db.Users.AnyAsync(u => u.Username == req.Username))
            throw new InvalidOperationException("ชื่อผู้ใช้นี้ถูกใช้งานแล้ว");

        var user = new User
        {
            Username     = req.Username,
            Email        = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = "Editor" // Default role สำหรับผู้สมัครใหม่
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return Build(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email)
            ?? throw new KeyNotFoundException("ไม่พบบัญชีผู้ใช้นี้");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("บัญชีนี้ถูกระงับการใช้งาน");

        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("รหัสผ่านไม่ถูกต้อง");

        return Build(user);
    }

    // ── Private ─────────────────────────────────────────────
    private AuthResponse Build(User user) =>
        new(GenerateJwt(user), GenerateRefreshToken(), ToDto(user));

    private string GenerateJwt(User user)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Claims ฝังข้อมูลผู้ใช้ใน Token อ่านได้แต่แก้ไขไม่ได้
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

    private static string GenerateRefreshToken()
    {
        var b = new byte[64];
        RandomNumberGenerator.Fill(b);
        return Convert.ToBase64String(b);
    }

    private static UserResponse ToDto(User u) =>
        new(u.Id, u.Username, u.Email, u.Role, u.ProfileImage);
}
