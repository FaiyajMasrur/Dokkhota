# Dokkhota Frontend

Frontend client application built with React, Vite, and Tailwind CSS for the Dokkhota peer-to-peer skill exchange platform.

## Completed Features (Sprint 3)
- **Credit Balance and Transaction History**: Ledger table, starter bonuses, session completion earnings (+10 SC), refunds, and spendings (`CreditHistoryPage.jsx`, `creditController.js`).
- **Booking Requests Between Users**: Complete booking flow between learners and skill providers, request submission, acceptance, cancellation, and completion (`BookSessionPage.jsx`, `bookingController.js`).
- **Skill Verification Badge**: Verification checkmark badges (`<VerificationBadge />`) displayed across verified teacher profiles, skill listings, leaderboard, and admin badge management (`VerificationBadge.jsx`, `AdminBadgesPage.jsx`).
- **Session History Log for both Teacher and Learner**: Unified log table with exact columns `Role | Skill Offered | Partner | Date & Time | Credits | Status | Actions` with direct 1-click status controls (`SessionHistoryPage.jsx`, `sessionHistoryController.js`).
