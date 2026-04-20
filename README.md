# The Tiny Audience

Small-audience draft sharing built with Next.js App Router and Firebase.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Firebase Auth
- Firestore

## Setup

1. Install dependencies:

```powershell
npm install
```

2. Copy the environment template:

```powershell
Copy-Item .env.example .env.local
```

3. Fill `.env.local` with your Firebase web app values.

4. Start the app:

```powershell
npm run dev
```

## Firebase

Create these collections in Firestore:

- `users`
- `drafts`
- `invites`
- `feedbacks`

Deploy rules:

```powershell
firebase deploy --only firestore:rules
```

Deploy indexes:

```powershell
firebase deploy --only firestore:indexes
```

## Verification

```powershell
npm run lint
npm run build
```

## Deployment

Firestore config files are already included:

- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json`

For the full deployment flow, see:

- [DEPLOYMENT_CHECKLIST.md](C:/Users/haneu/project4/DEPLOYMENT_CHECKLIST.md:1)

## Current Status

The MVP is implemented and locally tested.

- Sign up and login work
- Draft creation works
- Invite link generation works
- Invite-based feedback submission works
- Feedback overview works

Deployment is not required to continue local development.

When you are ready to publish the app, proceed with Vercel deployment and add the same Firebase environment variables there.

## Routes

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/draft/new`
- `/draft/[draftId]`
- `/draft/[draftId]/feedback`
- `/invite/[inviteId]`
