-- migrate:up

CREATE TABLE player_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    playerId BIGINT UNSIGNED NOT NULL,
    token CHAR(64) NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_player_sessions_token (token),
    KEY idx_player_sessions_player (playerId),
    KEY idx_player_sessions_expires (expiresAt),

    CONSTRAINT fk_player_sessions_player
        FOREIGN KEY (playerId)
        REFERENCES players(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- migrate:down

DROP TABLE player_sessions;