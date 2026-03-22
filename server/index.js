const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const plannerRoutes = require('./routes/planner');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', plannerRoutes);
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch(err => {
        console.error("MongoDB connection error:", err.message);
        console.log("Server will start without database connection");
    });

app.listen(5000, "0.0.0.0",() => console.log("Server running on port 5000"));
