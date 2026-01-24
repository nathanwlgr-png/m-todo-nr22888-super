import React from 'react';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="pb-20">
      {children}
    </div>
  );
}