import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { productProfile, saveProductProfile, showToast } = useOpportunities();

  // Prefill with existing profile if available, else sensible defaults
  const [productName, setProductName] = useState(
    productProfile?.productName || 'Cloud security software'
  );
  const [website, setWebsite] = useState(productProfile?.website || '');
  const [productDescription, setProductDescription] = useState(
    productProfile?.productDescription ||
      'Automated cloud infrastructure security, IAM policy validation, and eBPF network isolation.'
  );
  const [category, setCategory] = useState(
    productProfile?.category || 'Cloud Infrastructure'
  );

  // Section 2: Ideal Customers
  const [customerTypes, setCustomerTypes] = useState(
    productProfile?.customerTypes || ['Mid-sized companies', 'Engineering teams']
  );
  const [targetIndustries, setTargetIndustries] = useState(
    productProfile?.targetIndustries || ['Technology', 'Financial Services']
  );
  const [targetLocation, setTargetLocation] = useState(
    productProfile?.targetLocation || 'India'
  );

  // Section 3: Problems you solve
  const [problemsSolved, setProblemsSolved] = useState(
    productProfile?.problemsSolved ||
      'Slow database queries, connection pool saturation, Kubernetes pod OOMKilled crashes, and security audit failures.'
  );
  const [supportedTech, setSupportedTech] = useState(
    productProfile?.supportedTech || 'AWS, Kubernetes, PostgreSQL, Python, Docker'
  );

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CATEGORY_OPTIONS = [
    'Developer Tools',
    'Cloud Infrastructure',
    'Cybersecurity',
    'Data & Analytics',
    'AI & Machine Learning',
    'SaaS',
    'FinTech',
    'Healthcare Technology',
    'E-commerce',
    'Other'
  ];

  const CUSTOMER_TYPE_OPTIONS = [
    'Startups',
    'Small businesses',
    'Mid-sized companies',
    'Large enterprises',
    'Developers',
    'IT teams',
    'Engineering teams',
    'Other'
  ];

  const INDUSTRY_OPTIONS = [
    'Technology',
    'Financial Services',
    'Healthcare',
    'Retail & E-commerce',
    'Manufacturing',
    'Logistics',
    'Education',
    'Other'
  ];

  const LOCATION_OPTIONS = [
    'India',
    'North America',
    'Europe',
    'Asia-Pacific',
    'Global'
  ];

  const toggleCustomerType = (type) => {
    setCustomerTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    if (errors.customerTypes) {
      setErrors((prev) => ({ ...prev, customerTypes: null }));
    }
  };

  const toggleIndustry = (ind) => {
    setTargetIndustries((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!productName.trim()) {
      newErrors.productName = 'Product or company name is required.';
    }

    if (website.trim()) {
      try {
        const urlToTest = website.startsWith('http') ? website : `https://${website}`;
        new URL(urlToTest);
      } catch {
        newErrors.website = 'Please enter a valid website URL (e.g. https://yourproduct.com).';
      }
    }

    if (!productDescription.trim()) {
      newErrors.productDescription = 'Please describe what your product does.';
    }

    if (!category) {
      newErrors.category = 'Please select a main product category.';
    }

    if (customerTypes.length === 0) {
      newErrors.customerTypes = 'Please select at least one ideal customer type.';
    }

    if (!targetLocation) {
      newErrors.targetLocation = 'Please select where you want to find customers.';
    }

    if (!problemsSolved.trim()) {
      newErrors.problemsSolved = 'Please mention the problems your product helps solve.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please complete all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);

    const updatedProfile = {
      productName: productName.trim(),
      website: website.trim(),
      productDescription: productDescription.trim(),
      category,
      customerTypes,
      targetIndustries,
      targetLocation,
      problemsSolved: problemsSolved.trim(),
      supportedTech: supportedTech.trim(),
      targetIndustry: targetIndustries[0] || 'Technology',
      targetCompanySize: customerTypes[0] || 'Mid-sized companies',
      targetMarket: targetLocation,
      keyFeatures: supportedTech.trim()
    };

    saveProductProfile(updatedProfile);
    showToast('Product profile saved! Customizing opportunity matches.', 'success');

    setTimeout(() => {
      navigate('/dashboard');
    }, 400);
  };

  const handleSkip = () => {
    showToast('Skipped for now. Opportunities loaded with default context.', 'info');
    navigate('/dashboard');
  };

  return (
    <div className="onboarding-split-layout">
      {/* Left Column: Vision & Concept */}
      <aside className="onboarding-brand-sidebar">
        <div className="onboarding-brand-content">
          <div className="onboarding-brand-lockup">
            <span className="brand-dot-pulse" aria-hidden="true" />
            <span className="onboarding-brand-name font-editorial">DarkIntent</span>
          </div>

          <div className="onboarding-hero-message">
            <h1 className="onboarding-headline font-editorial">Tell us what you sell.</h1>
            <p className="onboarding-subcopy">
              DarkIntent uses these details to find public technical problems your product could help solve
              and match them with relevant companies.
            </p>
          </div>

          {/* 3-Step Sequence Illustration */}
          <div className="onboarding-sequence-card" aria-label="How DarkIntent matching works">
            <div className="sequence-step-item">
              <div className="step-num-badge">1</div>
              <div className="step-text-wrap">
                <strong className="step-title">Your product</strong>
                <span className="step-desc">Features, capabilities & technology stack</span>
              </div>
            </div>

            <div className="sequence-step-arrow" aria-hidden="true">↓</div>

            <div className="sequence-step-item">
              <div className="step-num-badge">2</div>
              <div className="step-text-wrap">
                <strong className="step-title">Relevant problems</strong>
                <span className="step-desc">Public developer forum bugs & bottlenecks</span>
              </div>
            </div>

            <div className="sequence-step-arrow" aria-hidden="true">↓</div>

            <div className="sequence-step-item">
              <div className="step-num-badge">3</div>
              <div className="step-text-wrap">
                <strong className="step-title">Potential customers</strong>
                <span className="step-desc">Verified accounts ready for consultative outreach</span>
              </div>
            </div>
          </div>

          <div className="onboarding-sidebar-footer">
            <span>No marketing jargon. Only genuine technical intent.</span>
          </div>
        </div>
      </aside>

      {/* Right Column: 3-Section Form Panel */}
      <main className="onboarding-main-form-area">
        <div className="onboarding-form-card">
          <header className="onboarding-form-header">
            <div>
              <span className="onboarding-progress-tag">Account Setup</span>
              <h2 className="onboarding-form-title font-editorial">Tell us about your product.</h2>
            </div>
            <button
              type="button"
              className="onboarding-skip-btn"
              onClick={handleSkip}
            >
              Skip for now →
            </button>
          </header>

          <form onSubmit={handleSubmit} className="onboarding-structured-form" noValidate>
            {/* SECTION 1 — YOUR PRODUCT */}
            <section className="onb-section-block">
              <div className="onb-section-header">
                <span className="onb-section-number">01</span>
                <div>
                  <h3 className="onb-section-heading">Your product</h3>
                  <p className="onb-section-sub">Basic information about what you build and deliver.</p>
                </div>
              </div>

              <div className="onb-fields-grid">
                {/* 1. Product or company name */}
                <div className="onb-form-field">
                  <label htmlFor="onb-product-name" className="onb-field-label">
                    Product or company name <span className="req-asterisk">*</span>
                  </label>
                  <input
                    id="onb-product-name"
                    type="text"
                    className={`onb-input ${errors.productName ? 'input-error' : ''}`}
                    placeholder="e.g. Acme Cloud"
                    value={productName}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      if (errors.productName) setErrors((prev) => ({ ...prev, productName: null }));
                    }}
                    required
                  />
                  {errors.productName && <span className="field-error-msg">{errors.productName}</span>}
                </div>

                {/* 2. Product website */}
                <div className="onb-form-field">
                  <label htmlFor="onb-website" className="onb-field-label">
                    Product website <span className="opt-label">(optional)</span>
                  </label>
                  <input
                    id="onb-website"
                    type="url"
                    className={`onb-input ${errors.website ? 'input-error' : ''}`}
                    placeholder="https://yourproduct.com"
                    value={website}
                    onChange={(e) => {
                      setWebsite(e.target.value);
                      if (errors.website) setErrors((prev) => ({ ...prev, website: null }));
                    }}
                  />
                  {errors.website && <span className="field-error-msg">{errors.website}</span>}
                </div>
              </div>

              {/* 3. What does your product do? */}
              <div className="onb-form-field mt-3">
                <label htmlFor="onb-desc" className="onb-field-label">
                  What does your product do? <span className="req-asterisk">*</span>
                </label>
                <textarea
                  id="onb-desc"
                  className={`onb-textarea ${errors.productDescription ? 'input-error' : ''}`}
                  rows={4}
                  placeholder="Describe your product in simple words. What does it help people do, and what problem does it solve?"
                  value={productDescription}
                  onChange={(e) => {
                    setProductDescription(e.target.value);
                    if (errors.productDescription) setErrors((prev) => ({ ...prev, productDescription: null }));
                  }}
                  required
                />
                {errors.productDescription && (
                  <span className="field-error-msg">{errors.productDescription}</span>
                )}
              </div>

              {/* 4. Main product category */}
              <div className="onb-form-field mt-3">
                <label htmlFor="onb-category" className="onb-field-label">
                  Main product category <span className="req-asterisk">*</span>
                </label>
                <select
                  id="onb-category"
                  className={`onb-select ${errors.category ? 'input-error' : ''}`}
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
                  }}
                  required
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="field-error-msg">{errors.category}</span>}
              </div>
            </section>

            {/* SECTION 2 — YOUR IDEAL CUSTOMERS */}
            <section className="onb-section-block">
              <div className="onb-section-header">
                <span className="onb-section-number">02</span>
                <div>
                  <h3 className="onb-section-heading">Your ideal customers</h3>
                  <p className="onb-section-sub">Define the company sizes, sectors, and geographies you target.</p>
                </div>
              </div>

              {/* 5. Who is your ideal customer? */}
              <div className="onb-form-field">
                <label className="onb-field-label">
                  Who is your ideal customer? <span className="req-asterisk">*</span>
                </label>
                <div className="onb-pill-checkboxes-grid">
                  {CUSTOMER_TYPE_OPTIONS.map((type) => {
                    const isSelected = customerTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        className={`onb-choice-pill ${isSelected ? 'choice-selected' : ''}`}
                        onClick={() => toggleCustomerType(type)}
                      >
                        <span className="choice-checkbox-box">{isSelected ? '✓' : ''}</span>
                        <span>{type}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.customerTypes && <span className="field-error-msg">{errors.customerTypes}</span>}
              </div>

              {/* 6. Which industries do you want to target? */}
              <div className="onb-form-field mt-3">
                <label className="onb-field-label">
                  Which industries do you want to target? <span className="opt-label">(optional)</span>
                </label>
                <div className="onb-pill-checkboxes-grid">
                  {INDUSTRY_OPTIONS.map((ind) => {
                    const isSelected = targetIndustries.includes(ind);
                    return (
                      <button
                        key={ind}
                        type="button"
                        className={`onb-choice-pill ${isSelected ? 'choice-selected' : ''}`}
                        onClick={() => toggleIndustry(ind)}
                      >
                        <span className="choice-checkbox-box">{isSelected ? '✓' : ''}</span>
                        <span>{ind}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7. Where do you want to find customers? */}
              <div className="onb-form-field mt-3">
                <label htmlFor="onb-location" className="onb-field-label">
                  Where do you want to find customers? <span className="req-asterisk">*</span>
                </label>
                <div className="onb-location-radios">
                  {LOCATION_OPTIONS.map((loc) => {
                    const isSelected = targetLocation === loc;
                    return (
                      <button
                        key={loc}
                        type="button"
                        className={`onb-radio-button ${isSelected ? 'radio-selected' : ''}`}
                        onClick={() => {
                          setTargetLocation(loc);
                          if (errors.targetLocation) setErrors((prev) => ({ ...prev, targetLocation: null }));
                        }}
                      >
                        <span className="radio-circle-indicator">
                          {isSelected && <span className="radio-inner-dot" />}
                        </span>
                        <span>{loc}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.targetLocation && <span className="field-error-msg">{errors.targetLocation}</span>}
              </div>
            </section>

            {/* SECTION 3 — PROBLEMS YOU SOLVE */}
            <section className="onb-section-block">
              <div className="onb-section-header">
                <span className="onb-section-number">03</span>
                <div>
                  <h3 className="onb-section-heading">Problems you solve</h3>
                  <p className="onb-section-sub">We match these pain points directly against developer complaints.</p>
                </div>
              </div>

              {/* 8. What problems does your product solve? */}
              <div className="onb-form-field">
                <label htmlFor="onb-problems" className="onb-field-label">
                  What problems does your product solve? <span className="req-asterisk">*</span>
                </label>
                <textarea
                  id="onb-problems"
                  className={`onb-textarea ${errors.problemsSolved ? 'input-error' : ''}`}
                  rows={3}
                  placeholder="e.g. Slow database queries, high cloud costs, deployment failures…"
                  value={problemsSolved}
                  onChange={(e) => {
                    setProblemsSolved(e.target.value);
                    if (errors.problemsSolved) setErrors((prev) => ({ ...prev, problemsSolved: null }));
                  }}
                  required
                />
                {errors.problemsSolved && (
                  <span className="field-error-msg">{errors.problemsSolved}</span>
                )}
              </div>

              {/* 9. Which technologies does your product work with? */}
              <div className="onb-form-field mt-3">
                <label htmlFor="onb-tech" className="onb-field-label">
                  Which technologies does your product work with? <span className="opt-label">(optional)</span>
                </label>
                <input
                  id="onb-tech"
                  type="text"
                  className="onb-input"
                  placeholder="e.g. AWS, Kubernetes, PostgreSQL, Python"
                  value={supportedTech}
                  onChange={(e) => setSupportedTech(e.target.value)}
                />
              </div>
            </section>

            {/* Form Footer Action Buttons */}
            <div className="onb-form-actions-footer">
              <button
                type="submit"
                className="btn-onb-primary"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Saving profile...' : 'Save profile & find opportunities →'}</span>
              </button>
              <button
                type="button"
                className="btn-onb-secondary"
                onClick={handleSkip}
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
