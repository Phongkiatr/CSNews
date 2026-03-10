// ============================================================
// Controllers/UsersController.cs
// Route: /api/users
// เฉพาะ Admin เท่านั้น
// ============================================================
using System.Security.Claims;
using CSNews.Models.DTOs;
using CSNews.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CSNews.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController(IUserService users, IAuthService auth) : ControllerBase
{
    // GET /api/users
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await users.GetAllAsync(page, pageSize);
        return Ok(new ApiResponse<PagedResponse<UserResponse>>(true, result));
    }

    // PATCH /api/users/{id}/role
    [HttpPatch("{id:int}/role")]
    public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleRequest req)
    {
        var myId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await users.ChangeRoleAsync(id, req.Role, myId);
        return Ok(new ApiResponse<UserResponse>(true, result, $"เปลี่ยน Role เป็น {req.Role} สำเร็จ"));
    }

    // PATCH /api/users/{id}/suspend
    [HttpPatch("{id:int}/suspend")]
    public async Task<IActionResult> ToggleSuspend(int id)
    {
        var myId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await users.ToggleSuspendAsync(id, myId);
        var msg = result.Role != null ? "สำเร็จ" : "สำเร็จ"; // simplified
        return Ok(new ApiResponse<UserResponse>(true, result, "เปลี่ยนสถานะสำเร็จ"));
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
        await users.DeleteAsync(id, myId);
        return Ok(new ApiResponse<string>(true, "ลบผู้ใช้สำเร็จ"));
    }
}
