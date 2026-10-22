// Creates an admin account, or turns an existing account into an admin.
//   npm run create-admin -- admin@example.com MyPassword123
import bcrypt from "bcryptjs";
import { pool } from "../db";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 8 || password.length > 72) {
    console.error(
      "Usage: npm run create-admin -- <email> <password (8-72 characters)>",
    );
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO app_user (email, password_hash, role) VALUES (lower($1), $2, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
    [email, hash],
  );
  console.log(`Admin ready: ${email.toLowerCase()}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
