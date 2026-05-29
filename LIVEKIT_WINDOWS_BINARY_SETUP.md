# LiveKit Windows Binary Setup

This guide explains how to run the internal meeting video/audio feature without Docker by installing the LiveKit Server Windows binary directly.

## Goal

When a host schedules an internal meeting and another user joins, both users should be able to see and hear each other in the meeting room.

The application already uses LiveKit in the frontend and backend. You only need to run a LiveKit media server locally.

## Prerequisites

- Windows machine
- Project located at:

```text
C:\MTMSETTribe\SETTRIBE-TASK
```

- Backend runs on port `8080`
- Frontend runs through Vite, usually on port `5173`
- LiveKit Server will run on port `7880`

## Step 1: Download LiveKit Server

Open the official LiveKit releases page:

```text
https://github.com/livekit/livekit/releases/latest
```

Download the Windows AMD64 zip file. It is usually named similar to:

```text
livekit_..._windows_amd64.zip
```

Use `amd64` for normal Windows laptops and desktops.

## Step 2: Extract LiveKit

Extract the downloaded zip to:

```text
C:\livekit
```

After extraction, confirm this file exists:

```text
C:\livekit\livekit-server.exe
```

If the extracted folder contains another nested folder, move `livekit-server.exe` so the final path is exactly:

```text
C:\livekit\livekit-server.exe
```

## Step 3: Confirm LiveKit Config

Your project already has this config file:

```text
C:\MTMSETTribe\SETTRIBE-TASK\livekit.yaml
```

Expected content:

```yaml
port: 7880
bind_addresses:
  - "0.0.0.0"
rtc:
  tcp_port: 7881
  port_range_start: 7882
  port_range_end: 7882
  use_external_ip: false
keys:
  devkey: secret
room:
  auto_create: true
```

This config uses:

```text
API key: devkey
API secret: secret
```

These values match the backend defaults in:

```text
C:\MTMSETTribe\SETTRIBE-TASK\backend\src\main\resources\application.properties
```

Backend defaults:

```properties
livekit.url=${LIVEKIT_URL:ws://localhost:7880}
livekit.api-key=${LIVEKIT_API_KEY:devkey}
livekit.api-secret=${LIVEKIT_API_SECRET:secret}
```

## Step 4: Start LiveKit Server

Open a new PowerShell window and run:

```powershell
cd C:\MTMSETTribe\SETTRIBE-TASK
powershell -ExecutionPolicy Bypass -File .\scripts\start-livekit.ps1
```

Keep this PowerShell window open.

LiveKit should start on:

```text
ws://localhost:7880
```

If Windows Firewall asks for permission, allow access on Private networks.

## Step 5: Start Backend

Open another PowerShell window:

```powershell
cd C:\MTMSETTribe\SETTRIBE-TASK
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

The backend should run on:

```text
http://localhost:8080
http://YOUR_HOST_IP:8080
```

If Maven wrapper fails on your machine, install Maven manually and run:

```powershell
cd C:\MTMSETTribe\SETTRIBE-TASK\backend
mvn spring-boot:run
```

## Step 6: Start Frontend

Open another PowerShell window:

```powershell
cd C:\MTMSETTribe\SETTRIBE-TASK
powershell -ExecutionPolicy Bypass -File .\scripts\start-frontend.ps1
```

Vite should show URLs similar to:

```text
Local:   http://localhost:5173
Network: http://192.168.1.10:5173
```

Use the `Network` URL when testing from another device or another user account on the network.

## Step 7: Test Meeting Video And Audio

1. Log in as the host.
2. Schedule a meeting.
3. Set `Meeting Mode` to `Internal Video Call`.
4. Add another active approved user as a participant.
5. Open the meeting details page.
6. Click `Join Meeting`.
7. Log in as the second user in another browser, incognito window, or another device.
8. Open the same meeting.
9. Click `Join Meeting`.
10. Allow camera and microphone permissions in the browser.

Both users should now see and hear each other.

## Important URL Rule

If another device joins the meeting, do not use:

```text
http://localhost:5173
```

Use the host machine IP address shown by Vite:

```text
http://YOUR_HOST_IP:5173
```

Example:

```text
http://192.168.1.10:5173
```

The backend has been updated so when LiveKit is configured as `localhost`, it returns a LiveKit URL based on the backend request host. This lets another user's browser connect to the host machine's LiveKit server instead of trying to connect to its own `localhost`.

## Ports To Allow In Firewall

Allow these ports on the host machine for Private networks:

```text
5173  Frontend Vite app
8080  Spring Boot backend
7880  LiveKit WebSocket
7881  LiveKit TCP RTC
7882  LiveKit UDP RTC
```

If users are only testing on the same computer, firewall changes may not be needed.

## Troubleshooting

### Camera Or Microphone Does Not Work

Check browser permissions:

- Camera allowed
- Microphone allowed
- Browser is not blocking insecure device access

For local development, `localhost` usually works. For other devices on the network, browser media permissions may require a secure context depending on the browser and settings.

### Second User Cannot Join

Check that:

- The user is active and approved.
- The user is included in meeting participants.
- The meeting mode is `Internal Video Call`.
- The frontend is opened using the host IP, not `localhost`.
- Backend is running on port `8080`.
- LiveKit is running on port `7880`.

### Meeting Media Server Is Unreachable

Make sure LiveKit is running:

```powershell
C:\livekit\livekit-server.exe --config C:\MTMSETTribe\SETTRIBE-TASK\livekit.yaml
```

Also check that Windows Firewall allows `livekit-server.exe`.

### Audio Or Video Connects For One User Only

Make sure both users joined the same meeting room from the app's `Join Meeting` button.

Do not manually open different URLs or different meeting records.

### Testing On Different Networks

The local binary setup is best for same-machine or same-LAN testing.

For users joining from outside your network, use one of these instead:

- LiveKit Cloud
- A public server with HTTPS/WSS
- Proper router port forwarding and TLS setup

For production, do not use the development key and secret:

```text
devkey / secret
```

Use strong LiveKit API keys and secrets.

## Command Summary

Terminal 1, LiveKit:

```powershell
cd C:\MTMSETTribe\SETTRIBE-TASK
powershell -ExecutionPolicy Bypass -File .\scripts\start-livekit.ps1
```

Terminal 2, backend:

```powershell
cd C:\MTMSETTribe\SETTRIBE-TASK
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

Terminal 3, frontend:

```powershell
cd C:\MTMSETTribe\SETTRIBE-TASK
powershell -ExecutionPolicy Bypass -File .\scripts\start-frontend.ps1
```

Open app:

```text
http://localhost:5173
```

For another device on the same network:

```text
http://YOUR_HOST_IP:5173
```
