// ============================================================
// Models/DTOs/ — Data Transfer Objects
//
// DTO = รูปแบบข้อมูลที่ส่งรับผ่าน API (ไม่ใช่ Entity โดยตรง)
// เหตุผลที่ต้องมี DTO แยกจาก Entity:
//   1. ป้องกันข้อมูลรั่ว เช่น PasswordHash
//   2. กำหนด shape ของ Request/Response ได้ชัดเจน
//   3. Validation ก่อนถึง Service
//
// ใช้ record เพราะ immutable + เขียนกระชับ
// ============================================================
namespace CSNews.Models.DTOs;

// ============================================================
// AUTH
// ============================================================

/// <summary>Body ของ POST /api/auth/register</summary>
public record RegisterRequest(string Username, string Email, string Password);

/// <summary>Body ของ POST /api/auth/login</summary>
public record LoginRequest(string Email, string Password);

/// <summary>Response หลัง Login/Register สำเร็จ</summary>
public record AuthResponse(
    string Token,         // JWT ใส่ใน Authorization: Bearer <token>
    UserResponse User
);

// ============================================================
// USER
// ============================================================

/// <summary>ข้อมูล User ที่ปลอดภัย (ไม่มี PasswordHash)</summary>
public record UserResponse(int Id, string Username, string Email, string Role, string? ProfileImage, bool IsActive = true);

// ============================================================
// ARTICLE
// ============================================================

/// <summary>บทความแบบย่อ — ใช้แสดงใน List/Grid (GET /api/articles)</summary>
public record ArticleListResponse(
    int Id, string Title, string Slug, string Summary,
    string? ThumbnailUrl, string Status, int ViewCount, bool IsFeatured,
    int CategoryId, string CategoryName, string AuthorUsername,
    DateTime CreatedAt, DateTime? PublishedAt, List<string> Tags
);

/// <summary>บทความแบบเต็ม — ใช้แสดง Detail (GET /api/articles/{slug})</summary>
public record ArticleDetailResponse(
    int Id, string Title, string Slug, string Summary, string Content,
    string? ThumbnailUrl, string Status, int ViewCount, bool IsFeatured,
    int CategoryId, string CategoryName, UserResponse Author,
    List<string> Tags, List<ArticleFileResponse> Files,
    DateTime CreatedAt, DateTime? PublishedAt
);

/// <summary>Body ของ POST /api/articles</summary>
public record CreateArticleRequest(
    string Title, string Summary, string Content,
    int CategoryId, List<string>? Tags, bool IsFeatured = false
);

/// <summary>Body ของ PUT /api/articles/{id}</summary>
public record UpdateArticleRequest(
    string Title, string Summary, string Content,
    int CategoryId, List<string>? Tags, bool IsFeatured, string Status,
    string? ThumbnailUrl = null
);

// ============================================================
// CATEGORY
// ============================================================

/// <summary>Response ของ GET /api/categories</summary>
public record CategoryResponse(int Id, string Name, string Slug, string? Description, bool IsActive, int ArticleCount);

/// <summary>Body ของ POST /api/categories</summary>
public record CreateCategoryRequest(string Name, string? Description);

/// <summary>Body ของ PUT /api/categories/{id}</summary>
public record UpdateCategoryRequest(string Name, string? Description, bool IsActive);

// ============================================================
// FILE
// ============================================================

/// <summary>ไฟล์แนบในบทความ</summary>
public record ArticleFileResponse(
    int Id, string FileName, string OriginalFileName,
    string FilePath, string FileType, long FileSize
);

/// <summary>Response หลัง Upload สำเร็จ</summary>
public record UploadResponse(string FileName, string FilePath, string FileType, long FileSize);

// ============================================================
// PAGINATION + API WRAPPER
// ============================================================

/// <summary>ข้อมูล Paginated — ส่งคืนพร้อม metadata หน้า</summary>
public record PagedResponse<T>(List<T> Items, int TotalCount, int Page, int PageSize, int TotalPages);

/// <summary>Wrapper มาตรฐานทุก API Response</summary>
public record ApiResponse<T>(bool Success, T Data, string? Message = null);

// ============================================================
// USER MANAGEMENT
// ============================================================

/// <summary>Response ของ GET /api/users — เพิ่มจำนวน Admin/Editor ทั้งหมด</summary>
public record UserListResponse(
    List<UserResponse> Items, int TotalCount, int Page, int PageSize, int TotalPages,
    int AdminCount, int EditorCount
);

/// <summary>Body ของ PATCH /api/users/{id}/role</summary>
public record ChangeRoleRequest(string Role);
