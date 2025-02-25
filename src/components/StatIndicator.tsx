import React from 'react';

interface StatIndicatorProps {
  value: string | number;
  type: 'fgs' | 'threept' | 'plusminus';
}

const StatIndicator: React.FC<StatIndicatorProps> = ({ value, type }) => {
  if (type === 'fgs' || type === 'threept') {
    const [made, attempted] = String(value).split('-').map(Number);
    const percentage = attempted > 0 ? made / attempted : 0;
    
    if (percentage >= 0.5) {
      return <span className="good-stat">👍</span>;
    } else {
      return <span className="bad-stat">👎</span>;
    }
  }
  
  if (type === 'plusminus') {
    const numValue = Number(value);
    if (numValue > 0) {
      return <span className="good-stat">{value}</span>;
    } else if (numValue < 0) {
      return <span className="bad-stat">{value}</span>;
    }
    return <span>{value}</span>;
  }
  
  return <span>{value}</span>;
};

export default StatIndicator; 