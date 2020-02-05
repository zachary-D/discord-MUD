CREATE TABLE `users` (
  `textChannel` char(19) NOT NULL,
  `locked` tinyint NOT NULL,
  `visible` tinyint NOT NULL,
  PRIMARY KEY (`id`),
);

CREATE TABLE `updateTracking` (
  `scriptName` varchar(400) NOT NULL,
  `lastUpdated` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
);