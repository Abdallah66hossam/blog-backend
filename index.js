const express = require("express");
const connectDB = require("./config/connectDB");
const authRoute = require("./routes/auth");
const usersRoute = require("./routes/users");
const postsRoute = require("./routes/posts");
require("dotenv").config();

// connecting to database
connectDB();

// init app
const app = express();

// middlewares
app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/users/profile", usersRoute);
app.use("/api/posts", postsRoute);

// running the server.
const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`app is running on port ${PORT}`));
