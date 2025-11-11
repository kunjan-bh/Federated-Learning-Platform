import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const WhyChooseUs = () => {
  useEffect(() => {
    AOS.init({ duration: 600, once: true });
  }, []);

  return (
    <section className="whychooseus-section" >
      <div className="whychooseus-container" id="WhyUs">
        <h2 className="whychooseus-title" data-aos="fade-up">
          Why Choose <span>NeuroNode</span>
        </h2>
        <p className="whychooseus-subtitle" data-aos="fade-up" data-aos-delay="150">
          Revolutionizing healthcare research in Nepal through Federated Learning — enabling hospitals and clinics to collaborate securely, train locally, and contribute to a powerful generalized AI model.
        </p>

        <div className="whychooseus-cards">
          <div className="why-card" data-aos="fade-up" data-aos-delay="200">
            <div className="icon-circle">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h3>No Data Leaves Your Server</h3>
            <p>
              Data is trained locally within each institution. Privacy remains intact, ensuring compliance and trust while contributing to global AI progress.
            </p>
          </div>

          <div className="why-card" data-aos="fade-up" data-aos-delay="350">
            <div className="icon-circle">
              <i className="fa-solid fa-diagram-project"></i>
            </div>
            <h3>Scalable & Secure</h3>
            <p>
              Built for Nepal’s diverse healthcare ecosystem — from clinics to major hospitals — our federated architecture scales effortlessly and remains secure end-to-end.
            </p>
          </div>

          <div className="why-card" data-aos="fade-up" data-aos-delay="500">
            <div className="icon-circle">
              <i className="fa-solid fa-stethoscope"></i>
            </div>
            <h3>Designed for Real-World Healthcare Use</h3>
            <p>
              Our platform unites scattered healthcare data to train a generalized model that supports local research, innovation, and the development of healthcare AI APIs for Nepal.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
