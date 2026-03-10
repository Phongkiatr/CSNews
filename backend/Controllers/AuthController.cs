using CSNews.Models.DTOs;
using CSNews.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CSNews.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        try
        {
            var res = await authService.RegisterAsync(req);
            return Ok(new ApiResponse<AuthResponse>(true, res));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiResponse<object>(false, null!, ex.Message));
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        try
        {
            var res = await authService.LoginAsync(req);
            return Ok(new ApiResponse<AuthResponse>(true, res));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ApiResponse<object>(false, null!, ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ApiResponse<object>(false, null!, ex.Message));
        }
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult GetMe()
    {
        var user = new
        {
            Id         = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!),
            Username   = User.FindFirstValue(ClaimTypes.Name),
            Email      = User.FindFirstValue(ClaimTypes.Email),
            Role       = User.FindFirstValue(ClaimTypes.Role)
        };
        return Ok(new ApiResponse<object>(true, user));
    }
}
