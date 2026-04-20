# Deployment Checklist

## 1. Firebase project

- Create a Firebase project.
- Enable Authentication.
- Turn on Email/Password sign-in.
- Create a Firestore database in production mode.
- Add a Firebase Web App and copy its config values.

## 2. Local environment

Create `.env.local` from the template:

```powershell
Copy-Item .env.example .env.local
```

Fill these values:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 3. Verify locally

```powershell
npm install
npm run lint
npm run build
npm run dev
```

## 4. Firestore deployment

Install Firebase CLI if needed:

```powershell
npm install -g firebase-tools
```

Log in:

```powershell
firebase login
```

Initialize the project link:

```powershell
firebase use --add
```

Deploy rules:

```powershell
npm run firestore:rules
```

Deploy indexes:

```powershell
npm run firestore:indexes
```

## 5. Vercel deployment

- Import the repository into Vercel.
- Set all `NEXT_PUBLIC_FIREBASE_*` environment variables.
- Deploy the `main` branch.

Optional Vercel CLI flow:

```powershell
npm install -g vercel
vercel
```

## 6. Post-deploy smoke test

Check these flows in production:

1. Sign up
2. Log in
3. Create a draft
4. Generate an invite link
5. Open the invite in a private browser window
6. Submit feedback once
7. Confirm duplicate submission is blocked in the same session
8. Confirm feedback count updates on the draft owner dashboard
9. Confirm feedback list and tag counts load

## 7. Known operating notes

- Invite access is public by design for MVP.
- Draft reads are public in Firestore rules to support invite-based access.
- Feedback reads are restricted to the draft owner.
- Firestore composite indexes are required for dashboard, invite list, and feedback list queries.
