import React from "react";
import { FaLinkedinIn, FaInstagram, FaFacebookF, FaArrowUp, FaXTwitter } from "react-icons/fa6";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Left Section */}
        <div className="footer-left">
          <h2 className="footer-logo">NeuroNode</h2>
          <p className="footer-text">
            Advancing healthcare through privacy-preserving AI. 
            Our federated learning platform enables institutions to collaborate 
            securely while keeping patient data decentralized.
          </p>
          <div className="social-icons-footer">
            <a href="#"><FaXTwitter /></a>
            <a href="#"><FaLinkedinIn /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaFacebookF /></a>
          </div>
          <Link to="" className="back-to-top">
            <FaArrowUp /> BACK TO TOP
          </Link>
        </div>

        {/* Site Map */}
        <div className="footer-mid">
          <h4>Explore</h4>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Federated Learning</a></li>
            <li><a href="#">Healthcare AI</a></li>
            <li><a href="#">Team</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div className="footer-right">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Data Collaboration Terms</a></li>
            <li><a href="#">Security & Compliance</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        © 2025 NeuroFed | Empowering secure, decentralized intelligence in healthcare.
      </div>
    </footer>
  );
};

export default Footer;
