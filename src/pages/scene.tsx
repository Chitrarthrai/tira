import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { useDrag, useDrop } from "react-dnd";
import ShelfWithDragDrop from "./Drag";

// Types
interface Shelf {
  id: number;
  url: string;
  preview: string;
}

interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

// Tooltip Component
const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}>
      {children}
      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap">
          {content}
        </div>
      )}
    </div>
  );
};

// Custom Button Component
const Button: React.FC<ButtonProps> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg shadow-lg transition-colors">
    {children}
  </button>
);

// Controls Panel Component
interface ControlsPanelProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  return (
    <div className="absolute bottom-4 right-4 flex gap-2">
      <Tooltip content="Zoom In">
        <Button onClick={onZoomOut}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </Button>
      </Tooltip>
      <Tooltip content="Zoom Out">
        <Button onClick={onZoomIn}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </Button>
      </Tooltip>
      <Tooltip content="Reset View">
        <Button onClick={onResetView}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
          </svg>
        </Button>
      </Tooltip>
    </div>
  );
};


interface DraggableShelfProps {
  shelf: Shelf;
  onSelectShelf: (url: string) => void;
}

// Draggable Shelf Component
const DraggableShelf: React.FC<DraggableShelfProps> = ({
  shelf,
  onSelectShelf,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "shelf",
    item: { url: shelf.url },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  useEffect(() => {
    if (isDragging) {
      onSelectShelf(shelf.url);
    }
  }, [isDragging, shelf.url, onSelectShelf]);

  return (
    <div
    ref={drag}
    className={`cursor-pointer text-center flex flex-col items-center space-y-2 p-3 w-24 rounded-xl border border-gray-600 bg-gray-700 shadow-md transition-all duration-300 
      ${isDragging ? "opacity-50" : "opacity-100"} 
      hover:shadow-2xl hover:scale-105 hover:border-blue-400 hover:bg-gray-600`}
      >
      <img
        src={shelf.preview}
        alt={`Shelf ${shelf.id} Preview`}
        className="w-20 h-20 object-cover rounded-lg"
        />
      <span className="text-sm text-gray-300 font-medium">{`Shelf ${shelf.id}`}</span>
    </div>
  );
};

// Header Component
const Header: React.FC<{ onSelectShelf: (url: string) => void }> = ({
  onSelectShelf,
}) => {
  const shelves: Shelf[] = [
    { id: 2, url: "https://storage.googleapis.com/3dmodelhost/Shelves/SHELF_2.glb", preview: "/preview/p1.png" },
    { id: 3, url: "https://storage.googleapis.com/3dmodelhost/Shelves/SHELF_3.glb", preview: "/preview/p2.png" },
    { id: 4, url: "https://storage.googleapis.com/3dmodelhost/Shelves/SHELF_4.glb", preview: "/preview/p3.png" },
    { id: 5, url: "https://storage.googleapis.com/3dmodelhost/Shelves/SHELF_5.glb", preview: "/preview/p4.png" },
  ];

  return (
    <div className="absolute top-0 left-0 right-0 py-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg z-50 flex gap-6 justify-center items-center rounded-b-2xl">
      {shelves.map((shelf) => (
        <DraggableShelf key={shelf.id} shelf={shelf} onSelectShelf={onSelectShelf} />
      ))}
    </div>
  );
};

// Main Scene Component
const Scene: React.FC = () => {
  const [selectedShelfUrl, setSelectedShelfUrl] = useState<string>("https://storage.googleapis.com/3dmodelhost/Shelves/SHELF_1.glb");
  const [controlsRef, setControlsRef] = useState<any>(null);

  // Effect to update model in real time whenever shelf URL changes
  useEffect(() => {
    if (selectedShelfUrl) {
      console.log("Model URL changed:", selectedShelfUrl);
    }
  }, [selectedShelfUrl]);

  const [, drop] = useDrop(() => ({
    accept: "shelf",
    drop: (item: { url: string }) => {
      setSelectedShelfUrl(item.url);  // Update selected shelf URL in real-time
    },
  }));

  const handleZoomIn = () => {
    if (controlsRef) {
      controlsRef.zoom(1.2);
    }
  };

  const handleZoomOut = () => {
    if (controlsRef) {
      controlsRef.zoom(0.8);
    }
  };

  const handleResetView = () => {
    if (controlsRef) {
      controlsRef.reset();
    }
  };

  return (
    <div className="w-full h-screen relative bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" ref={drop}>
      <Header onSelectShelf={setSelectedShelfUrl} />
      <Canvas shadows>
        <Suspense fallback={null}>
          {/* Ensure ShelfWithDragDrop gets the updated shelf URL */}
          <ShelfWithDragDrop
            selectedShelfUrl={selectedShelfUrl}
            onControlsReady={setControlsRef}
          />
        </Suspense>
      </Canvas>
      <ControlsPanel onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onResetView={handleResetView} />
    </div>
  );
};

export default Scene;