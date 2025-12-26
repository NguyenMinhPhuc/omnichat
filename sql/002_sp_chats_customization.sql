-- Migration: Create Chats and UserCustomization tables and stored procedures
USE OmniChat;
GO

-- Create Chats table if not exists
IF OBJECT_ID('dbo.Chats', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Chats
  (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ChatbotId NVARCHAR(128) NOT NULL,
    Messages NVARCHAR(MAX) NOT NULL,
    IsRead BIT NOT NULL DEFAULT (0),
    CreatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME())
  );
  CREATE INDEX IX_Chats_ChatbotId_CreatedAt ON dbo.Chats(ChatbotId, CreatedAt DESC);
END
GO

-- Create UserCustomization table if not exists
IF OBJECT_ID('dbo.UserCustomization', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.UserCustomization
  (
    UserId NVARCHAR(128) NOT NULL PRIMARY KEY,
    Data NVARCHAR(MAX) NOT NULL,
    UpdatedAt DATETIME2(3) NOT NULL DEFAULT (SYSUTCDATETIME())
  );
END
GO

-- Stored procedures for Chats
IF OBJECT_ID('dbo.spChats_ListByChatbot', 'P') IS NOT NULL DROP PROCEDURE dbo.spChats_ListByChatbot;
GO
CREATE PROCEDURE dbo.spChats_ListByChatbot
  @ChatbotId NVARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT CAST(Id AS NVARCHAR(36)) AS id,
    ChatbotId AS chatbotId,
    Messages AS messages,
    IsRead AS isRead,
    CreatedAt AS createdAt
  FROM dbo.Chats
  WHERE ChatbotId = @ChatbotId
  ORDER BY CreatedAt DESC;
END
GO

IF OBJECT_ID('dbo.spChats_Create', 'P') IS NOT NULL DROP PROCEDURE dbo.spChats_Create;
GO
CREATE PROCEDURE dbo.spChats_Create
  @ChatbotId NVARCHAR(128),
  @Messages NVARCHAR(MAX)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  INSERT INTO dbo.Chats
    (Id, ChatbotId, Messages)
  VALUES
    (@Id, @ChatbotId, @Messages);
  SELECT CAST(@Id AS NVARCHAR(36)) AS id;
END
GO

IF OBJECT_ID('dbo.spChats_AppendMessage', 'P') IS NOT NULL DROP PROCEDURE dbo.spChats_AppendMessage;
GO
CREATE PROCEDURE dbo.spChats_AppendMessage
  @ChatId UNIQUEIDENTIFIER,
  @Message NVARCHAR(MAX)
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.Chats
    SET Messages = JSON_MODIFY(COALESCE(Messages,'[]'), 'append $', @Message)
  WHERE Id = @ChatId;
END
GO

IF OBJECT_ID('dbo.spChats_MarkRead', 'P') IS NOT NULL DROP PROCEDURE dbo.spChats_MarkRead;
GO
CREATE PROCEDURE dbo.spChats_MarkRead
  @ChatId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.Chats SET IsRead = 1 WHERE Id = @ChatId;
END
GO

-- Stored procedures for UserCustomization
IF OBJECT_ID('dbo.spCustomization_Get', 'P') IS NOT NULL DROP PROCEDURE dbo.spCustomization_Get;
GO
CREATE PROCEDURE dbo.spCustomization_Get
  @UserId NVARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT Data AS data
  FROM dbo.UserCustomization
  WHERE UserId = @UserId;
END
GO

IF OBJECT_ID('dbo.spCustomization_Upsert', 'P') IS NOT NULL DROP PROCEDURE dbo.spCustomization_Upsert;
GO
CREATE PROCEDURE dbo.spCustomization_Upsert
  @UserId NVARCHAR(128),
  @Data NVARCHAR(MAX)
AS
BEGIN
  SET NOCOUNT ON;
  MERGE dbo.UserCustomization AS tgt
  USING (SELECT @UserId AS UserId, @Data AS Data) AS src
  ON tgt.UserId = src.UserId
  WHEN MATCHED THEN
    UPDATE SET Data = src.Data, UpdatedAt = SYSUTCDATETIME()
  WHEN NOT MATCHED THEN
    INSERT (UserId, Data) VALUES (src.UserId, src.Data);
END
GO
