import mariadb from "mariadb"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined")
}

const url = new URL(databaseUrl)

if (url.protocol !== "mysql:") {
  throw new Error("DATABASE_URL must use the mysql:// protocol")
}

export const pool = mariadb.createPool({
  host: url.hostname,
  port: Number(url.port),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.slice(1)),
  connectionLimit: 5,
})
