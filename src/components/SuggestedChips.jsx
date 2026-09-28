import React from 'react';

const CHIPS = [
  "Admission process?",
  "B.Sc CS fees?",
  "Hostel facilities?",
  "Scholarship options?",
  "Faculty list?"
];

export default function SuggestedChips({ onChipClick }) {
  return (
    <div className="suggested-chips">
      {CHIPS.map((chip, idx) => (
        <button 
          key={idx} 
          className="chip-btn" 
          onClick={() => onChipClick(chip)}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
