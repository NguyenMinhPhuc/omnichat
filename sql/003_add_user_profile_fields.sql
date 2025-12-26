-- Migration: add PhoneNumber and AvatarUrl to dbo.Users and update related stored procedures
-- Run this against the OmniChat database.

USE OmniChat;
GO

-- Add columns if missing
IF COL_LENGTH('dbo.Users', 'PhoneNumber') IS NULL
BEGIN
  ALTER TABLE dbo.Users ADD PhoneNumber NVARCHAR(64) NULL;
END
GO

IF COL_LENGTH('dbo.Users', 'AvatarUrl') IS NULL
BEGIN
  ALTER TABLE dbo.Users ADD AvatarUrl NVARCHAR(512) NULL;
END
GO

-- Recreate spUsers_List
IF OBJECT_ID('dbo.spUsers_List', 'P') IS NOT NULL DROP PROCEDURE dbo.spUsers_List;
GO
CREATE PROCEDURE dbo.spUsers_List
  @Search NVARCHAR(256) = NULL,
  @Role NVARCHAR(64) = NULL,
  @Status NVARCHAR(32) = NULL,
  @SortBy NVARCHAR(64) = 'updatedAt',
  @SortDir NVARCHAR(4) = 'DESC',
  @Skip INT = 0,
  @Take INT = 100
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @SearchTrim NVARCHAR(256) = NULL;
  IF @Search IS NOT NULL SET @SearchTrim = LTRIM(RTRIM(@Search));

  SELECT UserId AS userId,
    Email AS email,
    DisplayName AS displayName,
    PhoneNumber AS phoneNumber,
    AvatarUrl AS avatarUrl,
    PasswordHash AS passwordHash,
    Role AS role,
    Status AS status,
    GeminiApiKey AS geminiApiKey,
    KnowledgeBase AS knowledgeBase,
    CanManageApiKey AS canManageApiKey,
    CreatedAt AS createdAt,
    UpdatedAt AS updatedAt
  FROM dbo.Users
  WHERE (@SearchTrim IS NULL OR (
      LOWER(UserId) LIKE '%' + LOWER(@SearchTrim) + '%' OR
    LOWER(Email) LIKE '%' + LOWER(@SearchTrim) + '%' OR
    LOWER(DisplayName) LIKE '%' + LOWER(@SearchTrim) + '%'
    ))
    AND (@Role IS NULL OR Role = @Role)
    AND (@Status IS NULL OR Status = @Status)
  ORDER BY
    CASE WHEN LOWER(@SortBy) = 'email' AND LOWER(@SortDir) = 'asc' THEN Email END ASC,
    CASE WHEN LOWER(@SortBy) = 'email' AND LOWER(@SortDir) = 'desc' THEN Email END DESC,
    CASE WHEN LOWER(@SortBy) = 'displayname' AND LOWER(@SortDir) = 'asc' THEN DisplayName END ASC,
    CASE WHEN LOWER(@SortBy) = 'displayname' AND LOWER(@SortDir) = 'desc' THEN DisplayName END DESC,
    CASE WHEN LOWER(@SortBy) = 'createdat' AND LOWER(@SortDir) = 'asc' THEN CreatedAt END ASC,
    CASE WHEN LOWER(@SortBy) = 'createdat' AND LOWER(@SortDir) = 'desc' THEN CreatedAt END DESC,
    CASE WHEN LOWER(@SortBy) = 'updatedat' AND LOWER(@SortDir) = 'asc' THEN UpdatedAt END ASC,
    CASE WHEN LOWER(@SortBy) = 'updatedat' AND LOWER(@SortDir) = 'desc' THEN UpdatedAt END DESC
  OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY;
END
GO

-- Recreate spUsers_Get
IF OBJECT_ID('dbo.spUsers_Get', 'P') IS NOT NULL DROP PROCEDURE dbo.spUsers_Get;
GO
CREATE PROCEDURE dbo.spUsers_Get
  @UserId NVARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT UserId AS userId,
    Email AS email,
    DisplayName AS displayName,
    PhoneNumber AS phoneNumber,
    AvatarUrl AS avatarUrl,
    PasswordHash AS passwordHash,
    Role AS role,
    Status AS status,
    GeminiApiKey AS geminiApiKey,
    KnowledgeBase AS knowledgeBase,
    CanManageApiKey AS canManageApiKey,
    CreatedAt AS createdAt,
    UpdatedAt AS updatedAt
  FROM dbo.Users
  WHERE UserId = @UserId;
END
GO

-- Recreate spUsers_GetByEmail
IF OBJECT_ID('dbo.spUsers_GetByEmail', 'P') IS NOT NULL DROP PROCEDURE dbo.spUsers_GetByEmail;
GO
CREATE PROCEDURE dbo.spUsers_GetByEmail
  @Email NVARCHAR(256)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @EmailTrim NVARCHAR(256) = LTRIM(RTRIM(@Email));
  SELECT UserId AS userId,
    Email AS email,
    DisplayName AS displayName,
    PhoneNumber AS phoneNumber,
    AvatarUrl AS avatarUrl,
    PasswordHash AS passwordHash,
    Role AS role,
    Status AS status,
    GeminiApiKey AS geminiApiKey,
    KnowledgeBase AS knowledgeBase,
    CanManageApiKey AS canManageApiKey,
    CreatedAt AS createdAt,
    UpdatedAt AS updatedAt
  FROM dbo.Users
  WHERE LOWER(Email) = LOWER(@EmailTrim);
END
GO

-- Recreate spUsers_Create
IF OBJECT_ID('dbo.spUsers_Create', 'P') IS NOT NULL DROP PROCEDURE dbo.spUsers_Create;
GO
CREATE PROCEDURE dbo.spUsers_Create
  @UserId NVARCHAR(128),
  @Email NVARCHAR(256) = NULL,
  @DisplayName NVARCHAR(256) = NULL,
  @PhoneNumber NVARCHAR(64) = NULL,
  @AvatarUrl NVARCHAR(512) = NULL,
  @PasswordHash NVARCHAR(512) = NULL,
  @Role NVARCHAR(64) = NULL,
  @Status NVARCHAR(32) = NULL,
  @GeminiApiKey NVARCHAR(512) = NULL,
  @KnowledgeBase NVARCHAR(MAX) = NULL,
  @CanManageApiKey BIT = 0
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.Users
    (UserId, Email, DisplayName, PhoneNumber, AvatarUrl, PasswordHash, Role, Status, GeminiApiKey, KnowledgeBase, CanManageApiKey)
  VALUES
    (@UserId, @Email, @DisplayName, @PhoneNumber, @AvatarUrl, @PasswordHash, @Role, @Status, @GeminiApiKey, @KnowledgeBase, @CanManageApiKey);
END
GO

-- Recreate spUsers_UpdatePartial
IF OBJECT_ID('dbo.spUsers_UpdatePartial', 'P') IS NOT NULL DROP PROCEDURE dbo.spUsers_UpdatePartial;
GO
CREATE PROCEDURE dbo.spUsers_UpdatePartial
  @UserId NVARCHAR(128),
  @Email NVARCHAR(256) = NULL,
  @DisplayName NVARCHAR(256) = NULL,
  @PhoneNumber NVARCHAR(64) = NULL,
  @AvatarUrl NVARCHAR(512) = NULL,
  @PasswordHash NVARCHAR(512) = NULL,
  @Role NVARCHAR(64) = NULL,
  @Status NVARCHAR(32) = NULL,
  @GeminiApiKey NVARCHAR(512) = NULL,
  @KnowledgeBase NVARCHAR(MAX) = NULL,
  @CanManageApiKey BIT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.Users
  SET Email = COALESCE(@Email, Email),
      DisplayName = COALESCE(@DisplayName, DisplayName),
      PhoneNumber = COALESCE(@PhoneNumber, PhoneNumber),
      AvatarUrl = COALESCE(@AvatarUrl, AvatarUrl),
      PasswordHash = COALESCE(@PasswordHash, PasswordHash),
      Role = COALESCE(@Role, Role),
      Status = COALESCE(@Status, Status),
      GeminiApiKey = COALESCE(@GeminiApiKey, GeminiApiKey),
      KnowledgeBase = COALESCE(@KnowledgeBase, KnowledgeBase),
      CanManageApiKey = CASE WHEN @CanManageApiKey IS NULL THEN CanManageApiKey ELSE @CanManageApiKey END,
      UpdatedAt = SYSUTCDATETIME()
  WHERE UserId = @UserId;
END
GO
