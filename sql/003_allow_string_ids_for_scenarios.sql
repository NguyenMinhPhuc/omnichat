-- Migration: allow client-generated string IDs for Scenarios
-- This migration converts the Scenarios table to use NVARCHAR(128) ids
-- and replaces the spScenarios_Replace procedure to accept string ids.

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID('dbo.Scenarios', 'U') IS NOT NULL
  BEGIN
  -- Drop foreign key to parent if it exists
  IF EXISTS (SELECT 1
  FROM sys.foreign_keys
  WHERE name = 'FK_Scenarios_Parent')
    BEGIN
    ALTER TABLE dbo.Scenarios DROP CONSTRAINT FK_Scenarios_Parent;
  END

  -- Drop primary key constraint if exists
  DECLARE @pkName sysname;
  SELECT @pkName = kc.name
  FROM sys.key_constraints kc
  WHERE kc.parent_object_id = OBJECT_ID('dbo.Scenarios') AND kc.type = 'PK';

  IF @pkName IS NOT NULL
    BEGIN
    EXEC('ALTER TABLE dbo.Scenarios DROP CONSTRAINT [' + @pkName + ']');
  END

  -- Alter columns to NVARCHAR(128)
  ALTER TABLE dbo.Scenarios ALTER COLUMN Id NVARCHAR(128) NOT NULL;
  ALTER TABLE dbo.Scenarios ALTER COLUMN ParentId NVARCHAR(128) NULL;

  -- Recreate primary key on Id
  IF NOT EXISTS (
      SELECT 1
  FROM sys.key_constraints kc
  WHERE kc.parent_object_id = OBJECT_ID('dbo.Scenarios') AND kc.type = 'PK'
    )
    BEGIN
    ALTER TABLE dbo.Scenarios ADD CONSTRAINT PK_Scenarios_Id PRIMARY KEY (Id);
  END

  -- Recreate FK to parent (nullable)
  IF NOT EXISTS (SELECT 1
  FROM sys.foreign_keys
  WHERE name = 'FK_Scenarios_Parent')
    BEGIN
    ALTER TABLE dbo.Scenarios ADD CONSTRAINT FK_Scenarios_Parent FOREIGN KEY (ParentId) REFERENCES dbo.Scenarios(Id);
  END
END

  -- Replace stored procedure to accept string ids and insert directly
  IF OBJECT_ID('dbo.spScenarios_Replace', 'P') IS NOT NULL
    DROP PROCEDURE dbo.spScenarios_Replace;
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
  SELECT j.id AS Id,
    @UserId,
    j.question,
    j.answer,
    NULLIF(j.parentId, '') AS ParentId
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

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
THROW;
END CATCH
