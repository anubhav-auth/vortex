import React from 'react';

const MachinedCard = ({ children, className = '', accent = false }) => {
  return (
    <div className={`machined-card bg-white relative overflow-hidden ${className}`}>
      {accent && <div className="nose-cone-accent opacity-20 pointer-events-none"></div>}
      {children}
    </div>
  );
};

export default MachinedCard;
