// ============================================================
// Controllers/UsersController.cs
// Route: /api/users
// เฉพาะ Admin เท่านั้น
// ============================================================
using System.Security.Claims;
using CSNews.Data;
using CSNews.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CSNews.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]  // ทุก endpoint ต้องเป็น Admin
public class UsersController(AppDbContext db) : ControllerBase
{
    // GET /api/users
    // ดูรายชื่อผู้ใช้ทั้งหมด
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var q     = db.Users.OrderByDescending(u => u.CreatedAt);
        var total = await q.CountAsync();
        var items = await q
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(u => new UserResponse(u.Id, u.Username, u.Email, u.Role, u.ProfileImage))
            .ToListAsync();

        return Ok(new ApiResponse<PagedResponse<UserResponse>>(true,
            new PagedResponse<UserResponse>(items, total, page, pageSize,
                (int)Math.Ceiling((double)total / pageSize))));
    }

    // PATCH /api/users/{id}/role
    // Body: { "role": "Editor" }
    // เปลี่ยน Role ของผู้ใช้
    [HttpPatch("{id:int}/role")]
    public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleRequest req)
    {
        // ป้องกัน Admin เปลี่ยน Role ตัวเอง
        var myId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == myId)
            return BadRequest(new ApiResponse<string>(false, "", "ไม่สามารถเปลี่ยน Role ของตัวเองได้"));

        // ตรวจสอบว่า Role ที่ส่งมาถูกต้อง
        var allowed = new[] { "Reader", "Editor", "Admin" };
        if (!allowed.Contains(req.Role))
            return BadRequest(new ApiResponse<string>(false, "", $"Role ต้องเป็น: {string.Join(", ", allowed)}"));

        var user = await db.Users.FindAsync(id);
        if (user is null)
            return NotFound(new ApiResponse<string>(false, "", "ไม่พบผู้ใช้"));

        user.Role = req.Role;
        await db.SaveChangesAsync();

        return Ok(new ApiResponse<UserResponse>(true,
            new UserResponse(user.Id, user.Username, user.Email, user.Role, user.ProfileImage),
            $"เปลี่ยน Role เป็น {req.Role} สำเร็จ"));
    }

    // PATCH /api/users/{id}/suspend
    // ระงับ/คืนสิทธิ์ Account
    [HttpPatch("{id:int}/suspend")]
    public async Task<IActionResult> ToggleSuspend(int id)
    {
        var myId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == myId)
            return BadRequest(new ApiResponse<string>(false, "", "ไม่สามารถระงับ Account ตัวเองได้"));

        var user = await db.Users.FindAsync(id);
        if (user is null)
            return NotFound(new ApiResponse<string>(false, "", "ไม่พบผู้ใช้"));

        user.IsActive = !user.IsActive;
        await db.SaveChangesAsync();

        var msg = user.IsActive ? "คืนสิทธิ์ Account สำเร็จ" : "ระงับ Account สำเร็จ";
        return Ok(new ApiResponse<UserResponse>(true,
            new UserResponse(user.Id, user.Username, user.Email, user.Role, user.ProfileImage), msg));
    }
}

// DTO สำหรับ PATCH /role
public record ChangeRoleRequest(string Role);
