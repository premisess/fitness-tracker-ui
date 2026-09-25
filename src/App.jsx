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
import AppLayout from './components/AppLayout';
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
                    <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    {/* Signed-in pages share the sidebar layout. */}
                    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/workouts" element={<Workouts />} />
                        <Route path="/goals" element={<Goals />} />
                        <Route path="/water-intake" element={<WaterIntake />} />
                        <Route path="/bmi" element={<BMI />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/nutrition" element={<Nutrition />} />
                        <Route path="/exercises" element={<ExerciseLibrary />} />
                        <Route path="/account-settings" element={<AccountSettings />} />
                        <Route path="/records" element={<Records />} />
                        <Route path="/records/:exerciseId" element={<ExerciseRecords />} />
                        <Route path="/run" element={<RunTracker />} />
                        <Route path="/runs" element={<RunHistory />} />
                        <Route path="/runs/:workoutId" element={<RunDetail />} />
                        <Route path="/plans" element={<Plans />} />
                        <Route path="/plans/new" element={<PlanBuilder />} />
                        <Route path="/plans/:slug/edit" element={<PlanBuilder />} />
                        <Route path="/plans/:slug" element={<PlanDetail />} />
                        <Route path="/achievements" element={<Achievements />} />
                    </Route>
                </Routes>
                {/* Watches for saved workouts, runs and meals, and celebrates any badge they earn. */}
                <BadgeCelebration />
            </Router>
        </ThemeProvider>
    );
}

export default App;
