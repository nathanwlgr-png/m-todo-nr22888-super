import React, { useState, useRef, useEffect } from 'react';

export default function DraggableButton({ children, defaultPosition, zIndexBase = 50 }) {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(`draggable-${defaultPosition.id}`);
    return saved ? JSON.parse(saved) : { 
      x: defaultPosition.x || window.innerWidth - 100, 
      y: defaultPosition.y || window.innerHeight - 100 
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [zIndex, setZIndex] = useState(zIndexBase);
  const dragRef = useRef({ startX: 0, startY: 0 });

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setZIndex(zIndexBase + 100); // Traz para frente ao arrastar
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
    };
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setZIndex(zIndexBase + 100);
    const touch = e.touches[0];
    dragRef.current = {
      startX: touch.clientX - position.x,
      startY: touch.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newX = Math.max(0, Math.min(e.clientX - dragRef.current.startX, window.innerWidth - 80));
      const newY = Math.max(0, Math.min(e.clientY - dragRef.current.startY, window.innerHeight - 80));
      
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      
      const newX = Math.max(0, Math.min(touch.clientX - dragRef.current.startX, window.innerWidth - 80));
      const newY = Math.max(0, Math.min(touch.clientY - dragRef.current.startY, window.innerHeight - 80));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setZIndex(zIndexBase); // Volta para z-index normal
        localStorage.setItem(`draggable-${defaultPosition.id}`, JSON.stringify(position));
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, position, defaultPosition.id, zIndexBase]);

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {children}
    </div>
  );
}