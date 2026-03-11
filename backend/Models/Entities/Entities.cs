// ============================================================
// Models/Entities/ — Database entity models
//
// Each class maps to one SQL table.
// EF Core uses these to generate migrations and execute queries.
// Never return entities directly in API responses — use DTOs.
// ============================================================
namespace CSNews.Models.Entities;

/// <summary>Users table — stores all registered users.</summary>
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    /// <summary>BCrypt-hashed password — never stored as plain text.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>User role: Reader | Editor | Admin</summary>
    public string Role { get; set; } = "Reader";

    public string? ProfileImage { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties — EF Core uses these for automatic JOINs
    public ICollection<Article> Articles { get; set; } = [];
    public ICollection<Comment> Comments { get; set; } = [];
}

/// <summary>Articles table — stores all articles (news/blog posts).</summary>
public class Article
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;

    /// <summary>URL-friendly identifier, e.g. "ai-news-2025" (unique).</summary>
    public string Slug { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;  // Short excerpt
    public string Content { get; set; } = string.Empty;  // Full HTML content
    public string? ThumbnailUrl { get; set; }

    /// <summary>Lifecycle: Draft → Published → Archived</summary>
    public string Status { get; set; } = "Draft";

    public int ViewCount { get; set; } = 0;
    public bool IsFeatured { get; set; } = false;

    // Foreign keys
    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }

    public ICollection<ArticleTag> ArticleTags { get; set; } = [];
    public ICollection<Comment> Comments { get; set; } = [];
    public ICollection<ArticleFile> Files { get; set; } = [];
}

/// <summary>Categories table — article categories.</summary>
public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Article> Articles { get; set; } = [];
}

/// <summary>Tags table — searchable tags for articles.</summary>
public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    public ICollection<ArticleTag> ArticleTags { get; set; } = [];
}

/// <summary>Junction table — many-to-many link between Article and Tag.</summary>
public class ArticleTag
{
    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;

    public int TagId { get; set; }
    public Tag Tag { get; set; } = null!;
}

/// <summary>Comments table — user comments on articles.</summary>
public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsApproved { get; set; } = false;  // Requires admin approval
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
}

/// <summary>ArticleFiles table — file attachments within articles.</summary>
public class ArticleFile
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;          // Server-side name
    public string OriginalFileName { get; set; } = string.Empty;  // Original upload name
    public string FilePath { get; set; } = string.Empty;          // URL path
    public string FileType { get; set; } = string.Empty;          // image | document
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;
}
