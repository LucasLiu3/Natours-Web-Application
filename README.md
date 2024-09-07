# Natours - Node.js Web Application

## Description
Developed a robust and secure web application for managing and booking nature tours, focusing on providing a seamless user experience and ensuring the security of user data and transactions.

## Technologies Used
- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT** (JSON Web Tokens)
- **Bcrypt.js**
- **Nodemailer**
- **Pug**
- **Stripe**
- **Parcel**
- **ESLint**
- **Prettier**
- **Nodemon**
- **NDB**

## Key Features
- **Secure Authentication**: Implemented secure login and registration using JSON Web Tokens (JWT) for session management and Bcrypt.js for password hashing. This ensures that user credentials are stored securely and that user sessions are properly managed.
  
- **Database Interaction**: Utilized Mongoose as an Object Data Modeling (ODM) library to interact efficiently with MongoDB, providing schema-based solutions to model data and enabling CRUD operations with ease.
  
- **Enhanced Security**: Implemented various security measures, including Helmet for securing HTTP headers, `express-mongo-sanitize` to prevent NoSQL injection attacks, and `xss-clean` to sanitize user inputs and protect against cross-site scripting (XSS) attacks. These measures collectively safeguard the application from common web vulnerabilities.
  
- **Payment Integration**: Integrated Stripe for secure and seamless online payment processing. This feature allows users to make bookings and payments directly through the application, ensuring financial transactions are handled securely.
  
- **Transactional Emails**: Used Nodemailer to send automated transactional emails to users for various activities, such as booking confirmations and password resets, enhancing user communication and engagement.
  
- **Frontend Asset Management**: Employed Parcel as a bundler to efficiently manage and bundle frontend assets, ensuring fast load times and optimized delivery of static files.
  
- **Code Quality and Formatting**: Applied ESLint to enforce consistent code quality and Prettier for automatic code formatting, maintaining a clean and readable codebase throughout the project.
  
- **Development Tools**: Utilized Nodemon for live server reloading during development, ensuring that changes are reflected instantly without restarting the server manually. Additionally, used NDB for advanced debugging, allowing for more efficient identification and resolution of issues during development.
