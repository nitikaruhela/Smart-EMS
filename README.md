# Smart Event Management

A production-style React + Firebase web application for organizers and attendees, featuring:

- Firebase Authentication with role-based signup (`Organizer`, `Attendee`)
- Protected routes using React Router
- Real-time Firestore dashboards
- College event registration with QR generation and duplicate-safe check-in
- Cultural event venue recommendation workflow
- Tailwind CSS responsive SaaS-style UI

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example` and add your Firebase project keys.

3. Start development:

```bash
npm run dev
```

4. Create Firestore collections:

- `users`
- `events`
- `registrations`

Suggested registration document fields:

```json
{
  "name": "John",
  "email": "john@example.com",
  "eventId": "abc123",
  "eventName": "Campus Fest 2026",
  "attendeeId": "uid123",
  "qrCode": "data:image/png;base64,...",
  "checkedIn": false
}
```

## Notes

- The UI renders even before Firebase is configured, so you can finish setup safely.
- `src/services/eventService.js` is structured for future API-driven event or venue integrations.
