import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { LuLayoutDashboard } from "react-icons/lu";
import DashboardManager from "../../shared/dashboardManager";

// Utility functions for color calculations
const isDarkColor = (color: string): boolean => {
  // Extract RGB values from the color
  const rgb = color.match(/\d+/g)?.map(Number);
  if (!rgb || rgb.length < 3) return false;

  // Calculate brightness using the formula: (R*299 + G*587 + B*114) / 1000
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  return brightness < 128; // Return true if brightness is less than 128 (dark color)
};

const calculateContrastColor = (color: string) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

const adjustColor = (color: string, amount: number) => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Adjust brightness (lighter or darker based on amount)
  const adjust = (value: number) => {
    const newValue = amount > 0 
      ? Math.min(255, value + (255 - value) * amount)
      : Math.max(0, value + value * amount);
    return Math.round(newValue);
  };

  // Convert back to hex
  return `#${[r, g, b].map(adjust).map(v => v.toString(16).padStart(2, '0')).join('')}`;
};

const ChangeColorButton: React.FC = () => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#111827");
  const [textColor, setTextColor] = useState("#f0f0f0");

  useEffect(() => {
    // Set initial colors
    const contrastColor = calculateContrastColor(primaryColor);
    setTextColor(contrastColor);
    
    // Set CSS variables
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--color-text-on-primary', contrastColor);
  }, [primaryColor]);

  const handlePrimaryColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrimaryColor(e.target.value);
  };

  return (
    <DashboardManager>
      <div className="flex flex-col gap-4 p-4">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="primary-button"
          style={{
            backgroundColor: primaryColor,
            color: textColor,
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          {showColorPicker ? "Hide Color Picker" : "Change Primary Color"}
        </button>

        {/* Example NavLink using color-mix for dynamic hover/active states */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => {
            const activeBgColor = isDarkColor(primaryColor)
              ? "bg-[color-mix(in_srgb,_var(--color-primary),_white_20%)]"
              : "bg-[color-mix(in_srgb,_var(--color-primary),_black_20%)]";

            const hoverBgColor = isDarkColor(primaryColor)
              ? "hover:bg-[color-mix(in_srgb,_var(--color-primary),_white_10%)]"
              : "hover:bg-[color-mix(in_srgb,_var(--color-primary),_black_10%)]";

            return `flex items-center gap-3 font-semibold px-4 py-2 rounded-md transition-colors ${
              isActive ? `active ${activeBgColor}` : hoverBgColor
            }`;
          }}
          style={{
            color: textColor,
          }}
        >
          <LuLayoutDashboard className="text-2xl" />
          Dashboard
        </NavLink>

        {showColorPicker && (
          <div className="flex flex-col gap-4 p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-4">
              <label htmlFor="primary-color" className="font-medium">
                Primary Color:
              </label>
              <input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={handlePrimaryColorChange}
                className="w-12 h-12 cursor-pointer"
              />
              <span className="text-gray-700">{primaryColor}</span>
            </div>
            
            {/* Color previews */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-2 rounded-md" style={{
                backgroundColor: primaryColor,
                color: textColor,
              }}>
                Normal
              </div>
              <div className="p-2 rounded-md" style={{
                backgroundColor: `color-mix(in srgb, ${primaryColor}, ${isDarkColor(primaryColor) ? 'white 10%' : 'black 10%'})`,
                color: calculateContrastColor(adjustColor(primaryColor, isDarkColor(primaryColor) ? 0.1 : -0.1)),
              }}>
                Hover
              </div>
              <div className="p-2 rounded-md" style={{
                backgroundColor: `color-mix(in srgb, ${primaryColor}, ${isDarkColor(primaryColor) ? 'white 20%' : 'black 20%'})`,
                color: calculateContrastColor(adjustColor(primaryColor, isDarkColor(primaryColor) ? 0.2 : -0.2)),
              }}>
                Active
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardManager>
  );
};

export default ChangeColorButton;