import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
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
import Nutrition from './pages/Nutrition';
import ExerciseLibrary from './pages/ExerciseLibrary';
import Analytics from './pages/Analytics';
import AccountSettings from './pages/AccountSettings';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
                    <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
                    <Route path="/water-intake" element={<ProtectedRoute><WaterIntake /></ProtectedRoute>} />
                    <Route path="/bmi" element={<ProtectedRoute><BMI /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/nutrition" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
                    <Route path="/exercises" element={<ProtectedRoute><ExerciseLibrary /></ProtectedRoute>} />
                    <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
