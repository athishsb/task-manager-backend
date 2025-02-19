const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const db = require('./config/db');
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
app.use(express.json());
app.use(cors(
    {
        origin: [process.env.FU],
    }
));


app.use("/api/auth", authRoutes);
app.use("/api/task", taskRoutes);


app.get("/", (req, res) => {
    res.send("🙋‍♂️ Welcome to Task Manager!");
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
    db();
    console.log(`Server is running on port ${port}`);
});