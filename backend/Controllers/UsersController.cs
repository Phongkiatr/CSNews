// ============================================================
// Controllers/UsersController.cs
// Route: /api/users
// เฉพาะ Admin เท่านั้น
// ============================================================
using System.Security.Claims;
using CSNews.Data;
using CSNews.Models.DTOs;
using CSNews.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CSNews.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController(AppDbContext db, IAuthService auth) : ControllerBase
{
    // GET /api/users
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
    [HttpPatch("{id:int}/role")]
    public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleRequest req)
    {
        var myId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == myId)
            return BadRequest(new ApiResponse<string>(false, "", "ไม่สามารถเปลี่ยน Role ของตัวเองได้"));

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

    // POST /api/users/{id}/impersonate
    [HttpPost("{id:int}/impersonate")]
    public async Task<IActionResult> Impersonate(int id)
    {
        var myId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == myId)
            return BadRequest(new ApiResponse<string>(false, "", "ไม่สามารถ Impersonate ตัวเองได้"));

        var result = await auth.ImpersonateAsync(id);
        return Ok(new ApiResponse<AuthResponse>(true, result, "Impersonate สำเร็จ"));
    }

    // DELETE /api/users/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var myId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == myId)
            return BadRequest(new ApiResponse<string>(false, "", "ลบ Account ตัวเองไม่ได้"));

        var user = await db.Users.FindAsync(id);
        if (user is null)
            return NotFound(new ApiResponse<string>(false, "", "ไม่พบผู้ใช้"));

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return Ok(new ApiResponse<string>(true, "ลบผู้ใช้สำเร็จ"));
    }
}

public record ChangeRoleRequest(string Role);
