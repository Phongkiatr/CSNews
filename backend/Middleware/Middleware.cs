using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;

// ============================================================
// Middleware/ExceptionMiddleware.cs — Global error handler
// ============================================================
namespace CSNews.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleAsync(ctx, ex);
        }
    }

    private static async Task HandleAsync(HttpContext ctx, Exception ex)
    {
        ctx.Response.ContentType = "application/json";

        var (code, msg) = ex switch
        {
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized,       ex.Message),
            KeyNotFoundException        => (HttpStatusCode.NotFound,           ex.Message),
            ArgumentException           => (HttpStatusCode.BadRequest,         ex.Message),
            InvalidOperationException   => (HttpStatusCode.BadRequest,         ex.Message),
            _                           => (HttpStatusCode.InternalServerError, "Internal server error")
        };

        ctx.Response.StatusCode = (int)code;
        await ctx.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            success    = false,
            statusCode = (int)code,
            message    = msg,
            timestamp  = DateTime.UtcNow
        }));
    }
}

// ============================================================
// Middleware/JwtMiddleware.cs — JWT token validation
// Supports both Authorization header and cookie-based tokens.
// ============================================================
public class JwtMiddleware(RequestDelegate next, IConfiguration config, ILogger<JwtMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        var token = ExtractToken(ctx);
        if (!string.IsNullOrEmpty(token))
            AttachUser(ctx, token);

        await next(ctx);
    }

    /// <summary>Extracts the JWT token from the Authorization header or auth_token cookie.</summary>
    private static string? ExtractToken(HttpContext ctx)
    {
        var header = ctx.Request.Headers.Authorization.FirstOrDefault();
        if (header?.StartsWith("Bearer ") == true)
            return header["Bearer ".Length..].Trim();

        return ctx.Request.Cookies["auth_token"];
    }

    /// <summary>Validates the token and attaches the ClaimsPrincipal to the request context.</summary>
    private void AttachUser(HttpContext ctx, string token)
    {
        try
        {
            var key     = Encoding.UTF8.GetBytes(config["Jwt:SecretKey"]!);
            var handler = new JwtSecurityTokenHandler();

            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = new SymmetricSecurityKey(key),
                ValidateIssuer           = true,
                ValidIssuer              = config["Jwt:Issuer"],
                ValidateAudience         = true,
                ValidAudience            = config["Jwt:Audience"],
                ValidateLifetime         = true,
                ClockSkew                = TimeSpan.Zero
            }, out _);

            ctx.User = principal;
        }
        catch (Exception ex)
        {
            logger.LogDebug("JWT invalid: {Msg}", ex.Message);
        }
    }
}
