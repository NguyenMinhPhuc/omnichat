-- Create database if it does not exist
IF DB_ID('OmniChat') IS NULL
BEGIN
  CREATE DATABASE OmniChat;
END
GO

USE OmniChat;
GO

/*
Core tables mapped from current Firestore usage:
- Users (Firebase UID as PK)
- KnowledgeSources (user-authored documents for RAG)
- Scenarios (tree of Q&A items)
- Leads (captured from chats)
- Chats (chat sessions, messages stored as JSON)

- MonthlyUsage (usage metering per month)
- Settings (key/value)
*/

IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Users
  (
    UserId NVARCHAR(128) NOT NULL PRIMARY KEY,
    -- Firebase UID
    Email NVARCHAR(256) NULL UNIQUE,
    DisplayName NVARCHAR(256) NULL,
    PhoneNumber NVARCHAR(64) NULL,
    AvatarUrl NVARCHAR(512) NULL,
    PasswordHash NVARCHAR(512) NULL,
    Role NVARCHAR(64) NULL,
    Status NVARCHAR(32) NULL,
    GeminiApiKey NVARCHAR(512) NULL,
    KnowledgeBase NVARCHAR(MAX) NULL,
    CanManageApiKey BIT NOT NULL DEFAULT (0),
    CreatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME())
  );
END
GO

-- Keep UpdatedAt in sync
IF OBJECT_ID('dbo.trg_Users_UpdateTimestamp', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Users_UpdateTimestamp;
GO
CREATE TRIGGER dbo.trg_Users_UpdateTimestamp ON dbo.Users
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.Users
    SET UpdatedAt = SYSUTCDATETIME()
    FROM Inserted i
    WHERE dbo.Users.UserId = i.UserId;
END
GO

IF OBJECT_ID('dbo.KnowledgeSources', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.KnowledgeSources
  (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    UserId NVARCHAR(128) NOT NULL,
    Title NVARCHAR(400) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_KnowledgeSources_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
  );
  CREATE INDEX IX_KnowledgeSources_User ON dbo.KnowledgeSources(UserId);
END
GO

-- Update trigger
IF OBJECT_ID('dbo.trg_KnowledgeSources_UpdateTimestamp', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_KnowledgeSources_UpdateTimestamp;
GO
CREATE TRIGGER dbo.trg_KnowledgeSources_UpdateTimestamp ON dbo.KnowledgeSources
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.KnowledgeSources
    SET UpdatedAt = SYSUTCDATETIME()
    FROM Inserted i
    WHERE dbo.KnowledgeSources.Id = i.Id;
END
GO

IF OBJECT_ID('dbo.Scenarios', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Scenarios
  (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    UserId NVARCHAR(128) NOT NULL,
    Question NVARCHAR(MAX) NOT NULL,
    Answer NVARCHAR(MAX) NOT NULL,
    ParentId UNIQUEIDENTIFIER NULL,
    CreatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Scenarios_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Scenarios_Parent FOREIGN KEY (ParentId) REFERENCES dbo.Scenarios(Id)
  );
  CREATE INDEX IX_Scenarios_User ON dbo.Scenarios(UserId);
END
GO

IF OBJECT_ID('dbo.Leads', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Leads
  (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ChatbotId NVARCHAR(128) NOT NULL,
    -- owner userId
    CustomerName NVARCHAR(255) NULL,
    PhoneNumber NVARCHAR(64) NULL,
    Needs NVARCHAR(MAX) NULL,
    Status NVARCHAR(32) NOT NULL DEFAULT ('waiting'),
    CreatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Leads_User FOREIGN KEY (ChatbotId) REFERENCES dbo.Users(UserId)
  );
  CREATE INDEX IX_Leads_ChatbotId ON dbo.Leads(ChatbotId);
  CREATE INDEX IX_Leads_Status ON dbo.Leads(Status);
END
GO

IF OBJECT_ID('dbo.Chats', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Chats
  (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ChatbotId NVARCHAR(128) NOT NULL,
    -- owner userId
    Messages NVARCHAR(MAX) NOT NULL,
    -- store messages array as JSON [{sender:'user'|'ai',text:'...'}]
    IsRead BIT NOT NULL DEFAULT (0),
    CreatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Chats_User FOREIGN KEY (ChatbotId) REFERENCES dbo.Users(UserId)
  );
  CREATE INDEX IX_Chats_ChatbotId_CreatedAt ON dbo.Chats(ChatbotId, CreatedAt DESC);
END
GO

IF OBJECT_ID('dbo.MonthlyUsage', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.MonthlyUsage
  (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    UserId NVARCHAR(128) NOT NULL,
    MonthYear CHAR(7) NOT NULL,
    -- YYYY-MM
    TotalTokens BIGINT NOT NULL DEFAULT (0),
    InputTokens BIGINT NOT NULL DEFAULT (0),
    OutputTokens BIGINT NOT NULL DEFAULT (0),
    ChatRequests BIGINT NOT NULL DEFAULT (0),
    CreatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    UpdatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_MonthlyUsage_User_Month UNIQUE (UserId, MonthYear),
    CONSTRAINT FK_MonthlyUsage_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
  );
  CREATE INDEX IX_MonthlyUsage_User ON dbo.MonthlyUsage(UserId);
END
GO

IF OBJECT_ID('dbo.trg_MonthlyUsage_UpdateTimestamp', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_MonthlyUsage_UpdateTimestamp;
GO
CREATE TRIGGER dbo.trg_MonthlyUsage_UpdateTimestamp ON dbo.MonthlyUsage
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.MonthlyUsage
    SET UpdatedAt = SYSUTCDATETIME()
    FROM Inserted i
    WHERE dbo.MonthlyUsage.Id = i.Id;
END
GO

IF OBJECT_ID('dbo.Settings', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Settings
  (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    [Key] NVARCHAR(128) NOT NULL UNIQUE,
    [Value] NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME())
  );
END
GO

-- Optional seed for roles/status values (idempotent)
IF NOT EXISTS (SELECT 1
FROM dbo.Settings
WHERE [Key] = 'roles')
BEGIN
  INSERT INTO dbo.Settings
    ([Key], [Value])
  VALUES
    ('roles', 'admin,user');
END
GO

/* =============================================================
   Stored Procedures for all data access
   ============================================================= */

-- Users
IF OBJECT_ID('dbo.spUsers_List', 'P') IS NOT NULL DROP PROCEDURE dbo.spUsers_List;
GO
CREATE PROCEDURE dbo.spUsers_List
  @Search NVARCHAR(256) = NULL,
  @Role NVARCHAR(64) = NULL,
  @Status NVARCHAR(32) = NULL,
  @SortBy NVARCHAR(64) = 'updatedAt',
  @SortDir NVARCHAR(4) = 'DESC',
  -- 'ASC' or 'DESC'
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

IF OBJECT_ID('dbo.spUsers_Delete', 'P') IS NOT NULL DROP PROCEDURE dbo.spUsers_Delete;
GO
CREATE PROCEDURE dbo.spUsers_Delete
  @UserId NVARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.Users WHERE UserId = @UserId;
END
GO

-- Leads
IF OBJECT_ID('dbo.spLeads_List', 'P') IS NOT NULL DROP PROCEDURE dbo.spLeads_List;
GO
CREATE PROCEDURE dbo.spLeads_List
  @ChatbotId NVARCHAR(128) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SELECT Id AS id,
    ChatbotId AS chatbotId,
    CustomerName AS customerName,
    PhoneNumber AS phoneNumber,
    Needs AS needs,
    Status AS status,
    CreatedAt AS createdAt
  FROM dbo.Leads
  WHERE (@ChatbotId IS NULL OR ChatbotId = @ChatbotId)
  ORDER BY CreatedAt DESC;
END
GO

IF OBJECT_ID('dbo.spLeads_Create', 'P') IS NOT NULL DROP PROCEDURE dbo.spLeads_Create;
GO
CREATE PROCEDURE dbo.spLeads_Create
  @ChatbotId NVARCHAR(128),
  @CustomerName NVARCHAR(255) = NULL,
  @PhoneNumber NVARCHAR(64) = NULL,
  @Needs NVARCHAR(MAX) = NULL,
  @Status NVARCHAR(32)
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.Leads
    (ChatbotId, CustomerName, PhoneNumber, Needs, Status)
  VALUES
    (@ChatbotId, @CustomerName, @PhoneNumber, @Needs, @Status);
END
GO

IF OBJECT_ID('dbo.spLeads_UpdateStatus', 'P') IS NOT NULL DROP PROCEDURE dbo.spLeads_UpdateStatus;
GO
CREATE PROCEDURE dbo.spLeads_UpdateStatus
  @Id UNIQUEIDENTIFIER,
  @Status NVARCHAR(32)
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.Leads SET Status = @Status WHERE Id = @Id;
END
GO

IF OBJECT_ID('dbo.spLeads_Delete', 'P') IS NOT NULL DROP PROCEDURE dbo.spLeads_Delete;
GO
CREATE PROCEDURE dbo.spLeads_Delete
  @Id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.Leads WHERE Id = @Id;
END
GO

-- KnowledgeSources
IF OBJECT_ID('dbo.spKnowledgeSources_List', 'P') IS NOT NULL DROP PROCEDURE dbo.spKnowledgeSources_List;
GO
CREATE PROCEDURE dbo.spKnowledgeSources_List
  @UserId NVARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT Id AS id,
    UserId AS userId,
    Title AS title,
    Content AS content,
    CreatedAt AS createdAt,
    UpdatedAt AS updatedAt
  FROM dbo.KnowledgeSources
  WHERE UserId = @UserId
  ORDER BY CreatedAt DESC;
END
GO

IF OBJECT_ID('dbo.spKnowledgeSources_Create', 'P') IS NOT NULL DROP PROCEDURE dbo.spKnowledgeSources_Create;
GO
CREATE PROCEDURE dbo.spKnowledgeSources_Create
  @UserId NVARCHAR(128),
  @Title NVARCHAR(400),
  @Content NVARCHAR(MAX)
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.KnowledgeSources
    (UserId, Title, Content)
  OUTPUT
  Inserted.Id
  AS
  id,
  Inserted.UserId
  AS
  userId,
  Inserted.Title
  AS
  title,
  Inserted.Content
  AS
  content,
  Inserted.CreatedAt
  AS
  createdAt,
  Inserted.UpdatedAt
  AS
  updatedAt
  VALUES
    (@UserId, @Title, @Content);
END
GO

IF OBJECT_ID('dbo.spKnowledgeSources_Update', 'P') IS NOT NULL DROP PROCEDURE dbo.spKnowledgeSources_Update;
GO
CREATE PROCEDURE dbo.spKnowledgeSources_Update
  @Id UNIQUEIDENTIFIER,
  @Title NVARCHAR(400),
  @Content NVARCHAR(MAX)
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.KnowledgeSources
  SET Title = @Title,
      Content = @Content,
      UpdatedAt = SYSUTCDATETIME()
  WHERE Id = @Id;
END
GO

IF OBJECT_ID('dbo.spKnowledgeSources_Delete', 'P') IS NOT NULL DROP PROCEDURE dbo.spKnowledgeSources_Delete;
GO
CREATE PROCEDURE dbo.spKnowledgeSources_Delete
  @Id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.KnowledgeSources WHERE Id = @Id;
END
GO

-- Scenarios
IF OBJECT_ID('dbo.spScenarios_List', 'P') IS NOT NULL DROP PROCEDURE dbo.spScenarios_List;
GO
CREATE PROCEDURE dbo.spScenarios_List
  @UserId NVARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT Id AS id,
    UserId AS userId,
    Question AS question,
    Answer AS answer,
    ParentId AS parentId,
    CreatedAt AS createdAt
  FROM dbo.Scenarios
  WHERE UserId = @UserId
  ORDER BY CreatedAt ASC;
END
GO

IF OBJECT_ID('dbo.spScenarios_Replace', 'P') IS NOT NULL DROP PROCEDURE dbo.spScenarios_Replace;
GO
CREATE PROCEDURE dbo.spScenarios_Replace
  @UserId NVARCHAR(128),
  @ItemsJson NVARCHAR(MAX)
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    DELETE FROM dbo.Scenarios WHERE UserId = @UserId;

    INSERT INTO dbo.Scenarios
    (Id, UserId, Question, Answer, ParentId)
  SELECT TRY_CAST(j.id AS UNIQUEIDENTIFIER) AS Id,
    @UserId,
    j.question,
    j.answer,
    TRY_CAST(j.parentId AS UNIQUEIDENTIFIER) AS ParentId
  FROM OPENJSON(@ItemsJson)
      WITH (
        id NVARCHAR(128) '$.id',
        question NVARCHAR(MAX) '$.question',
        answer NVARCHAR(MAX) '$.answer',
        parentId NVARCHAR(128) '$.parentId'
      ) AS j;

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END
GO
