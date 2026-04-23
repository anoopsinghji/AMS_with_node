require("dotenv").config();
const path = require("path");
const express = require("express");
const { connectDb } = require("./config/db");
const { seedDefaultPrincipal } = require("./utils/seedDefaultPrincipal");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const teacherRoutes = require("./routes/teacher");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (_req, res) => {
  res.render("login");
});

app.get("/principal", (_req, res) => {
  res.render("principal");
});

app.get("/teacher", (_req, res) => {
  res.render("teacher");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function startServer() {
  await connectDb();
  await seedDefaultPrincipal();
  app.listen(PORT, () => {
    console.log(`AMS server running at http://localhost:${PORT}`);
  });
}

startServer();
