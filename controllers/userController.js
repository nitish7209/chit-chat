
const logger = require('../config/logger');
const UserModel = require('../models/User');
const bcrypt = require('bcrypt');


// Async handler wrapper
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};


// API to register new user with name, email and password

exports.createUsers = asyncHandler(async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, email and password"
            });
        }


        // Check if email already exists
        const alreadyExistsEmail = await UserModel.findOne({ email });
        if (alreadyExistsEmail) {
            return res.status(400).json({
                success: false,
                message: "User with this email address already exists"
            });
        }


        // Hash password
        const hashedPassword = await UserModel.hashPassword(password);

        // Create user
        const user = await UserModel.create({
            name,
            email,
            password: hashedPassword
        });

        // Generate token
        const token = user.generatedAuthToken();

        res.cookie('token', token, {
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
            secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
            sameSite: 'strict', // Prevents CSRF
            maxAge: 24 * 60 * 60 * 1000 // Sets cookie expiry to 1 day
        });

        if (!token) {
            throw new Error('Error generating authentication token');
        }

        logger.info(`New user created: ${user.email}`);

        res.status(201).json({
            success: true,
            token: token,
        });

    } catch (error) {
        logger.error(`Error creating user: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Failed to register user",
            error: error.message
        });
    }
});


// API to authenticate user login with email and password
exports.getUser = asyncHandler(async (req, res) => {
    try {
        // Get email and password from request body
        const { email, password } = req.body;

        // Find user by email and include password field
        const userExist = await UserModel.findOne({ email }).select('+password');

        // Return error if user not found
        if (!userExist) {
            logger.error("User With This Email Address Does Not Exist!");
            return res.status(404).json({
                success: false,
                message: "User with this email address does not exist"
            });
        }

        // Verify password matches
        const isPasswordValid = await userExist.comparePassword(password);


        if (isPasswordValid) {
            // Log successful login
            logger.info(`User logged in: ${userExist.email}`);

            // Generate token
            const token = userExist.generatedAuthToken();

            if (!token) {
                throw new Error('Error generating authentication token');
            }

            // Exclude password from the response
            const userWithoutPassword = userExist.toObject();
            delete userWithoutPassword.password;

            res.cookie('token', token, {
                httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
                secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
                sameSite: 'strict', // Prevents CSRF
                maxAge: 24 * 60 * 60 * 1000 // Sets cookie expiry to 1 day
            });

            // Return success response with user data
            res.status(200).json({
                success: true,
                message: "User logged in successfully",
                user: userWithoutPassword,
                token: token
            });
        } else {
            // Return error for invalid password
            logger.error("Invalid password");
            res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

    } catch (error) {
        // Log and return any errors
        logger.error(`Error getting user: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Failed to get user",
            error: error.message
        });
    }
})


// API to logout user
exports.logoutuser = asyncHandler(async (req, res) => {

    try {
        res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'strict' });



        res.status(200).json({
            success: true,
            message: "User logged Out successfully",

        })
    } catch (error) {
        logger.error(`Error logging out user: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Failed to log out user",
            error: error.message
        });
    }

})


// API to get user profile
exports.profileuser = asyncHandler(async (req, res) => {
    try {
        const userID = req.user.id

        console.log(userID)
        const userExist = await UserModel.findOne({ _id: userID }).select('-password');


        if (!userExist) {
            // Log the error if the user is not found
            logger.error(`User not found: ID ${userId}`);

            return res.status(404).json({
                success: false,
                message: "User not found",
            });

        }

        logger.info(`Profile retrieved for user: ${userExist.email}`);

        // Respond with the user profile
        res.status(201).json({
            success: true,
            message: "User profile retrieved successfully",
            userExist,
        });

    } catch (error) {
        // Log the error details
        logger.error(`Error retrieving user profile: ${error.message}`);

        // Respond with an error message
        res.status(500).json({
            success: false,
            message: "Failed to retrieve user profile",
            error: error.message,
        });

    }
})


// API to update user profile
exports.updateprofile = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;

        const { email, name } = req.body;

        const userExists = await UserModel.findOne({ _id: userId });

        if (!userExists) {
            logger.error(`User not found: ID ${userId}`);

            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        logger.info(`${userExists.email} Found`);


        // Update the user's profile details
        if (email) userExists.email = email;
        if (name) userExists.name = name;

        // Save the updated user profile
        const updatedUser = await userExists.save();

        logger.info(`User profile updated: ${updatedUser.email}`);

        // Respond with the updated user data
        res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            user: {
                id: updatedUser._id,
            },
        });
    } catch (error) {
        logger.error(`Error updating user profile: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to update user profile",
            error: error.message,
        });
    }
})


// API to verify user token
exports.verifyUserToken = asyncHandler(async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get the token from the Authorization header

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Find the user associated with the token (this is optional, depending on your setup)
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // If the token is valid and the user exists
        return res.status(200).json({ message: 'User is authenticated', user });
    } catch (error) {
        // In case of an error with token verification
        return res.status(401).json({ message: 'Invalid or expired token', error });
    }
});


// API to get all users
exports.getAllUsers = asyncHandler(async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const users = await UserModel.find({ _id: { $ne: loggedInUserId } }).select('-password');
        res.status(200).json({
            success: true,
            message: "All users retrieved successfully",
            users,
        });
    } catch (error) {
        logger.error(`Error getting all users: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Failed to get all users",
            error: error.message,
        });
    }
}
)


// API to get single user
exports.getSingleUser = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await UserModel.findOne({ _id: userId }).select('-password');

        if (!user) {
            logger.error(`User not found: ID ${userId}`);
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        } logger.info(`User found: ${user.email}`);
        res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            user,
        });
    } catch (error) {
        logger.error(`Error getting user: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Failed to get user",
            error: error.message,
        });
    }
}
)

