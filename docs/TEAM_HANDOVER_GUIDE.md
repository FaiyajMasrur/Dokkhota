# Dokkhota Team Handover Guide

This guide is written in very simple language so a new teammate can start without confusion.

## 1. What is already built

Here is the current status of the 20 features.

| # | Feature | Status |
|---|---|---|
| 1 | Skill profile creation | Partly done |
| 2 | Skill listing with category, level, availability | Done |
| 3 | Search and filter skills | Partly done |
| 4 | Credit system | Done |
| 5 | Appointment/session booking | Done |
| 6 | Session confirmation and cancellation | Partly done |
| 7 | In-app real-time chat | Not done |
| 8 | Video session integration | Not done |
| 9 | Rating and review system | Not done |
| 10 | Skill verification badge | Not done |
| 11 | Admin dashboard for users and disputes | Partly done |
| 12 | Credit transaction history | Done |
| 13 | Notification system | Not done |
| 14 | Session history log | Partly done |
| 15 | Leaderboard | Not done |
| 16 | Skill request board | Done |
| 17 | Report/flag system | Not done |
| 18 | User portfolio page | Partly done |
| 19 | Category management by admin | Done |
| 20 | Analytics dashboard | Not done |

## 2. What is already working well

The team can already use these parts:

- Sign up, login, email verification, and password reset
- Profile editing and profile photo upload
- Skill listing creation
- Search and browse listings
- Credit balance and transaction history
- Booking requests between users
- Admin category management page
- Request board for learning requests

## 3. What still needs work

The next teammates should focus on these features next:

- Real-time chat
- Video calling
- Reviews and ratings
- Badge approval workflow
- Report/flag system
- Better admin pages
- Leaderboard and analytics

## 4. Software you need to install

Please install these first.

1. Node.js
   - Download from: https://nodejs.org/
   - Install the LTS version.
   - After install, open a terminal and run:
     - node -v
     - npm -v

2. Git
   - Download from: https://git-scm.com/
   - Install it and verify with:
     - git --version

3. MongoDB
   - You can install MongoDB locally.
   - Or use MongoDB Atlas if you prefer cloud MongoDB.
   - If you use local MongoDB, the app will try this address:
     - mongodb://127.0.0.1:27017/dokkhota

4. VS Code
   - Download from: https://code.visualstudio.com/

## 5. What to do with the zip file

1. Download the Dokkhota zip file.
2. Extract it on your computer.
3. Open the extracted folder in VS Code.
4. Make sure you see these folders:
   - backend
   - frontend
   - docs

## 6. How to install the project

Open one terminal and go to the backend folder:

- cd backend
- npm install

Open a second terminal and go to the frontend folder:

- cd frontend
- npm install

## 7. How to start the project

### Start the backend

In the backend terminal run:

- npm run dev

You should see something like:

- Dokkhota backend running on port 5000
- MongoDB connected successfully

### Start the frontend

In the frontend terminal run:

- npm run dev

Then open the website address shown in the terminal. Usually it is:

- http://localhost:5173

## 8. Important setup for the backend

The backend uses a file called .env.

1. Go to the backend folder.
2. Copy the example file:
   - copy .env.example .env
3. If you use local MongoDB, you can keep the default values.
4. If you want real email sending, add real email credentials.
5. If you do not want to send real emails during development, keep the default disabled setting.

## 9. How to use the website

Once the website opens:

1. Create a new account.
2. Verify your email.
3. Log in.
4. Create a skill listing.
5. Search for skills.
6. Book a session.
7. Use the request board.

## 10. What to do next for Sprint 3 and 4

The next team should work on these tasks:

- Add real-time chat
- Add video call support
- Add review and rating after sessions
- Build badge approval flow
- Add report/flag system
- Add leaderboard and analytics
- Improve admin dashboard pages

## 11. GitHub repository

The repository link is:

- https://github.com/FaiyajMasrur/Dokkhota

To upload your work to GitHub later, use:

- git add .
- git commit -m "Describe your changes"
- git push origin main

## 12. Quick help if something breaks

If the backend port is busy:

- Close old Node terminals or run:
  - taskkill /F /IM node.exe

If MongoDB is not running:

- Start MongoDB locally.

If packages are missing:

- Run npm install again in the backend and frontend folders.

## 13. Final note

This project already has a strong base. The next team can continue from here without rebuilding everything from scratch.
