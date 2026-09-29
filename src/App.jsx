import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";

import Leads from "./pages/Leads/Leads";
import LeadDetails from "./pages/Leads/LeadDetails";

import Customers from "./pages/Customers/Customers";
import CustomerDetails from "./pages/Customers/CustomerDetails";

import Appointments from "./pages/Appointments/Appointments";
import AppointmentDetails from "./pages/Appointments/AppointmentDetails";

import Services from "./pages/Services/Services";
import Conversations from "./pages/Conversations/Conversations";
import Calls from "./pages/Calls/Calls";
import Reviews from "./pages/Reviews/Reviews";
import Automations from "./pages/Automations/Automations";
import Templates from "./pages/Templates/Templates";
import Notifications from "./pages/Notifications/Notifications";
import Integrations from "./pages/Integrations/Integrations";
import Settings from "./pages/Settings/Settings";

import Users from "./pages/Users/Users";
import Emails from "./pages/Email/Emails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          }
        />

        {/* Leads */}
        <Route
          path="/leads"
          element={
            <MainLayout>
              <Leads />
            </MainLayout>
          }
        />

        <Route
          path="/leads/:id"
          element={
            <MainLayout>
              <LeadDetails />
            </MainLayout>
          }
        />

        {/* Customers */}
        <Route
          path="/customers"
          element={
            <MainLayout>
              <Customers />
            </MainLayout>
          }
        />

        <Route
          path="/customers/:id"
          element={
            <MainLayout>
              <CustomerDetails />
            </MainLayout>
          }
        />

        {/* Appointments */}
        <Route
          path="/appointments"
          element={
            <MainLayout>
              <Appointments />
            </MainLayout>
          }
        />

        <Route
          path="/appointments/:id"
          element={
            <MainLayout>
              <AppointmentDetails />
            </MainLayout>
          }
        />

        {/* Services */}
        <Route
          path="/services"
          element={
            <MainLayout>
              <Services />
            </MainLayout>
          }
        />

        {/* Conversations */}
        <Route
          path="/conversations"
          element={
            <MainLayout>
              <Conversations />
            </MainLayout>
          }
        />

        {/* Calls */}
        <Route
          path="/calls"
          element={
            <MainLayout>
              <Calls />
            </MainLayout>
          }
        />

        {/* Reviews */}
        <Route
          path="/reviews"
          element={
            <MainLayout>
              <Reviews />
            </MainLayout>
          }
        />

        {/* Automations */}
        <Route
          path="/automations"
          element={
            <MainLayout>
              <Automations />
            </MainLayout>
          }
        />

        {/* Templates */}
        <Route
          path="/templates"
          element={
            <MainLayout>
              <Templates />
            </MainLayout>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <MainLayout>
              <Notifications />
            </MainLayout>
          }
        />

        {/* Integrations */}
        <Route
          path="/integrations"
          element={
            <MainLayout>
              <Integrations />
            </MainLayout>
          }
        />

        {/* Users */}
        <Route
          path="/users"
          element={
            <MainLayout>
              <Users />
            </MainLayout>
          }
        />

        {/* Emails */}
        <Route
          path="/emails"
          element={
            <MainLayout>
              <Emails />
            </MainLayout>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <MainLayout>
              <Settings />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;