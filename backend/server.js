require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoute.js");
const roleRoutes = require("./src/routes/roleRoutes.js");
const permissionRoutes = require("./src/routes/permissionRoutes.js");
const assignRoutes = require("./src/routes/assignRoutes.js");
const userRoutes = require("./src/routes/userRoutes.js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        message: "Backend server is running"
    });
});

app.get("/api", (req, res) => {
    res.json({
        message: "AuthGuard RBAC API"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permission", permissionRoutes);
app.use("/api/assign", assignRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

// Only start a listening server when this file is run directly
// (e.g. `node server.js` or `npm run dev`). When imported by a
// serverless entry point (e.g. Vercel's api/index.js), we just
// export the configured Express app instead.
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;