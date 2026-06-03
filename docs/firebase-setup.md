# BeeBridge Firebase Setup

This dashboard uses Firebase Realtime Database at:

```text
beebridge/station
```

## 1. Create Firebase Project

1. Go to Firebase Console.
2. Create a project.
3. Add a Web App.
4. Copy the web app config.
5. Create a Realtime Database.

The dashboard needs `databaseURL` in the Firebase config.

## 2. Paste Config

Open `app.js` and replace:

```js
const firebaseConfig = {
    apiKey: "PASTE_FIREBASE_API_KEY_HERE",
    authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://PASTE_DATABASE_NAME.firebaseio.com",
    projectId: "PASTE_PROJECT_ID",
    storageBucket: "PASTE_PROJECT_ID.appspot.com",
    messagingSenderId: "PASTE_SENDER_ID",
    appId: "PASTE_APP_ID"
};
```

## 3. Test Data

Import or paste `docs/firebase-schema.json` into Realtime Database.

## 4. Temporary Test Rules

For early testing only:

```json
{
  "rules": {
    "beebridge": {
      ".read": true,
      ".write": true
    }
  }
}
```

Do not leave public write rules enabled for the final project.
