using CSNews.Data;
using CSNews.Models.DTOs;
using CSNews.Models.Entities;
using Microsoft.EntityFrameworkCore;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

// ============================================================
// Services/CategoryService.cs
// ============================================================
namespace CSNews.Services;

public interface ICategoryService
{
    Task<IEnumerable<CategoryResponse>> GetAllAsync(bool activeOnly = false);
    Task<CategoryResponse> CreateAsync(CreateCategoryRequest req);
    Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest req);
    Task DeleteAsync(int id);
}

public class CategoryService(AppDbContext db) : ICategoryService
{
    public async Task<IEnumerable<CategoryResponse>> GetAllAsync(bool activeOnly = false)
    {
        var q = db.Categories.AsQueryable();
        if (activeOnly) q = q.Where(c => c.IsActive);

        var cats = await q.Select(c => new CategoryResponse(
            c.Id, c.Name, c.Slug, c.Description, c.IsActive, c.Articles.Count
        )).ToListAsync();

        return cats;
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest req)
    {
        if (await db.Categories.AnyAsync(c => c.Name == req.Name))
            throw new Exception("Category already exists");

        var cat = new Category
        {
            Name = req.Name,
            Slug = req.Name.ToLower().Replace(" ", "-"),
            Description = req.Description,
            IsActive = true
        };

        db.Categories.Add(cat);
        await db.SaveChangesAsync();

        return new CategoryResponse(cat.Id, cat.Name, cat.Slug, cat.Description, cat.IsActive, 0);
    }

    public async Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest req)
    {
        var cat = await db.Categories.FindAsync(id) ?? throw new Exception("Category not found");

        if (req.Name != cat.Name && await db.Categories.AnyAsync(c => c.Name == req.Name))
            throw new Exception("Category name is already in use");

        cat.Name = req.Name;
        cat.Slug = req.Name.ToLower().Replace(" ", "-");
        cat.Description = req.Description;
        cat.IsActive = req.IsActive;

        await db.SaveChangesAsync();

        return new CategoryResponse(cat.Id, cat.Name, cat.Slug, cat.Description, cat.IsActive, cat.Articles?.Count ?? 0);
    }

    public async Task DeleteAsync(int id)
    {
        var cat = await db.Categories.FindAsync(id) ?? throw new Exception("Category not found");
        db.Categories.Remove(cat);
        await db.SaveChangesAsync();
    }
}

// ============================================================
// Services/FileService.cs — Cloudinary file upload/delete
// ============================================================
public interface IFileService
{
    Task<UploadResponse> UploadAsync(IFormFile file, string folder = "general");
    Task<UploadResponse> UploadArticleFileAsync(IFormFile file, int articleId);
    Task DeleteAsync(string filePath);
}

public class FileService : IFileService
{
    private readonly AppDbContext _db;
    private readonly ILogger<FileService> _logger;
    private readonly Cloudinary _cloudinary;
    private const long MaxBytes = 10 * 1024 * 1024; // 10 MB

    /// <summary>Allowed MIME types per upload folder.</summary>
    private static readonly Dictionary<string, string[]> Allowed = new()
    {
        ["images"]   = ["image/jpeg", "image/png", "image/webp", "image/gif"],
        ["articles"] = ["image/jpeg", "image/png", "image/webp",
                        "application/pdf", "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        ["general"]  = ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    };

    public FileService(IConfiguration config, AppDbContext db, ILogger<FileService> logger)
    {
        _db = db;
        _logger = logger;

        var url = config["CloudinaryUrl"];
        if (string.IsNullOrEmpty(url))
            throw new Exception("CloudinaryUrl is missing in appsettings.json. Please set it to enable file uploads.");

        _cloudinary = new Cloudinary(url);
    }

    public async Task<UploadResponse> UploadAsync(IFormFile file, string folder = "general")
    {
        if (file.Length == 0)       throw new ArgumentException("File is empty");
        if (file.Length > MaxBytes) throw new ArgumentException("File exceeds 10 MB limit");
        if (Allowed.TryGetValue(folder, out var types) && !types.Contains(file.ContentType))
            throw new ArgumentException($"File type {file.ContentType} is not allowed");

        var fileType = GetFileType(file.ContentType);
        var uploadParams = new RawUploadParams
        {
            File = new FileDescription(file.FileName, file.OpenReadStream()),
            Folder = $"csnews/{folder}"
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error != null)
            throw new Exception($"Cloudinary Upload Error: {result.Error.Message}");

        _logger.LogInformation("Uploaded to Cloudinary: {Url}", result.SecureUrl.ToString());

        return new UploadResponse(result.PublicId, result.SecureUrl.ToString(), fileType, file.Length);
    }

    public async Task<UploadResponse> UploadArticleFileAsync(IFormFile file, int articleId)
    {
        var result = await UploadAsync(file, "articles");
        _db.ArticleFiles.Add(new ArticleFile
        {
            FileName         = result.FileName,     // Stores Cloudinary PublicId
            OriginalFileName = file.FileName,
            FilePath         = result.FilePath,      // Stores Cloudinary SecureUrl
            FileType         = result.FileType,
            FileSize         = result.FileSize,
            ArticleId        = articleId
        });
        await _db.SaveChangesAsync();
        return result;
    }

    public async Task DeleteAsync(string filePath)
    {
        var publicId = filePath;

        // If the path looks like a Cloudinary URL, extract the public ID
        if (filePath.Contains("cloudinary.com"))
        {
            var uri = new Uri(filePath);
            var segments = uri.Segments;
            var lastSegment = segments.Last();
            var nameWithoutExt = Path.GetFileNameWithoutExtension(lastSegment);
            try
            {
               var folderPath = string.Join("", segments.Skip(Array.IndexOf(segments, "csnews/") + 1).Take(segments.Length - Array.IndexOf(segments, "csnews/") - 2));
               publicId = $"csnews/{folderPath}{nameWithoutExt}";
            }
            catch
            {
               publicId = $"csnews/{nameWithoutExt}";
            }
        }
        else if (filePath.StartsWith("/uploads"))
        {
            // Legacy local file path — skip Cloudinary deletion
            return;
        }

        var deletionParams = new DeletionParams(publicId);
        await _cloudinary.DestroyAsync(deletionParams);
        _logger.LogInformation("Deleted from Cloudinary: {PublicId}", publicId);
    }

    /// <summary>Maps a MIME content type to a simplified file type category.</summary>
    private static string GetFileType(string ct) => ct switch
    {
        var t when t.StartsWith("image/") => "image",
        var t when t.StartsWith("video/") => "video",
        _ => "document"
    };
}