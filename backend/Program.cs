// ============================================================
// Program.cs — จุดเริ่มต้นของโปรแกรม
//
// ทุกอย่างเริ่มที่นี่:
//   1. สร้าง WebApplication Builder
//   2. Register Services เข้า DI Container
//   3. ตั้งค่า Middleware Pipeline
//   4. Auto-migrate Database
//   5. เริ่ม Server
//
// DI (Dependency Injection):
//   builder.Services.AddScoped<IXxx, Xxx>()
//   = ทุกครั้งที่ Controller ต้องการ IXxx
//     .NET จะสร้าง Xxx ให้อัตโนมัติ
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

// ── 1. Database ───────────────────────────────────────────────────────────────
// เลือกใช้ SQLite (ไม่ต้องติดตั้ง SQL Server)
// เปลี่ยนเป็น UseSqlServer(...) เมื่อ deploy จริง
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite("Data Source=csnews.db"));

// ── 2. JWT Authentication ─────────────────────────────────────────────────────
// ตั้งค่า JWT Bearer Token validation
var jwtKey = builder.Configuration["Jwt:SecretKey"]!;
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
            ClockSkew                = TimeSpan.Zero  // ไม่มี grace period
        };
    });

builder.Services.AddAuthorization();

// ── 3. Register Services (Dependency Injection) ───────────────────────────────
// AddScoped = สร้างใหม่ต่อ 1 HTTP Request
// Interface → Implementation (Loose coupling)
builder.Services.AddScoped<IAuthService,     AuthService>();
builder.Services.AddScoped<IArticleService,  ArticleService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IFileService,     FileService>();

// ── 4. CORS — อนุญาต Frontend เชื่อมต่อ ──────────────────────────────────────
builder.Services.AddCors(opt => opt.AddPolicy("FrontendPolicy", p =>
    p.WithOrigins(builder.Configuration["AllowedOrigins"] ?? "http://localhost:5173")
     .AllowAnyMethod()
     .AllowAnyHeader()
     .AllowCredentials()));

// ── 5. Controllers + Swagger ──────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "CSNews API",
        Version     = "v1",
        Description = "API สำหรับเว็บข่าว CSNews"
    });

    // เพิ่มปุ่ม Authorize ใน Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name        = "Authorization",
        Type        = SecuritySchemeType.Http,
        Scheme      = "bearer",
        BearerFormat = "JWT",
        In          = ParameterLocation.Header,
        Description = "ใส่ JWT Token ที่ได้จาก /api/auth/login"
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

// File upload size limit (50MB)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
    o.MultipartBodyLengthLimit = 50 * 1024 * 1024);

// ── Build App ─────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Middleware Pipeline (ลำดับสำคัญมาก!) ────────────────────────────────────
// 1. Global Error Handler — ต้องอยู่ก่อนสุด
app.UseMiddleware<ExceptionMiddleware>();

// 2. Swagger UI (เฉพาะ Development)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CSNews API v1");
        c.RoutePrefix = "swagger";  // เข้าถึงที่ /swagger
    });
}

// 3. Static Files — serve ไฟล์จาก wwwroot/ สร้างโฟลเดอร์อัตโนมัติถ้าไม่มี
var wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
Directory.CreateDirectory(Path.Combine(wwwrootPath, "uploads", "images"));
Directory.CreateDirectory(Path.Combine(wwwrootPath, "uploads", "articles"));
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(wwwrootPath),
    RequestPath  = ""
});

// 4. CORS — ต้องก่อน Authentication
app.UseCors("FrontendPolicy");

// 5. Authentication — ตรวจสอบ JWT Token
app.UseAuthentication();

// 6. Custom JWT Middleware — รองรับ Cookie token เพิ่มเติม
app.UseMiddleware<JwtMiddleware>();

// 7. Authorization — ตรวจสอบ [Authorize] บน Controller
app.UseAuthorization();

// 8. Map Controllers
app.MapControllers();

// ── Auto-migrate Database ─────────────────────────────────────────────────────
// สร้าง/อัปเดต Database อัตโนมัติตอน Startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();
