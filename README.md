Description:
This is a program which uses an api to create users/admin. Then the admin can create and handle rooms (update/delete). Both admin and users can the create and handle bookings, users can handle their own and admins can handle all bookings. There is also notifications when bookings are created, updated and deleted.

NPM packages needed:
npm install express
npm install bcrypt
npm install mongoose
npm install jsonwebtoken
npm install socket.io
npm install socket.io-client
npm install mongodb-memory-server
npm install cookie-parser

To run program:
open terminal and cd to location of project folder, then type "node server.js".
then either in your IDE or a new terminal run testApi.js

Using the program:
testApi.js contains a row of different function calls. These call the api function which builds the fetch request. To call different parts of the api just include the ones you want to use and remove (comment out) the ones you don't want (get /rooms has to be called for the bookings to work). The choosing of rooms and bookings is randomized as standard. In the registrator function you can change between admin role and user role, aswell as username and password.

routes:
/register Method: post. Takes body: username, password and role (default role is user). Returns: message, either success or error with error message.

/login Method: post. takes body: username, password. Returns: JSON object with id, username, password, role and jwt token.

/rooms Method: post. takes body: name, capacity and type. Returns: JSON object with id, name, capacity and type.

/rooms Method: get. takes no body or arguments. Returns array of JSON objects with _id, name, capacity and type.

/rooms/:id Method: put. takes parameter: room id. Body: name, capacity and type. Returns: JSON object with name, capacity and type.

/rooms/:id Method: delete. takes parameter: room id. Returns: JSON object with name, capacity and type.

/bookings Method: post. takes body: roomId, userId, startTime and endTime. Returns: JSON object with roomId, userId, startTime and endTime. Returns: JSON object with roomId, userId, startTime and endTime. Also emits "booking created" notification.

/bookings Method: get. takes parameters: login id and login role. Results: Array of JSON objects with _id, roomId, userId, startTime and endTime.

/bookings/:id Method: put. Takes parameter: booking id. Body: roomId, userId, startTime and endTime. Returns: JSON object with roomId, userId, startTime and endTime. Also emits "booking updated" notification.

/bookings/:id Method: delete. Takes parameter: booking id, login id and login role. Returns: roomId, userId, startTime and endTime. Also emits "booking deleted" notification.
