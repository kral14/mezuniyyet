import React, { useRef, useState } from 'react';
import './CreepyButton.css';

const CreepyButton = ({ onClick, children, type = "button", disabled = false, className = "" }) => {
    const eyesRef = useRef(null);
    const [eyeCoords, setEyeCoords] = useState({ x: 0, y: 0 });

    const translateX = `${-50 + eyeCoords.x * 50}%`;
    const translateY = `${-50 + eyeCoords.y * 50}%`;

    const eyeStyle = {
        transform: `translate(${translateX}, ${translateY})`
    };

    const updateEyes = (e) => {
        const userEvent = e.touches ? e.touches[0] : e;
        if (!eyesRef.current) return;

        const eyesRect = eyesRef.current.getBoundingClientRect();

        const eyes = {
            x: eyesRect.left + eyesRect.width / 2,
            y: eyesRect.top + eyesRect.height / 2
        };

        const cursor = {
            x: userEvent.clientX,
            y: userEvent.clientY
        };

        const dx = cursor.x - eyes.x;
        const dy = cursor.y - eyes.y;
        const angle = Math.atan2(-dy, dx) + Math.PI / 2;

        const visionRangeX = 180;
        const visionRangeY = 75;
        const distance = Math.hypot(dx, dy);

        // Calculate offset (unclamped as per original source)
        const x = (Math.sin(angle) * distance) / visionRangeX;
        const y = (Math.cos(angle) * distance) / visionRangeY;

        setEyeCoords({ x, y });
    };

    return (
        <button
            className={`creepy-btn ${className}`}
            type={type}
            onClick={onClick}
            onMouseMove={updateEyes}
            onTouchMove={updateEyes}
            disabled={disabled}
            style={{ opacity: disabled ? 0.7 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
        >
            <span className="creepy-btn__eyes" ref={eyesRef}>
                <span className="creepy-btn__eye">
                    <span className="creepy-btn__pupil" style={eyeStyle}></span>
                </span>
                <span className="creepy-btn__eye">
                    <span className="creepy-btn__pupil" style={eyeStyle}></span>
                </span>
            </span>
            <span className="creepy-btn__cover">{children}</span>
        </button>
    );
};

export default CreepyButton;
