import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const NavBar = () => {
  return (
    <div id="home" className="navigation-bar">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="logo-back" >
          <div className="logo">
            <img src="/logo.png" alt="logo" />
            <span>euroNode</span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="nav-links">
          <ul>
            <li><a href="#aboutme">About Us</a></li>
            <li><a href="#dash">Offerings</a></li>
            <li><a href="#WhyUs">Why Choose Us</a></li>
          </ul>
        </div>

        {/* Button Section */}
        <div className="nav-button">
          <NavLink to="/signup" className="get-started-btn">
            Get Started
          </NavLink>
        </div>

        {/* Mobile Menu */}
        <div className="menu-box">
          <a href="#menu" id="showmenu"></a>
          <div id="menu" className="menu">
            <a href="#showmenu" className="menu-background"></a>
            <div className="menu-content">
              <div className="menu-logo">
                <img src="/logo.png" alt="logo" />
              </div>
              <div>
                <ul>
                  <li><a href="#home">Home</a></li>
                  <li><a href="#aboutme">About Us</a></li>
                  <li><a href="#projects">Offerings</a></li>
                  <li><a href="#publication">Publications</a></li>
                  <li><a href="#awards">Recognitions</a></li>
                  <li><a href="/login" className="menu-btn">Get Started</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
