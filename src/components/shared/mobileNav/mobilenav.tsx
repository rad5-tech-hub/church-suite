import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {
  IoGridOutline,
  IoListOutline,
  IoPeopleOutline,
  IoPersonAddOutline,
  IoWalletOutline,
  IoCalendarOutline,
  IoSettingsOutline,
} from 'react-icons/io5';
import { ArrowLeft, ArrowRight, People } from '@mui/icons-material';
import { TbArrowFork, TbArrowBearRight2 } from "react-icons/tb";
import { MdOutlineHub } from "react-icons/md";
import { FaPeopleCarry } from "react-icons/fa";
import { IoIosPeople } from "react-icons/io";
import { FaPeopleGroup } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';

interface MobileNavProps {
  activeButton: string;
  handleButtonClick: (label: string) => void;
}

const buttons = [
  'Dashboard',
  'Manage',
  'Members',
  'Newcomers',
  'Finance',
  'Program',
  'Settings',
];

const buttonIcons: { [key: string]: React.ReactNode } = {
  Dashboard: <IoGridOutline className="text-2xl" />,
  Manage: <IoListOutline className="text-2xl" />,
  Members: <IoPeopleOutline className="text-2xl" />,
  Newcomers: <IoPersonAddOutline className="text-2xl" />,
  Finance: <IoWalletOutline className="text-2xl" />,
  Program: <IoCalendarOutline className="text-2xl" />,
  Settings: <IoSettingsOutline className="text-2xl" />,
};

const manage = [
  { to: "/manage/view-admins", icon: <People className="text-2xl" />, label: "Admins" },
  { to: "/manage/view-branches", icon: <TbArrowFork className="text-2xl" />, label: "Branches" },
  { to: "/manage/view-departments", icon: <TbArrowBearRight2 className="text-2xl" />, label: "Departments" },
  { to: "/manage/view-units", icon: <MdOutlineHub className="text-2xl" />, label: "Units" },
];

const member = [
  { to: "/members/view-workers", icon: <FaPeopleCarry className="text-2xl" />, label: "Workers" },
  { to: "/members/view-members", icon: <IoIosPeople className="text-2xl" />, label: "Members" },
  { to: "/members/view-followup", icon: <FaPeopleGroup className="text-2xl" />, label: "Newcomers" },
];

const MobileNav: React.FC<MobileNavProps> = ({ activeButton, handleButtonClick }) => {
  const [clickedSubmenu, setClickedSubmenu] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const navigate = useNavigate();

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      // Initial check
      checkScrollPosition();
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', checkScrollPosition);
      }
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, []);

  const handleSubmenuClick = (label: string) => {
    setClickedSubmenu(clickedSubmenu === label ? null : label);
  };

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -200,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 200,
        behavior: 'smooth',
      });
    }
  };

  const renderSubmenu = (label: string) => {
    if (clickedSubmenu !== label) return null;

    const items = label === 'Manage' ? manage : member;

    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: '70px',
          left: '0',
          right: '0',
          backgroundColor: '#2C2C2C',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          padding: '8px',
          zIndex: 1200,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          margin: '0 16px',
        }}
        role="menu"
        aria-label={`${label} submenu`}
      >
        {items.map((item) => (
          <Button
            key={item.label}
            onClick={() => {

              navigate(item.to);
            }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              color: '#F6F4FE',
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: '600',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#F6F4FE',
                color: '#160F38',
              },
            }}
            role="menuitem"
            aria-label={item.label}
          >
            {item.icon}
            <span style={{ marginTop: '4px' }}>{item.label}</span>
          </Button>
        ))}
      </Box>
    );
  };

  return (
    <>
      {/* Submenu overlay if open */}
      {clickedSubmenu && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: '70px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1199,
          }}
          onClick={() => setClickedSubmenu(null)}
        />
      )}
      
      {/* Submenu content */}
      {renderSubmenu('Manage')}
      {renderSubmenu('Members')}
      
      {/* Main navigation */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#2C2C2C',
          borderTop: '1px solid #363740',
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          padding: '8px 0',
          boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
          zIndex: 1200,
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
        }}
        ref={scrollRef}
      >
        {/* Left scroll arrow */}
        {showLeftArrow && (
          <Box
            sx={{
              position: 'sticky',
              left: 0,
              background: 'linear-gradient(to right, #2C2C2C 60%, transparent)',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              zIndex: 1100,
            }}
          >
            <ArrowLeft
              className="text-2xl"
              style={{ color: '#777280', cursor: 'pointer' }}
              onClick={handleScrollLeft}
              role="button"
              aria-label="Scroll left"
            />
          </Box>
        )}

        {buttons.map((label) => (
          <Box
            key={label}
            sx={{ position: 'relative', display: 'inline-flex' }}
          >
            <Button
              onClick={() => {
                if (label === 'Manage' || label === 'Members') {
                  handleSubmenuClick(label);
                } else {
                  handleButtonClick(label);
                  setClickedSubmenu(null);
                }
              }}
              sx={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '80px',
                width: '80px',
                padding: '8px',
                margin: '0 4px',
                borderRadius: '16px',
                color: activeButton === label ? '#F6F4FE' : '#777280',
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#F6F4FE',
                  color: '#160F38',
                },
              }}
              aria-label={label}
            >
              {buttonIcons[label]}
              <span>{label}</span>
            </Button>
          </Box>
        ))}

        {/* Right scroll arrow */}
        {showRightArrow && (
          <Box
            sx={{
              position: 'sticky',
              right: 0,
              background: 'linear-gradient(to left, #2C2C2C 60%, transparent)',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              zIndex: 1100,
            }}
          >
            <ArrowRight
              className="text-2xl"
              style={{ color: '#777280', cursor: 'pointer' }}
              onClick={handleScrollRight}
              role="button"
              aria-label="Scroll right"
            />
          </Box>
        )}
      </Box>
    </>
  );
};

export default MobileNav;