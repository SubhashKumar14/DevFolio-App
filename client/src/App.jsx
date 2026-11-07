import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthBootstrap } from '@/components/auth/AuthBootstrap';

// Lazy loaded pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const DesignStudioPage = lazy(() => import('@/pages/DesignStudioPage'));
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
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage'));

// Loading fallback
const PageLoader = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent pt-4"></div>
  </div>
);

function App() {
  const DEVELOPER_ROLES = ['developer', 'mentor'];
  const ALL_ROLES = ['developer', 'mentor', 'recruiter', 'admin'];

  return (
    <>
      <AuthBootstrap />
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Public Routes */}
        <Route element={<RootLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/design-studio" element={<DesignStudioPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/p/:handle" element={<PublicProfilePage />} />
        </Route>

        {/* Public: Portfolio Preview (no auth needed) */}
        <Route path="/portfolio/preview/:handle" element={<PortfolioPreview />} />
        <Route path="/portfolio/:handle" element={<PortfolioPreview />} />

        {/* Protected: Onboarding (no sidebar) */}
        <Route element={<RootLayout />}>
          <Route
            path="/onboarding"
            element={(
              <ProtectedRoute allowedRoles={DEVELOPER_ROLES}>
                <OnboardingPage />
              </ProtectedRoute>
            )}
          />
        </Route>

        {/* Protected: Portfolio Editor (no sidebar) */}
        <Route element={<RootLayout />}>
          <Route
            path="/portfolio/editor"
            element={(
              <ProtectedRoute allowedRoles={DEVELOPER_ROLES}>
                <PortfolioEditor />
              </ProtectedRoute>
            )}
          />
        </Route>

        {/* Protected Dashboard Routes with Sidebar */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute allowedRoles={DEVELOPER_ROLES}>
                <DashboardPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/profile"
            element={(
              <ProtectedRoute allowedRoles={DEVELOPER_ROLES}>
                <ProfilePage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/settings"
            element={(
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <SettingsPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/analytics"
            element={(
              <ProtectedRoute allowedRoles={DEVELOPER_ROLES}>
                <AnalyticsPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/projects"
            element={(
              <ProtectedRoute allowedRoles={DEVELOPER_ROLES}>
                <ProjectsPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/contests"
            element={(
              <ProtectedRoute allowedRoles={DEVELOPER_ROLES}>
                <ContestsPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/leaderboard"
            element={(
              <ProtectedRoute allowedRoles={DEVELOPER_ROLES}>
                <LeaderboardPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/compare"
            element={(
              <ProtectedRoute allowedRoles={DEVELOPER_ROLES}>
                <ComparePage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/goals"
            element={(
              <ProtectedRoute allowedRoles={DEVELOPER_ROLES}>
                <GoalsPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/wrapped"
            element={(
              <ProtectedRoute allowedRoles={DEVELOPER_ROLES}>
                <WrappedPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/admin"
            element={(
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/recruiter"
            element={(
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <RecruiterPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/portfolio"
            element={(
              <ProtectedRoute allowedRoles={DEVELOPER_ROLES}>
                <PortfolioPage />
              </ProtectedRoute>
            )}
          />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;

