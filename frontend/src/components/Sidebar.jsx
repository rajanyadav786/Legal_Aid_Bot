import React, { useState } from 'react';
import { Icons } from './Icons';
import LEGAL_CATEGORIES from '../data/legalCategories';
import './Sidebar.css';

const Sidebar = ({ activeCategory, onCategoryChange, onNewChat, isOpen, onClose }) => {
  const [hoveredId, setHoveredId] = useState(null);

  const handleCategoryClick = (category) => {
    onCategoryChange(category);
    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
      onClose?.();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} role="navigation" aria-label="Legal issue categories">
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__logo">
              <Icons.scales style={{ width: 22, height: 22 }} />
            </div>
            <div className="sidebar__brand-text">
              <h1 className="sidebar__title">Nyaay Saathi</h1>
              <span className="sidebar__subtitle">न्याय साथी</span>
            </div>
          </div>

          <button
            className="sidebar__close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <Icons.close style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <button className="sidebar__new-chat" onClick={onNewChat}>
          <Icons.newChat style={{ width: 18, height: 18 }} />
          <span>New Conversation</span>
        </button>

        <div className="sidebar__divider" />

        <p className="sidebar__section-label">Choose Legal Issue</p>

        <nav className="sidebar__categories">
          {LEGAL_CATEGORIES.map((cat) => {
            const IconComponent = Icons[cat.icon];
            const isActive = activeCategory?.id === cat.id;
            const isHovered = hoveredId === cat.id;

            return (
              <button
                key={cat.id}
                className={`category-card ${isActive ? 'category-card--active' : ''}`}
                onClick={() => handleCategoryClick(cat)}
                onMouseEnter={() => setHoveredId(cat.id)}
                onMouseLeave={() => setHoveredId(null)}
                aria-pressed={isActive}
                aria-label={`Select ${cat.label} category`}
                style={{
                  '--cat-color': cat.color,
                  '--cat-glow': `${cat.color}22`,
                }}
              >
                <div className="category-card__icon">
                  {IconComponent && <IconComponent style={{ width: 18, height: 18 }} />}
                </div>
                <div className="category-card__text">
                  <span className="category-card__label">{cat.label}</span>
                  <span className="category-card__desc">{cat.description}</span>
                </div>
                {isActive && (
                  <div className="category-card__indicator" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__disclaimer">
            <Icons.shield style={{ width: 14, height: 14, opacity: 0.5 }} />
            <span>AI assistant. Not formal legal counsel.</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
