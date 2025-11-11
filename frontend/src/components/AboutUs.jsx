import React, { useEffect } from 'react'
import AOS from 'aos';
import 'aos/dist/aos.css';

const AboutUs = () => {
    useEffect(() => {
        AOS.init({
          duration: 500, 
          once: false,
        });
      }, []);
  return (
    <div id="aboutme" className="about-container">
        <h2>
            <span>A</span><span>b</span><span>o</span><span>u</span><span>t</span> <span>U</span><span>s</span>
        </h2>

        <div className="about-content">
            <div className="about-text left" data-aos="fade-right">
            <p>
                We are working on <span className="highlight">Federated Learning for Healthcare Innovation</span> — a system designed to train AI models across multiple hospitals and clinics in Nepal while keeping sensitive patient data private. 
            </p>
            </div>

            <div className="about-image" data-aos="flip-left">
            <img src="/ogo1.png" alt="Healthcare Federated Learning" />
            </div>

            <div className="about-text right" data-aos="fade-left">
            <p>
                Our goal is to <span className="highlight">leverage scattered health data</span> to boost research in Nepal, providing the most <span className="highlight">generalized and accurate AI models</span> for local healthcare applications, while preserving privacy and promoting collaboration.
            </p>
            </div>
        </div>
    </div>

  )
}

export default AboutUs