import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
const Login = lazy(() => import('./modules/auth/Login'));
const ForgotPassword = lazy(() => import('./modules/auth/ForgotPassword'));
const ChangePassword = lazy(() => import('./modules/change_password/ChangePassword'));
const Dashboard = lazy(() => import('./modules/dashboard/Dashboard'));
const TrainerList = lazy(() => import('./modules/trainers/TrainerList'));
const Subjects = lazy(() => import('./modules/masters/Subjects'));
const Locations = lazy(() => import('./modules/masters/Locations'));
const Trainings = lazy(() => import('./modules/trainings/Trainings'));
const Participants = lazy(() => import('./modules/participants/Participants'));
const ParticipantCsvImport = lazy(() => import('./modules/participants/ParticipantCsvImport'));


function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div role="status" style={{ padding: '2rem', textAlign: 'center' }}>Loading screen…</div>}>
      <Routes>
        {/* Public Route */}
        {/* <Route path="/" element={<PublicReport />} /> */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        {/* Protected Routes (Login Required) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<MainLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="trainers" element={<TrainerList />} />
            <Route path="training/subjects" element={<Subjects />} />
            <Route path="locations" element={<Locations />} />
            <Route path="trainings" element={<Trainings />} />
            <Route path="participants" element={<Participants />} />
            <Route path="participants/import" element={<ParticipantCsvImport />} />
            <Route path="trainee/chngpass" element={<ChangePassword />} />
          </Route>
        </Route>
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
