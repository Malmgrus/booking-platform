import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const JWT_KEY = "key";

export default function (app) {
    app.use(express.json());
    app.use(cookieParser());
    app.use("/", (req, res, next) => {
        next();
    })
}

export function authenticate(req, res, next) {
    const Header = req.headers.authorization;
    const CookieToken = req.cookies.accessToken;
    if (!Header && !CookieToken) {
        return res.status(401).json({ error: "No token" })
    }

    const token = Header ? Header.split(" ")[1] : CookieToken;
    try {
        const decoded = jwt.verify(token, JWT_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

export function checkRole(role) {
    return (req, res, next) => {
        if (req.user.role.toLowerCase() !== role.toLowerCase()) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    }
}