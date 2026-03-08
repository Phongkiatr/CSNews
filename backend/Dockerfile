# ============================================================
# Dockerfile — CSNews Backend
#
# Multi-stage build:
#   Stage 1 (build)  : compile .NET app
#   Stage 2 (runtime): รัน app บน image เล็กที่สุด
# ============================================================

# ── Stage 1: Build ─────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj และ restore ก่อน (cache layer)
COPY CSNews.csproj .
RUN dotnet restore

# Copy โค้ดทั้งหมดแล้ว publish
COPY . .
RUN dotnet publish -c Release -o /app/publish

# ── Stage 2: Runtime ───────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Copy ผลลัพธ์จาก build stage
COPY --from=build /app/publish .

# สร้างโฟลเดอร์ที่จำเป็น
RUN mkdir -p wwwroot/uploads/images wwwroot/uploads/articles

# SQLite db เก็บไว้ใน volume
VOLUME ["/app/data"]

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080
ENTRYPOINT ["dotnet", "CSNews.dll"]
