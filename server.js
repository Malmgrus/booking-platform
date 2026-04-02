import schemas from './schemas.js';
import database from './database.js';
import bcrypt from 'bcrypt';
import express from 'express';
import middleware, { authenticate, checkRole } from './middleware.js';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

const app = express();
const port = process.env.PORT || 3000;
const JWT_KEY = "key";

middleware(app);



async function startServer() {
    await database.connect();
    const server = app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

    const io = new Server(server);
    app.set("io", io);

    io.on('connection', (socket) => {
        console.log("A user has connected")
        
        socket.on("disconnect", () => {
            console.log("User disconnected");
        })
    });
}

async function stopServer() {
    await database.disconnect();
    process.exit(0);
}

process.on('SIGINT', stopServer);
process.on('SIGTERM', stopServer);

startServer();

app.get('/', (req, res) => {
    res.json({ message: 'hello world' });
})

app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new schemas.User({ username, password: hashedPassword, role });
    newUser.save()
        .then(() => res.status(201).json({ message: 'User registered successfully' }))
        .catch(err => res.status(400).json({ error: 'Error registering user: ' + err.message }));
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await schemas.User.findOne({ username });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id , role: user.role}, JWT_KEY, { expiresIn: "1h" });
    res.json({ id: user.id, username: username, password: password, role: user.role, jwt: token });
});

app.post('/rooms', authenticate, checkRole("admin"), async (req, res) => {
    const { name, capacity, type } = req.body;
    const newRoom = new schemas.Room({ name, capacity, type });
    await newRoom.save()
    .then(() => res.status(201).json({ id: newRoom._id, name, capacity, type }))
    .catch(err => res.status(400).json({ error: 'Error creating room: ' + err.message }));
});


app.get('/rooms', authenticate, async (req, res) => {
    try {
        const rooms = await schemas.Room.find();
        res.json(rooms.map(room => ({ _id: room._id, name: room.name, capacity: room.capacity, type: room.type })));
    } catch (error) {
        res.status(500).json({ error: 'Error fetching rooms: ' + error.message });
    }
});

app.put('/rooms/:id', authenticate, checkRole("admin"), async (req, res) => {
    const { name, capacity, type } = req.body;
    const currRoom = await schemas.Room.findByIdAndUpdate(req.params.id, { name, capacity, type }, { returnDocument: "after" });
    if (!currRoom) {
        return res.status(404).json({ error: 'Room not found' });
    };
    res.json({ id: currRoom._id, name: currRoom.name, capacity: currRoom.capacity, type: currRoom.type });
});

app.delete('/rooms/:id', authenticate, checkRole("admin"), async(req, res) => {
    const currRoom = await schemas.Room.findByIdAndDelete(req.params.id);
    if (!currRoom) {
        return res.status(404).json({ error: 'Room not found' });
    };
    res.json({ id: currRoom._id, name: currRoom.name, capacity: currRoom.capacity, type: currRoom.type });
});

app.post('/bookings', authenticate, (req, res) => {
    const { roomId, userId, startTime, endTime } = req.body;
    const newBooking = new schemas.Booking({ roomId, userId, startTime, endTime });
    newBooking.save()
        .then(() => res.status(201).json({ roomId: newBooking.roomId, userId: newBooking.userId, startTime: newBooking.startTime, endTime: newBooking.endTime }))
        .catch(err => res.status(400).json({ error: 'Error creating booking: ' + err.message }));

    req.app.get('io').emit("createdBooking", newBooking);
});

app.get('/bookings', authenticate, async (req, res) => {
    const { userId, role } = req.query;

    if (role == "User") {
        try {
            const bookings = await schemas.Booking.find({ userId: userId });
            if (!bookings || bookings.length === 0) {
                return res.status(404).json({ error: 'No bookings found for this user' });
            }
            res.json(bookings.map(booking => ({ _id: booking._id, roomId: booking.roomId, userId: booking.userId, startTime: booking.startTime, endTime: booking.endTime })));
        
        } catch (error) {
            res.status(500).json({ error: 'Error fetching users bookings: ' + error.message });
        }

    } else {
        try {
            const bookings = await schemas.Booking.find();
            res.json(bookings.map(booking => ({ _id: booking._id, roomId: booking.roomId, userId: booking.userId, startTime: booking.startTime, endTime: booking.endTime })));
    
        } catch (error) {
            res.status(500).json({ error: 'Error fetching all bookings: ' + error.message });
        }
    }
});

app.put('/bookings/:id', authenticate, async (req, res) => {
    const { roomId, userId, startTime, endTime } = req.body;
    const bookingData = await schemas.Booking.find({ userId });
    if (bookingData) {
        var currBooking = await schemas.Booking.findByIdAndUpdate(req.params.id, { roomId, userId, startTime, endTime }, { returnDocument: "after" });
        if (!currBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
    }
    req.app.get('io').emit("updatedBooking", currBooking);
    res.json({ roomId, userId, startTime, endTime });
});

app.delete('/bookings/:id', authenticate, async (req, res) => {
    const { userId, role } = req.query;
    const checkUser = await schemas.Booking.findOne({ roomId: req.params.id });
    
    if (!checkUser) {
        return res.status(404).json({ error: 'Booking not found' });
    }

    if (userId == checkUser.userId || role == "Admin") {
        const currBooking = await schemas.Booking.findByIdAndDelete(checkUser);

        if (!currBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        req.app.get('io').emit("deletedBooking", currBooking);
        res.json({ roomId: currBooking.roomId, userId: currBooking.userId, startTime: currBooking.startTime, endTime: currBooking.endTime });
    } 
});