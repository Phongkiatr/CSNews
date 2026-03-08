// ============================================================
// Services/ArticleService.cs — Business Logic ของบทความ
//
// รับผิดชอบ CRUD ของบทความทั้งหมด:
//   GetPublished  : ดูข่าว Published (สำหรับทุกคน)
//   GetAll        : ดูทุกสถานะ (Editor/Admin)
//   GetBySlug     : ดูบทความ + เพิ่ม ViewCount
//   Create        : สร้างบทความ + สร้าง Tag อัตโนมัติ
//   Update        : แก้ไข (Owner หรือ Admin เท่านั้น)
//   Delete        : ลบ (Owner หรือ Admin เท่านั้น)
//   Publish       : เปลี่ยนสถานะเป็น Published
// ============================================================
using CSNews.Data;
using CSNews.Models.DTOs;
using CSNews.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CSNews.Services;

public interface IArticleService
{
    Task<PagedResponse<ArticleListResponse>> GetPublishedAsync(int page, int pageSize, int? categoryId, string? search);
    Task<PagedResponse<ArticleListResponse>> GetAllAsync(int page, int pageSize, string? status);
    Task<PagedResponse<ArticleListResponse>> GetMyArticlesAsync(int userId, int page, int pageSize, string? status);

    Task<ArticleDetailResponse> GetBySlugAsync(string slug, bool isAuthenticated);
    Task<ArticleDetailResponse> GetByIdAsync(int id);
    Task<ArticleDetailResponse> CreateAsync(CreateArticleRequest req, int authorId);
    Task<ArticleDetailResponse> UpdateAsync(int id, UpdateArticleRequest req, int userId, string role);
    Task DeleteAsync(int id, int userId, string role);
    Task PublishAsync(int id);


}

public class ArticleService(AppDbContext db) : IArticleService
{
    // ── Public: เฉพาะ Published ──────────────────────────────
    public async Task<PagedResponse<ArticleListResponse>> GetPublishedAsync(
        int page, int pageSize, int? categoryId, string? search)
    {
        var q = db.Articles
            .Include(a => a.Author)
            .Include(a => a.Category)
            .Include(a => a.ArticleTags).ThenInclude(at => at.Tag)
            .Where(a => a.Status == "Published");

        if (categoryId.HasValue)
            q = q.Where(a => a.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(a => a.Title.Contains(search) || a.Summary.Contains(search));

        return await ToPagedAsync(q.OrderByDescending(a => a.PublishedAt), page, pageSize);
    }

    public async Task<PagedResponse<ArticleListResponse>> GetMyArticlesAsync(
    int userId, int page, int pageSize, string? status)
    {
        var q = db.Articles
            .Include(a => a.Author)
            .Include(a => a.Category)
            .Include(a => a.ArticleTags).ThenInclude(at => at.Tag)
            .Where(a => a.AuthorId == userId);

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(a => a.Status == status);

        return await ToPagedAsync(q.OrderByDescending(a => a.CreatedAt), page, pageSize);
    }

    // ── Admin: ดูทุกสถานะ ────────────────────────────────────
    public async Task<PagedResponse<ArticleListResponse>> GetAllAsync(
        int page, int pageSize, string? status)
    {
        var q = db.Articles
            .Include(a => a.Author)
            .Include(a => a.Category)
            .Include(a => a.ArticleTags).ThenInclude(at => at.Tag)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(a => a.Status == status);

        return await ToPagedAsync(q.OrderByDescending(a => a.CreatedAt), page, pageSize);
    }

    // ── Detail + เพิ่ม ViewCount ─────────────────────────────
    public async Task<ArticleDetailResponse> GetBySlugAsync(string slug, bool isAuthenticated)
    {
        var q = db.Articles
            .Include(a => a.Author)
            .Include(a => a.Category)
            .Include(a => a.ArticleTags).ThenInclude(at => at.Tag)
            .Include(a => a.Files)
            .Where(a => a.Slug == slug);

        // ถ้าไม่ได้ Login ดูได้เฉพาะ Published
        if (!isAuthenticated)
            q = q.Where(a => a.Status == "Published");

        var article = await q.FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("ไม่พบบทความ");

        article.ViewCount++;
        await db.SaveChangesAsync();

        return ToDetailDto(article);
    }

    public async Task<ArticleDetailResponse> GetByIdAsync(int id)
    {
        var article = await db.Articles
            .Include(a => a.Author)
            .Include(a => a.Category)
            .Include(a => a.ArticleTags).ThenInclude(at => at.Tag)
            .Include(a => a.Files)
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException("ไม่พบบทความ");

        return ToDetailDto(article);
    }

    // ── Create ───────────────────────────────────────────────
    public async Task<ArticleDetailResponse> CreateAsync(CreateArticleRequest req, int authorId)
    {
        // สร้าง slug จาก title
        var slug = MakeSlug(req.Title);
        if (await db.Articles.AnyAsync(a => a.Slug == slug))
            slug = $"{slug}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

        var article = new Article
        {
            Title = req.Title,
            Slug = slug,
            Summary = req.Summary,
            Content = req.Content,
            CategoryId = req.CategoryId,
            AuthorId = authorId,
            IsFeatured = req.IsFeatured,
            Status = "Draft"
        };

        // สร้าง Tag อัตโนมัติถ้ายังไม่มี
        if (req.Tags?.Any() == true)
        {
            foreach (var tagName in req.Tags.Where(t => !string.IsNullOrWhiteSpace(t)))
            {
                var tag = await db.Tags.FirstOrDefaultAsync(t => t.Name == tagName)
                    ?? new Tag { Name = tagName, Slug = MakeSlug(tagName) };

                if (tag.Id == 0) db.Tags.Add(tag);
                article.ArticleTags.Add(new ArticleTag { Tag = tag });
            }
        }

        db.Articles.Add(article);
        await db.SaveChangesAsync();
        return await GetByIdAsync(article.Id);
    }

    // ── Update ───────────────────────────────────────────────
    public async Task<ArticleDetailResponse> UpdateAsync(
        int id, UpdateArticleRequest req, int userId, string role)
    {
        var article = await db.Articles
            .Include(a => a.ArticleTags)
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException("ไม่พบบทความ");

        // เฉพาะเจ้าของหรือ Admin เท่านั้น
        if (role != "Admin" && article.AuthorId != userId)
            throw new UnauthorizedAccessException("ไม่มีสิทธิ์แก้ไขบทความนี้");

        article.Title = req.Title;
        article.Summary = req.Summary;
        article.Content = req.Content;
        article.CategoryId = req.CategoryId;
        article.IsFeatured = req.IsFeatured;
        article.UpdatedAt = DateTime.UtcNow;

        if (req.ThumbnailUrl != null)
            article.ThumbnailUrl = req.ThumbnailUrl;

        if (req.Status == "Published" && article.Status != "Published")
            article.PublishedAt = DateTime.UtcNow;
        article.Status = req.Status;

        // อัปเดต Tags
        db.ArticleTags.RemoveRange(article.ArticleTags);
        if (req.Tags?.Any() == true)
        {
            foreach (var tagName in req.Tags.Where(t => !string.IsNullOrWhiteSpace(t)))
            {
                var tag = await db.Tags.FirstOrDefaultAsync(t => t.Name == tagName)
                    ?? new Tag { Name = tagName, Slug = MakeSlug(tagName) };
                if (tag.Id == 0) db.Tags.Add(tag);
                article.ArticleTags.Add(new ArticleTag { Tag = tag });
            }
        }

        await db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    // ── Delete ───────────────────────────────────────────────
    public async Task DeleteAsync(int id, int userId, string role)
    {
        var article = await db.Articles.FindAsync(id)
            ?? throw new KeyNotFoundException("ไม่พบบทความ");

        if (role != "Admin" && article.AuthorId != userId)
            throw new UnauthorizedAccessException("ไม่มีสิทธิ์ลบบทความนี้");

        db.Articles.Remove(article);
        await db.SaveChangesAsync();
    }

    // ── Publish ──────────────────────────────────────────────
    public async Task PublishAsync(int id)
    {
        var article = await db.Articles.FindAsync(id)
            ?? throw new KeyNotFoundException("ไม่พบบทความ");

        article.Status = "Published";
        article.PublishedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    // ── Private Helpers ──────────────────────────────────────
    private static async Task<PagedResponse<ArticleListResponse>> ToPagedAsync(
        IQueryable<Article> q, int page, int pageSize)
    {
        var total = await q.CountAsync();
        var items = await q
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(a => ToListDto(a))
            .ToListAsync();

        return new PagedResponse<ArticleListResponse>(
            items, total, page, pageSize,
            (int)Math.Ceiling((double)total / pageSize));
    }

    private static ArticleListResponse ToListDto(Article a) => new(
        a.Id, a.Title, a.Slug, a.Summary, a.ThumbnailUrl,
        a.Status, a.ViewCount, a.IsFeatured,
        a.CategoryId, a.Category.Name, a.Author.Username,
        a.CreatedAt, a.PublishedAt,
        a.ArticleTags.Select(at => at.Tag.Name).ToList()
    );

    private static ArticleDetailResponse ToDetailDto(Article a) => new(
        a.Id, a.Title, a.Slug, a.Summary, a.Content, a.ThumbnailUrl,
        a.Status, a.ViewCount, a.IsFeatured,
        a.CategoryId, a.Category.Name,
        new UserResponse(a.Author.Id, a.Author.Username, a.Author.Email, a.Author.Role, a.Author.ProfileImage),
        a.ArticleTags.Select(at => at.Tag.Name).ToList(),
        a.Files.Select(f => new ArticleFileResponse(
            f.Id, f.FileName, f.OriginalFileName, f.FilePath, f.FileType, f.FileSize)).ToList(),
        a.CreatedAt, a.PublishedAt
    );

    // สร้าง slug จากข้อความ (รองรับภาษาไทย)
    private static string MakeSlug(string text) =>
        System.Text.RegularExpressions.Regex
            .Replace(text.ToLowerInvariant().Trim(), @"[^a-z0-9\u0E00-\u0E7F]+", "-")
            .Trim('-');
}
