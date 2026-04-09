# Advanced Two-Factor Authentication System with Intelligent and Invisible Security Mechanisms

A simple MERN-stack final-year project that demonstrates adaptive authentication using:

- username, email, and password registration
- bcrypt password hashing
- JWT-based sessions
- device recognition
- risk-based authentication
- contextual OTP verification
- visual pattern verification
- invisible honeypot OTP flow
- security logging

## Project Structure

```text
client/
server/
database/
package.json
README.md
```

## Collections

- `Users`
- `Devices`
- `LoginHistory`
- `SecurityLogs`

## Features

### Low risk

- Silent login

### Medium risk

- Visual pattern verification

### High risk

- Contextual OTP verification

### Honeypot defense

- After repeated OTP failures, the user is redirected to a fake OTP screen
- The system logs suspicious behavior silently

## Risk Scoring Logic

The backend uses a simple score:

- New device: `+40`
- Unknown/mock location: `+25`
- Failed login attempts in recent history: `+15` each attempt, capped

Risk mapping:

- `0 - 39` => Low
- `40 - 69` => Medium
- `70+` => High

## Run Locally

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

Copy `server/.env.example` to `server/.env` and update values if needed.

### 3. Start MongoDB

Use a local MongoDB instance for demonstration, for example:

```bash
mongodb://127.0.0.1:27017/advanced-2fa-system
```

### 4. Run backend

```bash
npm run server
```

### 5. Run frontend

```bash
npm run client
```

### 6. Open the app

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Demo Notes

- Mock location is selected in the frontend login form to simulate contextual risk.
- For academic demonstration, the backend returns the OTP in development mode.
- Trusted devices are stored after successful verification.

//Patners

1. Vedant Rathod
2. luv Yadav
3. Bhavesh Ganwani
