import React from 'react';

const BadgeDisplay = ({ badge }) => {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-gradient-to-br from-secondary/10 to-secondary/5 p-4 text-center transition-transform hover:scale-105 dark:from-secondary/20 dark:to-secondary/10">
      <div className="text-4xl">{badge.icon}</div>
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{badge.title}</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">{badge.description}</p>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500">
        {new Date(badge.unlockedAt).toLocaleDateString()}
      </p>
    </div>
  );
};

export default BadgeDisplay;
