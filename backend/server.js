const express = require('express');
const app = express();

// packages
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

// connection to DB and cloudinary
const { connectDB } = require('./config/database');
const { cloudinaryConnect } = require('./config/cloudinary');

// routes
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const paymentRoutes = require('./routes/payments');
const courseRoutes = require('./routes/course');
const studyPlanner = require("./routes/studyPlanner");
const notesRoutes = require("./routes/notesRoute");
const liveClassRoutes = require("./routes/liveClass");
const postRoutes = require("./routes/postRoute");
const recommendationRoutes = require("./routes/recommendationRoutes");
const publicRoutes = require("./routes/publicRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoute = require("./routes/chatRoute");
const testRoutes = require("./routes/testRoute.js");

// middleware 
app.use(express.json()); // to parse json body
app.use(cookieParser());
app.use(
    cors({
        // origin: 'http://localhost:5173', // frontend link
        origin: "*",
        credentials: true
    })
);
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: '/tmp'
    })
)


const PORT = process.env.PORT || 5001;

// mount routes
app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/course', courseRoutes);
app.use('/api/v1/test', testRoutes);
app.use("/api/v1/ai", notesRoutes);
app.use("/api/v1/live-class", liveClassRoutes);
app.use("/api/v1/post", postRoutes);
app.use("/api/v1", recommendationRoutes);
app.use("/api/v1", publicRoutes);
app.use("/api/v1", notificationRoutes);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/planner", studyPlanner);

// Connections and Server Startup
const startServer = async () => {
    try {
        await connectDB();
        await cloudinaryConnect();
        app.listen(PORT, () => {
            console.log(`Server Started on PORT ${PORT}`);
        });
    } catch (error) {
        console.error("Critical error during startup:", error);
        process.exit(1);
    }
};

startServer();

// Default Route
app.get('/', (req, res) => {
    // console.log('Your server is up and running..!');
    res.send(`<div>
    This is Default Route  
    <p>Everything is OK</p>
    </div>`);
})
