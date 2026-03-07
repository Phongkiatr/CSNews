using CSNews.Models.DTOs;
using CSNews.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

// ============================================================
// Controllers/CategoriesController.cs
// ============================================================
namespace CSNews.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController(ICategoryService categories) : ControllerBase
{
    // GET /api/categories
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await categories.GetAllAsync();
        return Ok(new ApiResponse<List<CategoryResponse>>(true, result));
    }
}

// ============================================================
// Controllers/UploadController.cs
// ============================================================
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UploadController(IFileService files) : ControllerBase
{
    // POST /api/upload/image
    [HttpPost("image")]
    public async Task<IActionResult> Image(IFormFile file)
    {
        var result = await files.UploadAsync(file, "images");
        return Ok(new ApiResponse<UploadResponse>(true, result));
    }

    // POST /api/upload/article/{articleId}
    [HttpPost("article/{articleId:int}")]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<IActionResult> ArticleFile(IFormFile file, int articleId)
    {
        var result = await files.UploadArticleFileAsync(file, articleId);
        return Ok(new ApiResponse<UploadResponse>(true, result));
    }

    // POST /api/upload/multiple?folder=images
    [HttpPost("multiple")]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<IActionResult> Multiple(List<IFormFile> fileList, [FromQuery] string folder = "general")
    {
        var results = new List<UploadResponse>();
        foreach (var f in fileList)
            results.Add(await files.UploadAsync(f, folder));
        return Ok(new ApiResponse<List<UploadResponse>>(true, results));
    }

    // DELETE /api/upload?filePath=/uploads/images/xxx.jpg
    [HttpDelete]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete([FromQuery] string filePath)
    {
        await files.DeleteAsync(filePath);
        return Ok(new ApiResponse<string>(true, "ลบไฟล์สำเร็จ"));
    }
}
