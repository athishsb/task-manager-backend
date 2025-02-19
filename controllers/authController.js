const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');


const register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password || name === "" || email === "" || password === "") {
            return res.status(400).json({ message: "All fields are required" });
        }
        const nameExists = await User.findOne({ name: name.toLowerCase() });
        if (nameExists) {
            return res.status(400).json({ message: "username already exists" });
        }

        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({ name: name.toLowerCase(), email: email.toLowerCase(), password: hashedPassword });

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "5h" });


        res.status(201).json({
            _id: newUser._id,
            name: newUser.username,
            email: newUser.email,
            token
        });
    }
    catch (error) {
        console.error("Error in register controller:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}



const login = async (req, res) => {
    try {

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "5h" });

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token
        })
    }
    catch (error) {
        console.error("Error in login controller:", error);
        res.status(500).json({ message: "Internal Server Error" });

    }
}


const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    try {

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: "Please enter the registered email" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });


        const resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
        await User.findOneAndUpdate(
            { email: user.email },
            { $set: { resetPasswordToken: token, resetPasswordExpires: resetTokenExpiry } },
            { new: true }
        );


        const link = `${process.env.FU}/authorize/?id=${user._id}&token=${token}`;
        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: user.email,
            subject: "Password Reset Link",
            html: `
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; border-radius: 10px;">
                    <h2 style="color: #16a34a; text-align: center;">Password Reset Request</h2>
                    <p style="font-size: 16px;">Hi ${user.name},</p>
                    <p style="font-size: 16px;">We received a request to reset your password. Click the button below to reset it.</p>
                    <p style="text-align: center;">
                        <a href="${link}" style="background-color: #16a34a; color: #fff; padding: 10px 20px; font-size: 16px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                    </p>
                    <p style="font-size: 14px; color: #555;">This link is valid for 10 minutes. If you didn't request a password reset, please ignore this email.</p>
                </div>
            </body>
        </html>
    `,
        };
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.ADMIN_EMAIL,
                pass: process.env.PASSWORD,
            },
        });


        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(400).json({ message: "Error sending email" });
            }
            res.status(200).json({ message: `Reset link sent to your email: ${email}` });
        });

    } catch (error) {
        console.error("Error in forgotPassword controller:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const resetLinkVerify = async (req, res, next) => {
    const { id, token } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "Invalid link, please try again" });
        }

        jwt.verify(token, process.env.JWT_SECRET);

        if (user.resetPasswordToken !== token || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: "Token expired or invalid, please try again" });
        }

        res.status(200).json({ message: "Token verified" });

    } catch (error) {
        // Handle TokenExpiredError
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(400).json({ message: "Token has expired, please request a new password reset link" });
        }
        console.error("Error in resetLinkVerify controller:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const resetPassword = async (req, res, next) => {
    try {
        const { id, token } = req.params;
        const { password } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "Invalid or expired link" });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (isValidPassword) {
            return res.status(400).json({ message: "Password should not be the same as the old one." });
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET);
            if (user.resetPasswordToken !== token || user.resetPasswordExpires < Date.now()) {
                return res.status(400).json({ message: "Token expired or invalid, please request a new reset link." });
            }
        } catch (error) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.findByIdAndUpdate(id, {
            $set: { password: hashedPassword },
            $unset: { resetPasswordToken: "", resetPasswordExpires: "" }
        });

        res.status(200).json({ message: "Password reset successfully" });

    } catch (error) {
        console.error("Error in resetting password:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


module.exports = {
    register,
    login,
    forgotPassword,
    resetLinkVerify,
    resetPassword,
}