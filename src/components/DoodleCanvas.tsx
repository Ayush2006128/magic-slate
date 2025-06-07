
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DoodleCanvasProps {
  color: string;
  lineWidth: number;
  onCanvasChange?: (dataUrl: string) => void;
  getCanvasDataUrl?: (callback: () => string | null) => void;
  clearCanvasSignal?: boolean;
  onClear?: () => void;
}

export function DoodleCanvas({
  color,
  lineWidth,
  onCanvasChange,
  getCanvasDataUrl,
  clearCanvasSignal,
  onClear,
}: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas?.getContext('2d');
  }, []);

  const onCanvasChangeRef = useRef(onCanvasChange);
  useEffect(() => {
    onCanvasChangeRef.current = onCanvasChange;
  }, [onCanvasChange]);

  const stableInitializeCanvas = useCallback(() => {
    const context = getContext();
    if (context && canvasRef.current) {
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (onCanvasChangeRef.current) {
        // Only provide a data URL if the canvas is not essentially blank after init
        const pixelBuffer = new Uint32Array(
          context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data.buffer
        );
        const isEffectivelyBlank = !pixelBuffer.some(pxColor => pxColor !== 0 && pxColor !== 0xffffffff);
        if(!isEffectivelyBlank || canvasRef.current.width === 0 || canvasRef.current.height === 0) { // prevent sending blank image on init unless it was tiny
             // console.log("Canvas initialized, but not sending blank data URL unless forced by 0 dimensions");
        } else {
            // onCanvasChangeRef.current(canvasRef.current.toDataURL('image/png'));
            // Decided against sending image on init/resize as it's usually blank.
        }
      }
    }
  }, [getContext]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver(() => {
      if (canvasRef.current && parent) {
        const newWidth = parent.clientWidth;
        const newHeight = parent.clientHeight;
        if (canvasRef.current.width !== newWidth || canvasRef.current.height !== newHeight) {
            canvasRef.current.width = newWidth;
            canvasRef.current.height = newHeight;
            stableInitializeCanvas();
        }
      }
    });
    resizeObserver.observe(parent);

    // Initial size set
    const initialWidth = parent.clientWidth;
    const initialHeight = parent.clientHeight;
    if (canvas.width !== initialWidth || canvas.height !== initialHeight) {
        canvas.width = initialWidth;
        canvas.height = initialHeight;
        stableInitializeCanvas();
    }
    
    return () => resizeObserver.disconnect();
  }, [stableInitializeCanvas]);


  useEffect(() => {
    if (getCanvasDataUrl) {
      getCanvasDataUrl(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const context = getContext();
          if(context){
            // Ensure background is white if it's completely transparent or un-drawn
            const pixelBuffer = new Uint32Array(
              context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
            );
            // Check if all pixels are transparent (alpha=0) or white (0xffffffff)
            const isEffectivelyBlank = !pixelBuffer.some(pxColor => (pxColor & 0xff000000) !== 0 && pxColor !== 0xffffffff);
            if(isEffectivelyBlank && (canvas.width > 0 && canvas.height > 0) ) { // Add check for dimensions > 0
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
      stableInitializeCanvas(); // Re-initialize with white background
    }
  }, [getContext, stableInitializeCanvas]);

  useEffect(() => {
    if (clearCanvasSignal) {
      clearInternalCanvas();
      if (onClear) {
        onClear();
      }
    }
  }, [clearCanvasSignal, onClear, clearInternalCanvas]);


  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
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
      if (onCanvasChangeRef.current && canvasRef.current) {
        onCanvasChangeRef.current(canvasRef.current.toDataURL('image/png'));
      }
    }
  }, [getContext]);

  const getCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('clientX' in event) {
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

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      className="w-full h-full bg-white cursor-crosshair touch-none rounded-lg"
      aria-label="Drawing and Equation Canvas"
    />
  );
}
