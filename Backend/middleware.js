export default function isLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  if (req.originalUrl.startsWith("/api/thread")) {
    // For GET requests expecting arrays
    if (req.method === "GET") {
      return res.status(401).json([]);
    }
    // For DELETE expecting object
    if (req.method === "DELETE") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  }

  // Default unauthorized response
  return res.status(401).json({ error: "Unauthorized" });
}
