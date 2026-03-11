// ============================================================
// Services/UserService.cs — User management business logic
//
// Handles admin-level user operations:
//   GetAll        : paginated user list with role counts
//   ChangeRole    : update a user's role
//   ToggleSuspend : activate/deactivate a user account
//   Delete        : permanently remove a user
// ============================================================
using CSNews.Data;
using CSNews.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace CSNews.Services;

public interface IUserService
{
    Task<UserListResponse> GetAllAsync(int page, int pageSize);
    Task<UserResponse> ChangeRoleAsync(int id, string role, int myId);
    Task<UserResponse> ToggleSuspendAsync(int id, int myId);
    Task DeleteAsync(int id, int myId);
}

public class UserService(AppDbContext db) : IUserService
{
    private static readonly string[] AllowedRoles = ["Reader", "Editor", "Admin"];

    public async Task<UserListResponse> GetAllAsync(int page, int pageSize)
    {
        var q     = db.Users.OrderByDescending(u => u.CreatedAt);
        var total = await q.CountAsync();

        // Count Admin and Editor totals (independent of pagination)
        var adminCount  = await db.Users.CountAsync(u => u.Role == "Admin");
        var editorCount = await db.Users.CountAsync(u => u.Role == "Editor");

        var items = await q
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(u => new UserResponse(u.Id, u.Username, u.Email, u.Role, u.ProfileImage, u.IsActive))
            .ToListAsync();

        return new UserListResponse(items, total, page, pageSize,
            (int)Math.Ceiling((double)total / pageSize),
            adminCount, editorCount);
    }

    public async Task<UserResponse> ChangeRoleAsync(int id, string role, int myId)
    {
        if (id == myId)
            throw new InvalidOperationException("Cannot change your own role");

        if (!AllowedRoles.Contains(role))
            throw new ArgumentException($"Role must be one of: {string.Join(", ", AllowedRoles)}");

        var user = await db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException("User not found");

        user.Role = role;
        await db.SaveChangesAsync();

        return new UserResponse(user.Id, user.Username, user.Email, user.Role, user.ProfileImage, user.IsActive);
    }

    public async Task<UserResponse> ToggleSuspendAsync(int id, int myId)
    {
        if (id == myId)
            throw new InvalidOperationException("Cannot suspend your own account");

        var user = await db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException("User not found");

        user.IsActive = !user.IsActive;
        await db.SaveChangesAsync();

        return new UserResponse(user.Id, user.Username, user.Email, user.Role, user.ProfileImage, user.IsActive);
    }

    public async Task DeleteAsync(int id, int myId)
    {
        if (id == myId)
            throw new InvalidOperationException("Cannot delete your own account");

        var user = await db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException("User not found");

        db.Users.Remove(user);
        await db.SaveChangesAsync();
    }
}
