// ============================================================
// Models/DTOs/ — Data Transfer Objects
//
// DTOs define the shape of API request/response data (not entities).
// Reasons to separate DTOs from entities:
//   1. Prevent sensitive data leaks (e.g. PasswordHash)
//   2. Clearly define request/response contracts
//   3. Enable validation before reaching the service layer
//
// Uses C# records for immutability and concise syntax.
// ============================================================
namespace CSNews.Models.DTOs;

// ============================================================
// AUTH
// ============================================================

/// <summary>Request body for POST /api/auth/register</summary>
public record RegisterRequest(string Username, string Email, string Password);

/// <summary>Request body for POST /api/auth/login</summary>
public record LoginRequest(string Email, string Password);

/// <summary>Response after successful login/register</summary>
public record AuthResponse(
    string Token,         // JWT token for Authorization: Bearer <token>
    UserResponse User
);

// ============================================================
// USER
// ============================================================

/// <summary>Safe user data (no PasswordHash exposed)</summary>
public record UserResponse(int Id, string Username, string Email, string Role, string? ProfileImage, bool IsActive = true);

// ============================================================
// ARTICLE
// ============================================================

/// <summary>Compact article DTO — used in list/grid views (GET /api/articles)</summary>
public record ArticleListResponse(
    int Id, string Title, string Slug, string Summary,
    string? ThumbnailUrl, string Status, int ViewCount, bool IsFeatured,
    int CategoryId, string CategoryName, string AuthorUsername,
    DateTime CreatedAt, DateTime? PublishedAt, List<string> Tags
);

/// <summary>Full article DTO — used in detail view (GET /api/articles/{slug})</summary>
public record ArticleDetailResponse(
    int Id, string Title, string Slug, string Summary, string Content,
    string? ThumbnailUrl, string Status, int ViewCount, bool IsFeatured,
    int CategoryId, string CategoryName, UserResponse Author,
    List<string> Tags, List<ArticleFileResponse> Files,
    DateTime CreatedAt, DateTime? PublishedAt
);

/// <summary>Request body for POST /api/articles</summary>
public record CreateArticleRequest(
    string Title, string Summary, string Content,
    int CategoryId, List<string>? Tags, bool IsFeatured = false
);

/// <summary>Request body for PUT /api/articles/{id}</summary>
public record UpdateArticleRequest(
    string Title, string Summary, string Content,
    int CategoryId, List<string>? Tags, bool IsFeatured, string Status,
    string? ThumbnailUrl = null
);

// ============================================================
// CATEGORY
// ============================================================

/// <summary>Response for GET /api/categories</summary>
public record CategoryResponse(int Id, string Name, string Slug, string? Description, bool IsActive, int ArticleCount);

/// <summary>Request body for POST /api/categories</summary>
public record CreateCategoryRequest(string Name, string? Description);

/// <summary>Request body for PUT /api/categories/{id}</summary>
public record UpdateCategoryRequest(string Name, string? Description, bool IsActive);

// ============================================================
// FILE
// ============================================================

/// <summary>Article file attachment DTO</summary>
public record ArticleFileResponse(
    int Id, string FileName, string OriginalFileName,
    string FilePath, string FileType, long FileSize
);

/// <summary>Response after successful file upload</summary>
public record UploadResponse(string FileName, string FilePath, string FileType, long FileSize);

// ============================================================
// PAGINATION + API WRAPPER
// ============================================================

/// <summary>Paginated response with metadata</summary>
public record PagedResponse<T>(List<T> Items, int TotalCount, int Page, int PageSize, int TotalPages);

/// <summary>Standard API response wrapper</summary>
public record ApiResponse<T>(bool Success, T Data, string? Message = null);

// ============================================================
// USER MANAGEMENT
// ============================================================

/// <summary>Response for GET /api/users — includes role counts</summary>
public record UserListResponse(
    List<UserResponse> Items, int TotalCount, int Page, int PageSize, int TotalPages,
    int AdminCount, int EditorCount
);

/// <summary>Request body for PATCH /api/users/{id}/role</summary>
public record ChangeRoleRequest(string Role);
