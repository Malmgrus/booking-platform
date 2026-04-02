import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export async function connect() {
    try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    console.log('uri', uri);
    await mongoose.connect(uri);
    console.log("connected")
    } catch (error) {
        console.error("Unable to connect to DB: ", error)
    }
}

export async function disconnect() {
    try {
        console.log("disconnecting from DB")
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    } catch (error) {
        console.error('error disconnecting from DB: ', error);
    }
}

export default { connect, disconnect };