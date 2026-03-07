// ============================================================
// Controllers/AuthController.cs
//
// Controller = ชั้นที่รับ HTTP Request และส่ง Response
// Controller ไม่มี Logic — มีแค่:
//   1. รับข้อมูลจาก Request
//   2. เรียก Service
//   3. ส่ง Response กลับ
//
// [ApiController]   — เปิด Automatic model validation + binding
// [Route("api/[controller]")] — URL = /api/auth
// ============================================================
using System.Security.Claims;
using CSNews.Models.DTOs;
using CSNews.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CSNews.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService auth) : ControllerBase
{
    // POST /api/auth/register
    // Body: { "username": "...", "email": "...", "password": "..." }
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var result = await auth.RegisterAsync(req);
        return Ok(new ApiResponse<AuthResponse>(true, result, "สมัครสมาชิกสำเร็จ"));
    }

    // POST /api/auth/login
    // Body: { "email": "...", "password": "..." }
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var result = await auth.LoginAsync(req);
        return Ok(new ApiResponse<AuthResponse>(true, result, "เข้าสู่ระบบสำเร็จ"));
    }

    // GET /api/auth/me
    // Header: Authorization: Bearer <token>
    // คืนข้อมูลผู้ใช้ที่ Login อยู่
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        // ดึงข้อมูลจาก Claims ใน JWT Token
        var id       = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var username = User.FindFirstValue(ClaimTypes.Name)!;
        var email    = User.FindFirstValue(ClaimTypes.Email)!;
        var role     = User.FindFirstValue(ClaimTypes.Role)!;

        var user = new UserResponse(id, username, email, role, null);
        return Ok(new ApiResponse<UserResponse>(true, user));
    }
}
