'use client';

import { useState } from 'react';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#059669', // Green
  '#d97706', // Orange
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#ea580c', // Orange dark
  '#166534', // Green dark
  '#1e40af', // Blue dark
  '#9333ea', // Purple dark
  '#be185d', // Pink dark
];

export function ColorPicker({ currentColor, onColorChange, label = 'Couleur d\'accent' }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onColorChange(e.target.value);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div className="flex items-center gap-3">
        {/* Couleur actuelle */}
        <div 
          className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
          style={{ backgroundColor: currentColor }}
          onClick={() => setIsOpen(!isOpen)}
        />
        
        {/* Code couleur */}
        <div className="flex-1">
          <input
            type="text"
            value={currentColor}
            onChange={handleCustomColorChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#2563eb"
          />
        </div>
        
        {/* Bouton toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          {isOpen ? 'Fermer' : 'Choisir'}
        </button>
      </div>

      {/* Palette de couleurs */}
      {isOpen && (
        <div className="absolute z-10 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[280px]">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Couleurs prédéfinies</p>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded-md border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Couleur personnalisée</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={currentColor}
                onChange={handleCustomColorChange}
                className="w-12 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={currentColor}
                onChange={handleCustomColorChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#2563eb"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}