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
    // Public — only published articles
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
    // Editor/Admin only — all statuses visible
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
    // Current user's own articles (all statuses)
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
    // e.g. GET /api/articles/ai-news-2025
    // Public — authenticated users can also see their own drafts
    [HttpGet("{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var isAuth = User.Identity?.IsAuthenticated ?? false;
        int? userId = isAuth
            ? int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)
            : null;
        var result = await articles.GetBySlugAsync(slug, isAuth, userId);
        return Ok(new ApiResponse<ArticleDetailResponse>(true, result));
    }

    // POST /api/articles
    // Body: { "title": "...", "summary": "...", "content": "...", "categoryId": 1 }
    // Editor/Admin only
    [HttpPost]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateArticleRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await articles.CreateAsync(req, userId);

        // 201 Created with Location header
        return CreatedAtAction(nameof(GetBySlug), new { slug = result.Slug },
            new ApiResponse<ArticleDetailResponse>(true, result, "Article created successfully"));
    }

    // PUT /api/articles/{id}
    // Body: UpdateArticleRequest — update all fields
    // Article owner or Admin only (checked in service layer)
    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateArticleRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role   = User.FindFirstValue(ClaimTypes.Role)!;
        var result = await articles.UpdateAsync(id, req, userId, role);
        return Ok(new ApiResponse<ArticleDetailResponse>(true, result, "Article updated successfully"));
    }

    // DELETE /api/articles/{id}
    // Article owner or Admin only
    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role   = User.FindFirstValue(ClaimTypes.Role)!;
        await articles.DeleteAsync(id, userId, role);
        return Ok(new ApiResponse<string>(true, "Article deleted successfully"));
    }

    // PATCH /api/articles/{id}/publish
    // Change status from Draft → Published
    [HttpPatch("{id:int}/publish")]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<IActionResult> Publish(int id)
    {
        await articles.PublishAsync(id);
        return Ok(new ApiResponse<string>(true, "Article published successfully"));
    }
}
