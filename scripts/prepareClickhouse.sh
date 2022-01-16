#!/bin/bash

# All commands must succeed (return 0) or this script will stop running
set -e

echo "Creating Clickhouse databases and preparing migrations table..."
docker exec -it clickhouse clickhouse-client -n --query 'CREATE DATABASE IF NOT EXISTS warehouse; CREATE DATABASE IF NOT EXISTS warehouse_test;'

docker exec -it clickhouse clickhouse-client -d warehouse --query 'CREATE TABLE IF NOT EXISTS migrations (id Int32, data String, created_at DateTime) ENGINE = TinyLog();'

docker exec -it clickhouse clickhouse-client -d warehouse_test --query 'CREATE TABLE IF NOT EXISTS migrations (id Int32, data String, created_at DateTime) ENGINE = TinyLog();'

CLICKHOUSE_DBNAME=warehouse npx ch migrate:latest
CLICKHOUSE_DBNAME=warehouse_test npx ch migrate:latest