import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const DashboardSection = () => {
  useEffect(() => {
    AOS.init({ duration: 500, once: false, easing: "ease-in-out" });
  }, []);

  return (
    <section className="dashboard-section" id="dash">
      <h2 data-aos="fade-up">
        Leverage the power of <span>Federated Learning</span> for healthcare innovation
      </h2>

      <div className="dashboard-container">
        <div className="dashboard-image" data-aos="fade-right">
          <img src="/header.png" alt="Federated Dashboard" />
        </div>

        <div className="dashboard-content" data-aos="fade-left">
          <div className="features-list">
            <div className="feature" data-aos="fade-up" data-aos-delay="100">
              <div className="feature-number">01</div>
              <div className="feature-text">
                <h3>Privacy-Preserving AI</h3>
                <p>
                  Build generalized healthcare models without sharing sensitive patient data.
                </p>
              </div>
            </div>

            <div className="feature" data-aos="fade-up" data-aos-delay="200">
              <div className="feature-number">02</div>
              <div className="feature-text">
                <h3>Collaborative Learning</h3>
                <p>
                  Enable hospitals and clinics to train shared models while keeping local data secure.
                </p>
              </div>
            </div>

            <div className="feature" data-aos="fade-up" data-aos-delay="300">
              <div className="feature-number">03</div>
              <div className="feature-text">
                <h3>AI Assistance</h3>
                <p>
                  Support doctors with predictive insights for improved diagnosis and treatment.
                </p>
              </div>
            </div>
          </div>

          <p className="dashboard-description" data-aos="fade-up" data-aos-delay="400">
            Unlock advanced healthcare solutions by training AI models collectively across
            institutions.
          </p>

          <div className="metrics-box" data-aos="zoom-in" data-aos-delay="500">
            <div className="highlight-box">
              <span>40%</span>
            </div>
            <div>
              Federated learning reduces training data dependency while improving model
              generalization.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardSection;
