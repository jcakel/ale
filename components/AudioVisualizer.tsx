import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  color?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, color = '#d946ef' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bars: number[] = Array(20).fill(10);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / bars.length;

      bars = bars.map((h) => {
        if (!isActive) return Math.max(h * 0.9, 2); // Decay
        // Random fluctuation for "talking" effect if no real analyser is attached (simulated for simplicity in UI)
        const target = Math.random() * (height * 0.8);
        return h + (target - h) * 0.2; 
      });

      bars.forEach((h, i) => {
        const x = i * barWidth;
        const y = (height - h) / 2;
        
        ctx.fillStyle = color;
        // Rounded bars
        ctx.beginPath();
        ctx.roundRect(x + 2, y, barWidth - 4, h, 4);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationRef.current);
  }, [isActive, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full max-w-[300px] h-[100px]"
    />
  );
};

export default AudioVisualizer;