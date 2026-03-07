// ใส่ using ทั้งหมดไว้บนสุดก่อนเสมอ
using CSNews.Data;
using CSNews.Models.DTOs;
using CSNews.Models.Entities;
using Microsoft.EntityFrameworkCore;

// ============================================================
// Services/CategoryService.cs
// ============================================================
namespace CSNews.Services;

public interface ICategoryService
{
    Task<List<CategoryResponse>> GetAllAsync();
}

public class CategoryService(AppDbContext db) : ICategoryService
{
    public async Task<List<CategoryResponse>> GetAllAsync() =>
        await db.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CategoryResponse(
                c.Id, c.Name, c.Slug, c.Description,
                c.Articles.Count(a => a.Status == "Published")))
            .ToListAsync();
}

// ============================================================
// Services/FileService.cs
// ============================================================
public interface IFileService
{
    Task<UploadResponse> UploadAsync(IFormFile file, string folder = "general");
    Task<UploadResponse> UploadArticleFileAsync(IFormFile file, int articleId);
    Task DeleteAsync(string filePath);
}

public class FileService(IWebHostEnvironment env, AppDbContext db, ILogger<FileService> logger) : IFileService
{
    private const long MaxBytes = 10 * 1024 * 1024;

    private static readonly Dictionary<string, string[]> Allowed = new()
    {
        ["images"]   = ["image/jpeg", "image/png", "image/webp", "image/gif"],
        ["articles"] = ["image/jpeg", "image/png", "image/webp",
                        "application/pdf", "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        ["general"]  = ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    };

    public async Task<UploadResponse> UploadAsync(IFormFile file, string folder = "general")
    {
        if (file.Length == 0)       throw new ArgumentException("ไฟล์ว่างเปล่า");
        if (file.Length > MaxBytes) throw new ArgumentException("ไฟล์ใหญ่เกิน 10MB");
        if (Allowed.TryGetValue(folder, out var types) && !types.Contains(file.ContentType))
            throw new ArgumentException($"ไม่อนุญาตประเภทไฟล์ {file.ContentType}");

        var ext     = Path.GetExtension(file.FileName);
        var newName = $"{Guid.NewGuid()}{ext}";
        var dir     = Path.Combine(env.WebRootPath, "uploads", folder);
        Directory.CreateDirectory(dir);

        var fullPath = Path.Combine(dir, newName);
        await using var stream = new FileStream(fullPath, FileMode.Create);
        await file.CopyToAsync(stream);

        var urlPath = $"/uploads/{folder}/{newName}";
        logger.LogInformation("Uploaded: {Path}", urlPath);

        return new UploadResponse(newName, urlPath, GetFileType(file.ContentType), file.Length);
    }

    public async Task<UploadResponse> UploadArticleFileAsync(IFormFile file, int articleId)
    {
        var result = await UploadAsync(file, "articles");
        db.ArticleFiles.Add(new ArticleFile
        {
            FileName         = result.FileName,
            OriginalFileName = file.FileName,
            FilePath         = result.FilePath,
            FileType         = result.FileType,
            FileSize         = result.FileSize,
            ArticleId        = articleId
        });
        await db.SaveChangesAsync();
        return result;
    }

    public Task DeleteAsync(string filePath)
    {
        var full = Path.Combine(env.WebRootPath,
            filePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(full)) File.Delete(full);
        return Task.CompletedTask;
    }

    private static string GetFileType(string ct) => ct switch
    {
        var t when t.StartsWith("image/") => "image",
        var t when t.StartsWith("video/") => "video",
        _ => "document"
    };
}
