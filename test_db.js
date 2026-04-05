import mysql from "mysql2/promise";

async function testDB() {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "Vidhya123",
      database: "intellitwin",
    });

    const [rows] = await connection.execute("SELECT 1");
    console.log("Database Connected Successfully ✅");
    console.log(rows);

    await connection.end();
  } catch (error) {
    console.error("Database Connection Failed ❌");
    console.error(error);
  }
}

testDB();