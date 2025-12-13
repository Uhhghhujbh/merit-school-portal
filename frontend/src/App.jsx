import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- AUTH PAGES (Login) ---
// These are in src/pages/auth/
import AdminLogin from './pages/auth/AdminLogin';
import StudentLogin from './pages/auth/StudentLogin';
import StaffLogin from './pages/auth/StaffLogin';
import ParentLogin from './pages/auth/ParentLogin';

// --- PUBLIC PAGES (Registration) ---
// These are in src/pages/public/ <--- FIXED PATHS
import StudentRegister from './pages/public/StudentRegister';
import StaffRegister from './pages/public/StaffRegister';

// --- DASHBOARDS ---
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';

import LandingPage from './pages/LandingPage'; 

// Protected Route Wrapper
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, role, token } = useAuthStore();
  
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes (Login) */}
        <Route path="/auth/admin" element={<AdminLogin />} />
        <Route path="/auth/student" element={<StudentLogin />} />
        <Route path="/auth/staff" element={<StaffLogin />} />
        <Route path="/auth/parent" element={<ParentLogin />} />

        {/* Registration Routes (Public) */}
        <Route path="/auth/student/register" element={<StudentRegister />} />
        <Route path="/auth/staff/register" element={<StaffRegister />} />
        
        {/* --- PROTECTED DASHBOARDS --- */}
        <Route 
          path="/auth/admin/dashboard" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/auth/student/dashboard" 
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/auth/staff/dashboard" 
          element={
            <ProtectedRoute allowedRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/auth/parent/dashboard" 
          element={
            <ParentDashboard /> 
          } 
        />

        {/* 404 Fallback */}
        <Route path="*" element={
          <div className="h-screen flex flex-col items-center justify-center text-slate-500">
            <h1 className="text-4xl font-bold">404</h1>
            <p>Page Not Found</p>
            <a href="/" className="text-blue-600 hover:underline mt-4">Go Home</a>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;
