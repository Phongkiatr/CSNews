// ============================================================
// Data/AppDbContext.cs — ประตูระหว่างโปรแกรมกับฐานข้อมูล
//
// DbContext คือ Unit of Work — รวม Query ทั้งหมดและ
// Commit ในครั้งเดียวด้วย SaveChangesAsync()
//
// ใช้งาน: Inject ผ่าน Constructor ใน Service
//   public class ArticleService(AppDbContext db) { ... }
// ============================================================
using CSNews.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CSNews.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // ── DbSet = ตารางในฐานข้อมูล ─────────────────────────────
    // db.Users.Where(...), db.Articles.Include(...) ฯลฯ
    public DbSet<User>        Users        => Set<User>();
    public DbSet<Article>     Articles     => Set<Article>();
    public DbSet<Category>    Categories   => Set<Category>();
    public DbSet<Tag>         Tags         => Set<Tag>();
    public DbSet<ArticleTag>  ArticleTags  => Set<ArticleTag>();
    public DbSet<Comment>     Comments     => Set<Comment>();
    public DbSet<ArticleFile> ArticleFiles => Set<ArticleFile>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        // ArticleTag ใช้ Composite PK (ไม่มี Id ของตัวเอง)
        mb.Entity<ArticleTag>().HasKey(at => new { at.ArticleId, at.TagId });

        // Restrict = ลบ User/Category ไม่ได้ถ้ายังมี Article ผูกอยู่
        mb.Entity<Article>()
            .HasOne(a => a.Author).WithMany(u => u.Articles)
            .HasForeignKey(a => a.AuthorId).OnDelete(DeleteBehavior.Restrict);

        mb.Entity<Article>()
            .HasOne(a => a.Category).WithMany(c => c.Articles)
            .HasForeignKey(a => a.CategoryId).OnDelete(DeleteBehavior.Restrict);

        mb.Entity<Comment>()
            .HasOne(c => c.User).WithMany(u => u.Comments)
            .HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Restrict);

        // Unique Index — ป้องกัน duplicate
        mb.Entity<User>().HasIndex(u => u.Email).IsUnique();
        mb.Entity<User>().HasIndex(u => u.Username).IsUnique();
        mb.Entity<Article>().HasIndex(a => a.Slug).IsUnique();
        mb.Entity<Category>().HasIndex(c => c.Slug).IsUnique();

        // Seed หมวดหมู่เริ่มต้น (ใส่ตอน migration ครั้งแรก)
        var t = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        mb.Entity<Category>().HasData(
            new Category { Id = 1, Name = "ข่าวทั่วไป", Slug = "general",       IsActive = true, CreatedAt = t },
            new Category { Id = 2, Name = "เทคโนโลยี",  Slug = "technology",    IsActive = true, CreatedAt = t },
            new Category { Id = 3, Name = "กีฬา",       Slug = "sports",        IsActive = true, CreatedAt = t },
            new Category { Id = 4, Name = "บันเทิง",    Slug = "entertainment", IsActive = true, CreatedAt = t },
            new Category { Id = 5, Name = "การเมือง",   Slug = "politics",      IsActive = true, CreatedAt = t },
            new Category { Id = 6, Name = "เศรษฐกิจ",  Slug = "economy",       IsActive = true, CreatedAt = t }
        );
    }
}
