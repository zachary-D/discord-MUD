SELECT
    id,
    game,
    discordUserID
FROM players
WHERE
    discordUserID = ?
    AND game = ?
