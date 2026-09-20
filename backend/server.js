require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoute.js");
const roleRoutes = require("./src/routes/roleRoutes.js");
const permissionRoutes = require("./src/routes/permissionRoutes.js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        message: "Backend server is running"
    });
});

app.use("/auth", authRoutes);
app.use("/roles", roleRoutes);
app.use("/permission", permissionRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});