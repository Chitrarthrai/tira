import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { useDrag } from 'react-dnd';
import { useDrop } from 'react-dnd';
import ShelfWithDragDrop from './Drag';

// Header component outside of Canvas
const Header: React.FC<{ onSelectShelf: (url: string) => void }> = ({ onSelectShelf }) => {
  const shelves = [
    { id: 2, url: 'https://storage.googleapis.com/3dmodelhost/Shelves/SHELF_2.glb', preview: '/preview/p1.png' },
    { id: 3, url: 'https://storage.googleapis.com/3dmodelhost/Shelves/SHELF_3.glb', preview: '/preview/p2.png' },
    { id: 4, url: 'https://storage.googleapis.com/3dmodelhost/Shelves/SHELF_4.glb', preview: '/preview/p3.png' },
    { id: 5, url: 'https://storage.googleapis.com/3dmodelhost/Shelves/SHELF_5.glb', preview: '/preview/p4.png' },
  ];

  return (
    <div className="absolute top-0 left-0 right-0 py-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg z-50 flex gap-6 justify-center items-center rounded-b-2xl">
      {shelves.map(shelf => (
        <DraggableShelf key={shelf.id} shelf={shelf} onSelectShelf={onSelectShelf} />
      ))}
    </div>
  );
};

// Draggable Shelf Component
const DraggableShelf: React.FC<{ shelf: { id: number, url: string, preview: string }, onSelectShelf: (url: string) => void }> = ({ shelf }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'shelf',
    item: { url: shelf.url },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`cursor-pointer text-center flex flex-col items-center space-y-2 p-3 w-24 rounded-xl border border-gray-600 bg-gray-700 shadow-md transition-all duration-300 
      ${isDragging ? 'opacity-50' : 'opacity-100'} 
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

export const Scene: React.FC = () => {
  const [selectedShelfUrl, setSelectedShelfUrl] = useState<string | null>(null);

  const [, drop] = useDrop(() => ({
    accept: 'shelf',
    drop: (item: { url: string }) => setSelectedShelfUrl(item.url),
  }));

  return (
    <div className="w-full h-screen relative bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" ref={drop}>
      <Header onSelectShelf={setSelectedShelfUrl} />
      <Canvas shadows>
        <Suspense fallback={null}>
          <ShelfWithDragDrop selectedShelfUrl={selectedShelfUrl} />
        </Suspense>
      </Canvas>
    </div>
  );
};
