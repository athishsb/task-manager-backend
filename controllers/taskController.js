const Task = require("../models/Task");

const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user });
        res.status(200).json({ tasks, message: "Tasks fetched successfully.." });
    }
    catch (error) {
        console.log("Error in get tasks controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const getTaskById = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const task = await Task.findById(taskId);

        // Check if the task exists and if it belongs to the logged-in user
        if (!task || task.user.toString() !== req.user.toString()) {
            return res.status(400).json({ message: "Task not found" });
        }
        res.status(200).json({ task, message: "Task found successfully.." });
    }
    catch (error) {
        console.log("Error in get task by ID controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const createTask = async (req, res) => {
    try {
        const { description, status } = req.body;
        if (!description) {
            return res.status(400).json({ message: "Description is required" });
        }
        const descriptiontoLower = description.toLowerCase();
        const taskExists = await Task.findOne({ user: req.user, description: descriptiontoLower });
        if (taskExists) {
            return res.status(400).json({ message: "Task with this description already exists" });
        }
        const task = await Task.create({ user: req.user, description, status });
        res.status(201).json({ task, message: "Task created successfully.." });
    }
    catch (error) {
        console.log("Error in create task controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const updateTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { description, status } = req.body;
        if (!description) {
            return res.status(400).json({ message: "Description is required" });
        }
        const task = await Task.findById(taskId);

        if (!task || task.user.toString() !== req.user.toString()) {
            return res.status(400).json({ message: "Task not found" });
        }

        const descriptiontoLower = description.toLowerCase();
        const existingTask = await Task.findOne({ user: req.user, description: descriptiontoLower });
        if (existingTask && existingTask._id.toString() !== taskId) {
            return res.status(400).json({ message: "Task with this description already exists" });
        }

        task.description = description;
        task.status = status; // Update status
        const updatedTask = await task.save();
        res.status(200).json({ task: updatedTask, message: "Task updated successfully.." });
    }
    catch (error) {
        console.log("Error in update task controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (task && task.user.toString() === req.user.toString()) {
            await Task.findByIdAndDelete(req.params.taskId);
            res.status(200).json({ message: "Task deleted successfully.." });
        } else {
            return res.status(400).json({ message: "Task not found" });
        }
    }
    catch (error) {
        console.log("Error in delete task controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};
