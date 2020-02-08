CREATE TABLE `games` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guild` varchar(50) NOT NULL,
  `categoryChannel` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `guild` (`guild`)
);

CREATE TABLE `players` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `game` int(11) NOT NULL,
  `discordUserID` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `game` (`game`),
  KEY `discordUserID` (`discordUserID`),
  CONSTRAINT `FK_players_games` FOREIGN KEY (`game`) REFERENCES `games` (`id`)
);

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `game` int(11) NOT NULL,
  `locked` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `game` (`game`),
  CONSTRAINT `FK_rooms_games` FOREIGN KEY (`game`) REFERENCES `games` (`id`)
);

CREATE TABLE `roomconnections` (
  `from` int(11) NOT NULL,
  `to` int(11) NOT NULL,
  `visibility` float NOT NULL,
  PRIMARY KEY (`from`,`to`),
  KEY `from` (`from`),
  KEY `to` (`to`),
  CONSTRAINT `FK_roomconnections-from_rooms` FOREIGN KEY (`from`) REFERENCES `rooms` (`id`),
  CONSTRAINT `FK_roomconnections-to_rooms` FOREIGN KEY (`to`) REFERENCES `rooms` (`id`)
);

CREATE TABLE `player_knownrooms` (
  `playerID` int(11) NOT NULL,
  `roomID` int(11) NOT NULL,
  PRIMARY KEY (`playerID`,`roomID`),
  KEY `FK_player_knownrooms_rooms` (`roomID`),
  CONSTRAINT `FK_player_knownrooms_players` FOREIGN KEY (`playerID`) REFERENCES `players` (`id`),
  CONSTRAINT `FK_player_knownrooms_rooms` FOREIGN KEY (`roomID`) REFERENCES `rooms` (`id`)
);