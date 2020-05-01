DELIMITER || 

CREATE OR REPLACE PROCEDURE getPlayerByID(
    IN playerID int(11)
)
BEGIN
    SELECT *
    FROM players
    WHERE id = playeID
END||