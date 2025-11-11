
import { createRoot } from 'react-dom/client'

import "react-toastify/dist/ReactToastify.css";
import './index.css'
import App from './App.jsx'
import '../src/css/NavBar.css'
import '../src/css/HeroSection.css'
import '../src/css/AboutUs.css'
import '../src/css/DashboardSection.css'
import '../src/css/Footer.css'
import '../src/css/Auth.css'
import '../src/css/WhyChooseUs.css'
import '../src/css/Dashboard.css'
import '../src/css/FetchClients.css'
import '../src/css/CentralAuthIteration.css'

import { BrowserRouter } from 'react-router-dom'
import "@fontsource/poppins"; 
import "@fontsource/nova-cut";
import ScrollToTop from './components/ScrollToTop';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <ScrollToTop/>
    <App />
  </BrowserRouter>,
    
)
