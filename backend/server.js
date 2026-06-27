// Entry point for the Dokkhota backend server
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const creditRoutes = require('./routes/creditRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const socketHandler = require('./sockets/socketHandler');

connectDB();

// Serve uploaded files (local fallback for avatars)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Seed initial categories if needed
try {
  const { seedCategories } = require('./seedCategories');
  seedCategories().catch((e) => console.warn('Category seeder failed:', e.message));
} catch (e) {
  // ignore if seeder not present
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/bookings', bookingRoutes);

app.use(errorHandler);

io.on('connection', (socket) => {
  socketHandler(io, socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Dokkhota backend running on port ${PORT}`);
});
