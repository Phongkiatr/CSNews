// ============================================================
// Controllers/ArticlesController.cs
// Route: /api/articles
// ============================================================
using System.Security.Claims;
using CSNews.Models.DTOs;
using CSNews.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CSNews.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticlesController(IArticleService articles) : ControllerBase
{
    // GET /api/articles
    // GET /api/articles?page=2&pageSize=9&categoryId=1&search=ai
    // สาธารณะ — ทุกคนดูได้ เฉพาะ Published
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] int    page       = 1,
        [FromQuery] int    pageSize   = 9,
        [FromQuery] int?   categoryId = null,
        [FromQuery] string? search    = null)
    {
        var result = await articles.GetPublishedAsync(page, pageSize, categoryId, search);
        return Ok(new ApiResponse<PagedResponse<ArticleListResponse>>(true, result));
    }

    // GET /api/articles/admin
    // GET /api/articles/admin?status=Draft&page=1
    // เฉพาะ Editor และ Admin — เห็นทุกสถานะ
    [HttpGet("admin")]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<IActionResult> GetAllAdmin(
        [FromQuery] int    page     = 1,
        [FromQuery] int    pageSize = 10,
        [FromQuery] string? status  = null)
    {
        var result = await articles.GetAllAsync(page, pageSize, status);
        return Ok(new ApiResponse<PagedResponse<ArticleListResponse>>(true, result));
    }

    // GET /api/articles/mine
    // ดูบทความของตัวเอง ทุกสถานะ
    [HttpGet("mine")]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<IActionResult> GetMine(
        [FromQuery] int     page     = 1,
        [FromQuery] int     pageSize = 10,
        [FromQuery] string? status   = null)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await articles.GetMyArticlesAsync(userId, page, pageSize, status);
        return Ok(new ApiResponse<PagedResponse<ArticleListResponse>>(true, result));
    }

    // GET /api/articles/{slug}
    // เช่น GET /api/articles/ai-news-2025
    // สาธารณะ — ถ้า Login จะเห็น Draft ของตัวเองด้วย
    [HttpGet("{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var isAuth = User.Identity?.IsAuthenticated ?? false;
        var result = await articles.GetBySlugAsync(slug, isAuth);
        return Ok(new ApiResponse<ArticleDetailResponse>(true, result));
    }

    // POST /api/articles
    // Body: { "title": "...", "summary": "...", "content": "...", "categoryId": 1 }
    // เฉพาะ Editor และ Admin
    [HttpPost]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateArticleRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await articles.CreateAsync(req, userId);

        // 201 Created พร้อม Location header
        return CreatedAtAction(nameof(GetBySlug), new { slug = result.Slug },
            new ApiResponse<ArticleDetailResponse>(true, result, "สร้างบทความสำเร็จ"));
    }

    // PUT /api/articles/{id}
    // Body: UpdateArticleRequest — แก้ไขทุก field
    // เจ้าของบทความหรือ Admin เท่านั้น (ตรวจใน Service)
    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateArticleRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role   = User.FindFirstValue(ClaimTypes.Role)!;
        var result = await articles.UpdateAsync(id, req, userId, role);
        return Ok(new ApiResponse<ArticleDetailResponse>(true, result, "แก้ไขบทความสำเร็จ"));
    }

    // DELETE /api/articles/{id}
    // เจ้าของบทความหรือ Admin เท่านั้น
    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role   = User.FindFirstValue(ClaimTypes.Role)!;
        await articles.DeleteAsync(id, userId, role);
        return Ok(new ApiResponse<string>(true, "ลบบทความสำเร็จ"));
    }

    // PATCH /api/articles/{id}/publish
    // เปลี่ยนสถานะจาก Draft → Published
    [HttpPatch("{id:int}/publish")]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<IActionResult> Publish(int id)
    {
        await articles.PublishAsync(id);
        return Ok(new ApiResponse<string>(true, "เผยแพร่บทความสำเร็จ"));
    }
}
