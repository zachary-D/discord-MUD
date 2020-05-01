DELIMITER ||

CREATE OR REPLACE PROCEDURE getPlayerByMemberAndGame (
    IN gameID int(11),
    IN discordUserID varchar(50)
)
BEGIN
    SELECT *
    FROM players
    WHERE players.discordUserID = discordUserID
    AND players.game = gameID
END||