'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Eraser, Palette } from 'lucide-react';

interface DoodleCanvasProps {
  width?: number;
  height?: number;
  onCanvasChange?: (dataUrl: string) => void;
  getCanvasDataUrl?: (callback: () => string | null) => void;
  clearCanvasSignal?: boolean;
  onClear?: () => void;
}

export function DoodleCanvas({
  width = 500,
  height = 400,
  onCanvasChange,
  getCanvasDataUrl,
  clearCanvasSignal,
  onClear
}: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000'); // Default black
  const [lineWidth, setLineWidth] = useState(5);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas?.getContext('2d');
  }, []);

  const initializeCanvas = useCallback(() => {
    const context = getContext();
    if (context) {
      context.fillStyle = '#FFFFFF'; // Set background to white
      context.fillRect(0, 0, width, height);
      if (onCanvasChange && canvasRef.current) {
        onCanvasChange(canvasRef.current.toDataURL('image/png'));
      }
    }
  }, [getContext, height, onCanvasChange, width]);
  
  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  useEffect(() => {
    if (getCanvasDataUrl) {
      getCanvasDataUrl(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          // Ensure background is white before exporting if canvas is empty
          const context = getContext();
          if(context){
            // Check if canvas is blank (all white or transparent)
            const pixelBuffer = new Uint32Array(
              context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
            );
            const isBlank = !pixelBuffer.some(color => color !== 0 && color !== 0xffffffff);
            if(isBlank) {
              context.fillStyle = '#FFFFFF';
              context.fillRect(0, 0, canvas.width, canvas.height);
            }
          }
          return canvas.toDataURL('image/png');
        }
        return null;
      });
    }
  }, [getCanvasDataUrl, getContext]);

  useEffect(() => {
    if (clearCanvasSignal && onClear) {
      const context = getContext();
      if (context) {
        context.clearRect(0, 0, width, height);
        initializeCanvas(); 
      }
      onClear(); 
    }
  }, [clearCanvasSignal, getContext, height, initializeCanvas, onClear, width]);


  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const context = getContext();
    if (context) {
      const { offsetX, offsetY } = getCoordinates(event);
      context.beginPath();
      context.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    }
  }, [getContext]);

  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const context = getContext();
    if (context) {
      const { offsetX, offsetY } = getCoordinates(event);
      context.lineTo(offsetX, offsetY);
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.stroke();
    }
  }, [isDrawing, color, lineWidth, getContext]);

  const stopDrawing = useCallback(() => {
    const context = getContext();
    if (context) {
      context.closePath();
      setIsDrawing(false);
      if (onCanvasChange && canvasRef.current) {
        onCanvasChange(canvasRef.current.toDataURL('image/png'));
      }
    }
  }, [getContext, onCanvasChange]);

  const getCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in event) { // Touch event
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top
      };
    }
    // Mouse event
    return {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
  };

  const handleClearCanvas = () => {
    const context = getContext();
    if (context) {
      context.clearRect(0, 0, width, height);
      initializeCanvas(); // Re-initialize with white background
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-center p-2 bg-muted rounded-lg shadow">
        <div className="flex items-center gap-2">
          <Label htmlFor="color-picker" className="flex items-center gap-1">
            <Palette size={20} className="text-primary" /> Color:
          </Label>
          <Input
            id="color-picker"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-14 h-10 p-1 rounded-md"
            aria-label="Select drawing color"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="line-width" className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil-line text-primary"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="m15 5 3 3"/></svg>
            Size:
          </Label>
          <Input
            id="line-width"
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-24 accent-primary"
            aria-label="Select line width"
          />
          <span className="text-sm w-6 text-center">{lineWidth}</span>
        </div>
        <Button variant="outline" onClick={handleClearCanvas} className="gap-2">
          <Eraser size={18} /> Clear
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="border border-primary rounded-lg shadow-md bg-white cursor-crosshair touch-none"
        aria-label="Doodle canvas"
      />
    </div>
  );
}
