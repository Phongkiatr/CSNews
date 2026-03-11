// ============================================================
// Program.cs — Application entry point
//
// Startup sequence:
//   1. Create WebApplication Builder
//   2. Register services into DI container
//   3. Configure middleware pipeline
//   4. Auto-migrate database
//   5. Start server
// ============================================================

using System.Text;
using CSNews.Data;
using CSNews.Middleware;
using CSNews.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// --- 1. Database (PostgreSQL) ---
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
       .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// --- 2. JWT Authentication ---
var jwtKey = builder.Configuration["Jwt:SecretKey"]!;
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.StartsWith("SET_VIA_"))
    throw new InvalidOperationException(
        "Jwt:SecretKey is not configured — set it via environment variable 'Jwt__SecretKey' or in appsettings.Development.json");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer           = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidateAudience         = true,
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            ValidateLifetime         = true,
            ClockSkew                = TimeSpan.Zero  // No grace period
        };
    });

builder.Services.AddAuthorization();

// --- 3. Register Services (DI: Scoped = new instance per HTTP request) ---
builder.Services.AddScoped<IAuthService,     AuthService>();
builder.Services.AddScoped<IArticleService,  ArticleService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IFileService,     FileService>();
builder.Services.AddScoped<IUserService,     UserService>();

// --- 4. CORS — allow frontend connections ---
builder.Services.AddCors(opt => opt.AddPolicy("FrontendPolicy", p =>
    p.SetIsOriginAllowed(_ => true)
     .AllowAnyMethod()
     .AllowAnyHeader()
     .AllowCredentials()));

// --- 5. Controllers + Swagger ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "CSNews API",
        Version     = "v1",
        Description = "REST API for the CSNews platform"
    });

    // Add Authorize button in Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name        = "Authorization",
        Type        = SecuritySchemeType.Http,
        Scheme      = "bearer",
        BearerFormat = "JWT",
        In          = ParameterLocation.Header,
        Description = "Enter the JWT token obtained from /api/auth/login"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
        },
        Array.Empty<string>()
    }});
});

// File upload size limit (50 MB)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
    o.MultipartBodyLengthLimit = 50 * 1024 * 1024);

// --- Build App ---
var app = builder.Build();

// --- Middleware Pipeline (order matters!) ---

// 1. Global error handler — must be first
app.UseMiddleware<ExceptionMiddleware>();

// 2. Swagger UI (development only)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CSNews API v1");
        c.RoutePrefix = "swagger";
    });
}

// 3. Static files — serve from wwwroot/, auto-create upload directories
var wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
Directory.CreateDirectory(Path.Combine(wwwrootPath, "uploads", "images"));
Directory.CreateDirectory(Path.Combine(wwwrootPath, "uploads", "articles"));
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(wwwrootPath),
    RequestPath  = ""
});

// 4. CORS — must come before authentication
app.UseCors("FrontendPolicy");

// 5. Authentication — validate JWT token
app.UseAuthentication();

// 6. Custom JWT middleware — supports cookie-based tokens
app.UseMiddleware<JwtMiddleware>();

// 7. Authorization — enforce [Authorize] on controllers
app.UseAuthorization();

// --- 6. Health check endpoint ---
app.MapMethods("/api/health", new[] { "GET", "HEAD" }, () => Results.Ok(new { Status = "OK", Message = "Backend is alive" }));

// --- 7. Map Controllers ---
app.MapControllers();

// --- Auto-migrate database on startup ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    // Seed default admin account
    if (!db.Users.Any(u => u.Email == "admin@csnews.com"))
    {
        db.Users.Add(new CSNews.Models.Entities.User
        {
            Username     = "admin",
            Email        = "admin@csnews.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin"),
            Role         = "Admin",
            IsActive     = true,
            CreatedAt    = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }
}

app.Run();
