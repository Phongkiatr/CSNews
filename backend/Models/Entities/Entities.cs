// ============================================================
// Models/Entities/ — โมเดลที่ตรงกับตารางในฐานข้อมูล
//
// แต่ละ class = 1 ตารางใน SQL
// EF Core ใช้ไฟล์นี้สร้าง Migration และทำ Query
// ห้ามใช้ Entity ส่งออก API โดยตรง — ใช้ DTO แทน
// ============================================================
namespace CSNews.Models.Entities;

/// <summary>ตาราง Users — เก็บข้อมูลผู้ใช้ทุกคนในระบบ</summary>
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    /// Password ที่ผ่าน BCrypt Hash แล้ว — ไม่เคยเก็บ plain text
    public string PasswordHash { get; set; } = string.Empty;

    /// บทบาทในระบบ: Reader | Editor | Admin
    public string Role { get; set; } = "Reader";

    public string? ProfileImage { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties — EF Core ใช้ JOIN อัตโนมัติ
    public ICollection<Article> Articles { get; set; } = [];
    public ICollection<Comment> Comments { get; set; } = [];
}

/// <summary>ตาราง Articles — เก็บบทความทั้งหมด</summary>
public class Article
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;

    /// URL-friendly เช่น "ai-news-2025" (unique)
    public string Slug { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;  // ย่อหน้าแรก/สรุป
    public string Content { get; set; } = string.Empty;  // HTML เนื้อหาเต็ม
    public string? ThumbnailUrl { get; set; }

    /// วงจรชีวิต: Draft → Published → Archived
    public string Status { get; set; } = "Draft";

    public int ViewCount { get; set; } = 0;
    public bool IsFeatured { get; set; } = false;

    // Foreign Keys
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

/// <summary>ตาราง Categories — หมวดหมู่บทความ</summary>
public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;   // เช่น "เทคโนโลยี"
    public string Slug { get; set; } = string.Empty;   // เช่น "technology"
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Article> Articles { get; set; } = [];
}

/// <summary>ตาราง Tags — แท็กสำหรับค้นหา</summary>
public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    public ICollection<ArticleTag> ArticleTags { get; set; } = [];
}

/// <summary>ตาราง Junction — เชื่อม Article กับ Tag (Many-to-Many)</summary>
public class ArticleTag
{
    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;

    public int TagId { get; set; }
    public Tag Tag { get; set; } = null!;
}

/// <summary>ตาราง Comments — ความคิดเห็นใต้บทความ</summary>
public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsApproved { get; set; } = false;  // ต้องรอ Admin อนุมัติ
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
}

/// <summary>ตาราง ArticleFiles — ไฟล์แนบในบทความ</summary>
public class ArticleFile
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;          // ชื่อบน server
    public string OriginalFileName { get; set; } = string.Empty;  // ชื่อต้นฉบับ
    public string FilePath { get; set; } = string.Empty;          // URL path
    public string FileType { get; set; } = string.Empty;          // image | document
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;
}
