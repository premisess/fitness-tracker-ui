import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Workouts from './pages/Workouts';
import Goals from './pages/Goals';
import WaterIntake from './pages/WaterIntake';
import BMI from './pages/BMI';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Nutrition from './pages/Nutrition';
import ExerciseLibrary from './pages/ExerciseLibrary';
import Analytics from './pages/Analytics';
import AccountSettings from './pages/AccountSettings';
import Records from './pages/Records';
import ExerciseRecords from './pages/ExerciseRecords';
import RunTracker from './pages/RunTracker';
import RunHistory from './pages/RunHistory';
import RunDetail from './pages/RunDetail';
import Plans from './pages/Plans';
import PlanDetail from './pages/PlanDetail';
import PlanBuilder from './pages/PlanBuilder';
import Achievements from './pages/Achievements';
import Upgrade from './pages/Upgrade';
import UpgradeDialog from './components/UpgradeDialog';
import BadgeCelebration from './components/BadgeCelebration';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    {/* One page for both: switching slides the form across the screen. */}
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/register" element={<AuthPage />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
                    <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
                    <Route path="/water-intake" element={<ProtectedRoute><WaterIntake /></ProtectedRoute>} />
                    <Route path="/bmi" element={<ProtectedRoute><BMI /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/nutrition" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
                    <Route path="/exercises" element={<ProtectedRoute><ExerciseLibrary /></ProtectedRoute>} />
                    <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                    <Route path="/records" element={<ProtectedRoute><Records /></ProtectedRoute>} />
                    <Route path="/records/:exerciseId" element={<ProtectedRoute><ExerciseRecords /></ProtectedRoute>} />
                    <Route path="/run" element={<ProtectedRoute><RunTracker /></ProtectedRoute>} />
                    <Route path="/runs" element={<ProtectedRoute><RunHistory /></ProtectedRoute>} />
                    <Route path="/runs/:workoutId" element={<ProtectedRoute><RunDetail /></ProtectedRoute>} />
                    <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
                    <Route path="/plans/new" element={<ProtectedRoute><PlanBuilder /></ProtectedRoute>} />
                    <Route path="/plans/:slug/edit" element={<ProtectedRoute><PlanBuilder /></ProtectedRoute>} />
                    <Route path="/plans/:slug" element={<ProtectedRoute><PlanDetail /></ProtectedRoute>} />
                    <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                    <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
                </Routes>
                {/* Watches for saved workouts, runs and meals, and celebrates any badge they earn. */}
                <BadgeCelebration />
                {/* Offers Ultimate when a free user reaches a paid feature. */}
                <UpgradeDialog />
            </Router>
        </ThemeProvider>
    );
}

export default App;
