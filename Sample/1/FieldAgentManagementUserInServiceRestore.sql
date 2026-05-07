-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- Original procedure name:	[cqf].[BusinessLeadManagementUserInService]
-- =============================================
CREATE PROCEDURE [cqf].[FieldAgentManagementUserInService]
				@UserId INT
AS
BEGIN
	
		SET NOCOUNT ON;
		SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

		--TODO [YA] select top 1
		SELECT p.ProcessId
				,sso.MaxST
		FROM qf.StatServiceOnline sso
			JOIN qf.[Service] s ON sso.ServiceId = s.ServiceId
			JOIN qf.Step st ON st.ServiceId = s.ServiceId AND st.UserId = @UserId AND st.EntityStatus = 3
			JOIN qf.ProcessAll p ON p.ProcessId = st.ProcessId AND p.CurrentEntityStatus = 6

END
