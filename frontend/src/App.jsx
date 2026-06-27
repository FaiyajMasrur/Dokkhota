// Main React application router for Dokkhota
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ProfileEditPage from './pages/ProfileEditPage.jsx';
import ListingDetailPage from './pages/ListingDetailPage.jsx';
import BookSessionPage from './pages/BookSessionPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import MessageThreadPage from './pages/MessageThreadPage.jsx';
import VideoSessionPage from './pages/VideoSessionPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import RequestBoardPage from './pages/RequestBoardPage.jsx';
import AdminPanelPage from './pages/AdminPanelPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminCategoriesPage from './pages/AdminCategoriesPage.jsx';
import AdminFlagsPage from './pages/AdminFlagsPage.jsx';
import AdminBadgesPage from './pages/AdminBadgesPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import CreateListingPage from './pages/CreateListingPage.jsx';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/explore' element={<ExplorePage />} />
        <Route path='/profile/edit' element={<ProfileEditPage />} />
        <Route path='/profile/:userId' element={<ProfilePage />} />
        <Route path='/listing/:listingId' element={<ListingDetailPage />} />
        <Route path='/book/:listingId' element={<BookSessionPage />} />
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/create-listing' element={<CreateListingPage />} />
        <Route path='/messages' element={<MessagesPage />} />
        <Route path='/messages/:userId' element={<MessageThreadPage />} />
        <Route path='/session/:sessionId' element={<VideoSessionPage />} />
        <Route path='/leaderboard' element={<LeaderboardPage />} />
        <Route path='/requests' element={<RequestBoardPage />} />
        <Route path='/admin' element={<AdminPanelPage />} />
        <Route path='/admin/users' element={<AdminUsersPage />} />
        <Route path='/admin/categories' element={<AdminCategoriesPage />} />
        <Route path='/admin/flags' element={<AdminFlagsPage />} />
        <Route path='/admin/badges' element={<AdminBadgesPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/verify-email' element={<VerifyEmailPage />} />
        <Route path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route path='/reset-password/:token' element={<ResetPasswordPage />} />
        <Route path='*' element={<Navigate to='/' />} />
      </Routes>
    </Router>
  );
}

export default App;
