const baseUrl = "http://localhost:3000";

import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
});

socket.on("createdBooking", (booking) => {
    console.log("Notification: Booking created", booking);
});

socket.on("updatedBooking", (booking) => {
    console.log("Notification: Booking updated", booking);
});

socket.on("deletedBooking", (booking) => {
    console.log("Notification: Booking deleted", booking);
})

async function api(path, method = "GET", body = null, token = null) {
    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
    }

    return res.json();
}

(async () => {
    const username = "testname" + Date.now();
   // try {
        // Register
        const register = await api("/register", "POST", {
            username,
            password: "testpassword",
            role: "Admin"
        });

        // Login
        const login = await api("/login", "POST", {
            username,
            password: "testpassword"
        });

        const token = login.jwt;

        // Create room
        
        const room = await api("/rooms", "POST", {
            name: "testroom",
            capacity: 5,
            type: "workspace"
        }, token);

        // Get rooms
        const getRooms = await api("/rooms", "GET", null, token);

        if (!Array.isArray(getRooms) || getRooms.length === 0) {
            throw new Error("No rooms found");
        }

        const randomRoom =  getRooms[Math.floor(Math.random() * getRooms.length)];

        if (!randomRoom) {
            throw new Error("No usable room found");
        }

        // Update room
         const updatedRoom = await api(`/rooms/${randomRoom._id}`, "PUT", {
            name: "updatedTestRoom",
            capacity: 10,
            type: "conference"
        }, token);
        

        // delete room
        const deletedRoom = await api(`/rooms/${randomRoom._id}`, "DELETE", null, token);
        

        // create booking
        
        const booking = await api("/bookings", "POST", {
            roomId: randomRoom._id,
            userId: login.id,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString() // 1 hour later
        }, token);

        // get booking
        const bookings = await api(`/bookings?userId=${login.id}&role=${login.role}`, "GET", null, token);
        
        if (!Array.isArray(getRooms) || getRooms.length === 0) {
            throw new Error("No rooms available");
        }

        const randomBooking = bookings[Math.floor(Math.random() * bookings.length)];

        const updatedBooking = await api(`/bookings/${randomBooking._id}`, "PUT", {
            roomId: randomBooking.roomId,
            userId: login.id,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 7200000).toISOString() // 2 hours later
        }, token);
        

        // delete booking

        const deletedBooking = await api(`/bookings/${randomBooking.roomId}?userId=${login.id}&role=${login.role}`, "DELETE", null, token);
        

    //} catch (err) {
    //    console.error("Error message", err.message);
   // }
})();