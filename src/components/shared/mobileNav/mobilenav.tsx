import React from 'react';
// import { useNavigate } from 'react-router-dom';
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
import { ArrowRight } from '@mui/icons-material';

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

const MobileNav: React.FC<MobileNavProps> = ({ activeButton, handleButtonClick }) => {
  return (
    <Box
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#4d4d4e8e',
        borderTop: '1px solid #363740',
        overflowX: 'auto',
        overflowY: 'hidden',
        whiteSpace: 'nowrap',
        padding: '8px 4px',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000,
        '&::-webkit-scrollbar': {
          display: 'none', // Hide scrollbar for cleaner look
        },
        scrollbarWidth: 'none', // Firefox
        justifyContent: { xs: 'flex-start', sm: 'center' },
      }}
    >
      {buttons.map((label) => (
        <Button
          key={label}
          onClick={() => handleButtonClick(label)}
          sx={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: { xs: '80px', sm: '90px' },
            width: { xs: '80px', sm: '90px' },
            padding: '8px',
            margin: { xs: '0 4px', sm: '0 8px' },
            borderRadius: '16px',
            // backgroundColor: activeButton === label ? '#F6F4FE' : '#363740',
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
        >
          {buttonIcons[label]}
          <span>{label}</span>
        </Button>
      ))}
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(to left, #4d4d4e8e, transparent)',
          padding: '0 8px',
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <ArrowRight className="text-2xl" style={{ color: '#777280' }} />
      </Box>
    </Box>
  );
};

export default MobileNav;