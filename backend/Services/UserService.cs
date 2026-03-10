// ============================================================
// Services/UserService.cs — Business Logic ของจัดการผู้ใช้
//
// ย้าย Logic จาก UsersController มาไว้ใน Service Layer
// เพื่อให้ Controller ทำหน้าที่แค่รับ Request → เรียก Service → ส่ง Response
// ============================================================
using CSNews.Data;
using CSNews.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace CSNews.Services;

public interface IUserService
{
    Task<PagedResponse<UserResponse>> GetAllAsync(int page, int pageSize);
    Task<UserResponse> ChangeRoleAsync(int id, string role, int myId);
    Task<UserResponse> ToggleSuspendAsync(int id, int myId);
    Task DeleteAsync(int id, int myId);
}

public class UserService(AppDbContext db) : IUserService
{
    private static readonly string[] AllowedRoles = ["Reader", "Editor", "Admin"];

    public async Task<PagedResponse<UserResponse>> GetAllAsync(int page, int pageSize)
    {
        var q     = db.Users.OrderByDescending(u => u.CreatedAt);
        var total = await q.CountAsync();
        var items = await q
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(u => new UserResponse(u.Id, u.Username, u.Email, u.Role, u.ProfileImage, u.IsActive))
            .ToListAsync();

        return new PagedResponse<UserResponse>(items, total, page, pageSize,
            (int)Math.Ceiling((double)total / pageSize));
    }

    public async Task<UserResponse> ChangeRoleAsync(int id, string role, int myId)
    {
        if (id == myId)
            throw new InvalidOperationException("ไม่สามารถเปลี่ยน Role ของตัวเองได้");

        if (!AllowedRoles.Contains(role))
            throw new ArgumentException($"Role ต้องเป็น: {string.Join(", ", AllowedRoles)}");

        var user = await db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException("ไม่พบผู้ใช้");

        user.Role = role;
        await db.SaveChangesAsync();

        return new UserResponse(user.Id, user.Username, user.Email, user.Role, user.ProfileImage, user.IsActive);
    }

    public async Task<UserResponse> ToggleSuspendAsync(int id, int myId)
    {
        if (id == myId)
            throw new InvalidOperationException("ไม่สามารถระงับ Account ตัวเองได้");

        var user = await db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException("ไม่พบผู้ใช้");

        user.IsActive = !user.IsActive;
        await db.SaveChangesAsync();

        return new UserResponse(user.Id, user.Username, user.Email, user.Role, user.ProfileImage, user.IsActive);
    }

    public async Task DeleteAsync(int id, int myId)
    {
        if (id == myId)
            throw new InvalidOperationException("ลบ Account ตัวเองไม่ได้");

        var user = await db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException("ไม่พบผู้ใช้");

        db.Users.Remove(user);
        await db.SaveChangesAsync();
    }
}
