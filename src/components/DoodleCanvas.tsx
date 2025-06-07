
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
  onClear?: () => void; // Callback after canvas is cleared internally
}

export function DoodleCanvas({
  width = 500,
  height = 400,
  onCanvasChange,
  getCanvasDataUrl,
  clearCanvasSignal,
  onClear // Renamed from onCanvasCleared to onClear to match usage
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
    if (context && canvasRef.current) {
      context.fillStyle = '#FFFFFF'; // Set background to white
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (onCanvasChange) {
        onCanvasChange(canvasRef.current.toDataURL('image/png'));
      }
    }
  }, [getContext, onCanvasChange]);
  
  useEffect(() => {
    // Ensure canvas dimensions are set before initializing
    if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        initializeCanvas();
    }
  }, [width, height, initializeCanvas]);


  useEffect(() => {
    if (getCanvasDataUrl) {
      getCanvasDataUrl(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const context = getContext();
          if(context){
            const pixelBuffer = new Uint32Array(
              context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
            );
            const isEffectivelyBlank = !pixelBuffer.some(pxColor => pxColor !== 0 && pxColor !== 0xffffffff); // 0 is transparent, 0xffffffff is white
            if(isEffectivelyBlank) {
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

  const clearInternalCanvas = useCallback(() => {
    const context = getContext();
    if (context && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      initializeCanvas();
    }
  }, [getContext, initializeCanvas]);

  useEffect(() => {
    if (clearCanvasSignal) {
      clearInternalCanvas();
      if (onClear) {
        onClear(); // Signal back that clearing is done
      }
    }
  }, [clearCanvasSignal, onClear, clearInternalCanvas]);


  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault(); // Prevents page scrolling on touch devices
    const context = getContext();
    if (context) {
      const { offsetX, offsetY } = getCoordinates(event);
      context.beginPath();
      context.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    }
  }, [getContext]);

  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
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

  const stopDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
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
    let clientX, clientY;
    if ('touches' in event && event.touches.length > 0) { // Touch event
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('clientX' in event) { // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
        return {offsetX: 0, offsetY: 0};
    }
    
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  // The external clear button is now in MagicCanvasSection, so this internal button can be removed
  // if desired, or kept for finer control within the canvas component itself.
  // For now, let's keep it as it's part of the original DoodleCanvas component.
  // The `handleCanvasClearRequest` in `MagicCanvasSection` will trigger the `clearCanvasSignal`.
  const handleInternalClearButton = () => {
    clearInternalCanvas();
    // If there's an external onClear, it will be called via the signal effect
  };


  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <div className="flex flex-wrap gap-x-4 gap-y-2 items-center justify-center p-2 bg-muted rounded-lg shadow w-full max-w-md">
        <div className="flex items-center gap-2">
          <Label htmlFor="color-picker" className="flex items-center gap-1 cursor-pointer">
            <Palette size={20} className="text-primary" /> Color:
          </Label>
          <Input
            id="color-picker"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-9 p-0.5 rounded-md border-input"
            aria-label="Select drawing color"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="line-width" className="flex items-center gap-1 cursor-pointer">
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
            className="w-20 md:w-24 accent-primary cursor-pointer"
            aria-label="Select line width"
          />
          <span className="text-sm w-5 text-center">{lineWidth}</span>
        </div>
        {/* This button is now redundant if MagicCanvasSection has its own global clear button.
            However, keeping it for now as part of the canvas's own controls.
            The `clearCanvasSignal` prop handles external clearing.
        */}
        <Button variant="outline" size="sm" onClick={handleInternalClearButton} className="gap-1.5 px-3 py-1.5 h-auto text-sm">
          <Eraser size={16} /> Clear Drawing Area
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        // width and height are set in useEffect to ensure canvasRef is current
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="border border-primary rounded-lg shadow-md bg-white cursor-crosshair touch-none max-w-full"
        style={{ width: `${width}px`, height: `${height}px` }}
        aria-label="Drawing and Equation Canvas"
      />
    </div>
  );
}

