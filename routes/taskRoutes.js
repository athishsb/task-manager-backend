const express = require("express");
const { getTasks, getTaskById, updateTask, deleteTask, createTask } = require("../controllers/taskController");
const { isAuthenticated } = require("../middleware/auth");
const router = express.Router();


router.post("/create", isAuthenticated, createTask);
router.get("/lists", isAuthenticated, getTasks);
router.put("/update/:taskId", isAuthenticated, updateTask);
router.delete("/delete/:taskId", isAuthenticated, deleteTask);
router.get("/:taskId", isAuthenticated, getTaskById);

module.exports = router;
