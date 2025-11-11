import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from "react-toastify";

import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import AboutUs from './components/AboutUs';
import DashboardSection from './components/DashboardSection';
import Footer from './components/Footer';
import SignUp from './components/SignUp';
import LogIn from './components/LogIn';
import WhyChooseUs from './components/WhyChooseUs';
import Dashboard from './components/Dashboard';
import CentralAuthIteration from './components/CentralAuthIteration';
import CentralViewModel from './components/CentralViewModel';
import DashboardClient from './components/DashboardClient';
import ClientIterations from './components/ClientIterations';
import SendUpdate from './components/SendUpdate';

const App = () => {
  return (
    <>
      <ToastContainer 
        position="top-right" 
        autoClose={2000} 
        theme="colored" 
        style={{ zIndex: 999999, top: "70px" }} 
      />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <NavBar />
              <HeroSection />
              <AboutUs />
              <DashboardSection />
              <WhyChooseUs />
              <Footer />
            </>
          }
        />

        <Route
          path="/signup"
          element={
            <>
              <NavBar />
              <SignUp />
            </>
          }
        />

        <Route path="/login" element={
            <>
              <NavBar />
              <LogIn />
            </>
          }
        />
        <Route path="/dashboard" element={
            
              <Dashboard></Dashboard>
          }
        />
        <Route path="/centralAuthIteration" element={
            
              <CentralAuthIteration />
          }
        />
        <Route path="/centralAuthModels" element={
            
              <CentralViewModel />
          }
        />
        <Route path="/dashboardClient" element={
            
              <DashboardClient />
          }
        />
        <Route path="/clientIterations" element={
            
              <ClientIterations />
          }
        />
        <Route path="/sendUpdates" element={
            
              <SendUpdate />
          }
        />
      </Routes>
    </>
  );
};

export default App;
