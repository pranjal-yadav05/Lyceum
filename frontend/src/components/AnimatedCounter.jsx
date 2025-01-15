import React from 'react';
import { animated, useSpring } from '@react-spring/web';

const AnimatedCounter = ({ value }) => {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    delay: 200,
    config: { mass: 1, tension: 20, friction: 10 },
  });

  return (
    <div className="relative h-12 overflow-hidden">
      <animated.div
        style={{
          position: 'absolute',
          width: '100%',
          height: '200%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          transform: number.to(n => `translateY(${-(n % 1) * 50}%)`),
        }}
      >
        <animated.span className="flex-1 flex items-center">
          {number.to(n => Math.floor(n))}
        </animated.span>
        <animated.span className="flex-1 flex items-center">
          {number.to(n => Math.floor(n) + 1)}
        </animated.span>
      </animated.div>
    </div>
  );
};

export default AnimatedCounter;
