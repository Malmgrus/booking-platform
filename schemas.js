import mongoose from 'mongoose';



function userSchema() {
    const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['User', 'Admin'], default: 'User' },
    });
    return userSchema;
}

function roomSchema() {
    const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    type: { type: String, enum: ['workspace', 'conference'], required: true },
    });
    return roomSchema;
}

function bookingSchema() {
    const bookingSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    });
    return bookingSchema;
}


export default {
    User: mongoose.model('User', userSchema()),
    Room: mongoose.model('Room', roomSchema()),
    Booking: mongoose.model('Booking', bookingSchema())
}

/*const User = mongoose.model('User', userSchema());
const Room = mongoose.model('Room', roomSchema());
const Booking = mongoose.model('Booking', bookingSchema());
export default { User, Room, Booking };*/