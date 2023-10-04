Database initialization in ClickHouse cloud

```sql
CREATE DATABASE lang;
CREATE TABLE lang.words (
    dict String,
    nl String,
    en String,
    tags Array(String),
    PRIMARY KEY (dict, nl, en)
);

CREATE USER lang IDENTIFIED WITH sha256_hash BY 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'
    DEFAULT DATABASE lang
    SETTINGS
        add_http_cors_header = 1 READONLY;

CREATE QUOTA lang
KEYED BY ip_address
FOR RANDOMIZED INTERVAL 1 MINUTE MAX query_selects = 100, query_inserts = 1000, written_bytes = '10M',
FOR RANDOMIZED INTERVAL 1 HOUR MAX query_selects = 1000, query_inserts = 10000, written_bytes = '50M',
FOR RANDOMIZED INTERVAL 1 DAY MAX query_selects = 5000, query_inserts = 50000, written_bytes = '200M'
TO lang;

GRANT SELECT, INSERT ON lang.words TO lang;

INSERT INTO lang.words VALUES
    ('test', 'zijn', 'to be', ['v']),
    ('test', 'hebben', 'to have', ['v']),
    ('test', 'gaan', 'to go', ['v']);

```

