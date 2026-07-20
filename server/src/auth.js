import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function signAdminToken() {
  return jwt.sign({ role: "admin" }, SECRET, { expiresIn: "12h" });
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing admin session." });
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.role !== "admin") throw new Error("wrong role");
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired admin session." });
  }
}
