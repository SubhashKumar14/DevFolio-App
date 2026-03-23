import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Lazy loaded pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const ContestsPage = lazy(() => import('@/pages/ContestsPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const GoalsPage = lazy(() => import('@/pages/GoalsPage'));
const ComparePage = lazy(() => import('@/pages/ComparePage'));
const WrappedPage = lazy(() => import('@/pages/WrappedPage'));
const PublicProfilePage = lazy(() => import('@/pages/PublicProfilePage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const PortfolioEditor = lazy(() => import('@/pages/PortfolioEditor'));
const PortfolioPreview = lazy(() => import('@/pages/PortfolioPreview'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const RecruiterPage = lazy(() => import('@/pages/RecruiterPage'));

// Loading fallback
const PageLoader = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent pt-4"></div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<RootLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/p/:handle" element={<PublicProfilePage />} />
        </Route>

        {/* Public: Portfolio Preview (no auth needed) */}
        <Route path="/portfolio/preview/:userId" element={<PortfolioPreview />} />

        {/* Protected: Onboarding (no sidebar) */}
        <Route element={<RootLayout />}>
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        </Route>

        {/* Protected: Portfolio Editor (no sidebar) */}
        <Route element={<RootLayout />}>
          <Route path="/portfolio/editor" element={<ProtectedRoute><PortfolioEditor /></ProtectedRoute>} />
        </Route>

        {/* Protected Dashboard Routes with Sidebar */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/dashboard/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/dashboard/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/dashboard/contests" element={<ProtectedRoute><ContestsPage /></ProtectedRoute>} />
          <Route path="/dashboard/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
          <Route path="/dashboard/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
          <Route path="/dashboard/wrapped" element={<ProtectedRoute><WrappedPage /></ProtectedRoute>} />
          <Route path="/dashboard/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/dashboard/recruiter" element={<ProtectedRoute><RecruiterPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;

