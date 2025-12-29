# Hospital Referral System

A comprehensive hospital referral management system built with Node.js backend and Angular frontend.

## Features

- User authentication and role-based access control (Super Admin, Hospital Admin, Doctor, Staff)
- Hospital management
- Patient registration and management
- Referral creation and tracking
- Real-time updates using WebSockets
- Dashboard with statistics
- Ambulance and bed status tracking

## Tech Stack

### Backend
- Node.js
- Express.js
- MySQL
- Socket.io for real-time communication
- JWT for authentication

### Frontend
- Angular
- TypeScript
- Bootstrap/Material Design

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL
- Git

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   - Create a MySQL database
   - Update database configuration in `config/database.js`
   - Run the database schema and seed scripts

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   ng serve
   ```

## Usage

1. Access the application at `http://localhost:4200`
2. Register or login with appropriate credentials
3. Use the dashboard to manage hospitals, patients, and referrals

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
