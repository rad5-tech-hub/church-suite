import React, { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {
  IoGridOutline,
  IoListOutline,
  IoPeopleOutline,
  IoWalletOutline,
  IoCalendarOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import {
  ArrowLeft,
  ArrowRight,
  Chat,
  People,
} from "@mui/icons-material";
import { TbArrowFork, TbArrowBearRight2 } from "react-icons/tb";
import { MdOutlineAccountBalance, MdOutlineHub } from "react-icons/md";
import { FaBoxTissue, FaPeopleCarry } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { LuNotebookPen } from "react-icons/lu";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";
import { CiWallet } from "react-icons/ci";

interface MobileNavProps {
  activeButton: string | null;
  handleButtonClick: (label: string) => void;
}

const buttons = [
  "Dashboard",
  "Manage",
  "Membership",
  "Messages",
  "Finance",
  "Programs",
  "Settings",
];

const buttonIcons: { [key: string]: React.ReactNode } = {
  Dashboard: <IoGridOutline className="text-2xl" />,
  Manage: <IoListOutline className="text-2xl" />,
  Membership: <IoPeopleOutline className="text-2xl" />,
  Messages: <Chat className="text-2xl" />,
  Finance: <IoWalletOutline className="text-2xl" />,
  Programs: <IoCalendarOutline className="text-2xl" />,
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
  { to: "/members/view-followup", icon: <FaPeopleGroup className="text-2xl" />, label: "Newcomers" },
  { to: "/members/view-forms", icon: <LuNotebookPen className="text-2xl" />, label: "Forms" },
];

const finance = [
  { to: "/finance/collections", icon: <FaBoxTissue className="text-2xl" />, label: "Collections" },
  { to: "/finance/wallets", icon: <CiWallet className="text-2xl" />, label: "Wallets" },
  { to: "/finance/accounts", icon: <MdOutlineAccountBalance className="text-2xl" />, label: "Account" },
];

const MobileNav: React.FC<MobileNavProps> = ({ activeButton, handleButtonClick }) => {
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const [clickedSubmenu, setClickedSubmenu] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check scroll position to toggle arrows
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
      currentRef.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);
      checkScrollPosition();
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", checkScrollPosition);
      }
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, []);

  const handleSubmenuClick = (label: string) => {
    setClickedSubmenu(clickedSubmenu === label ? null : label);
  };

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  // Check if a route is active
  const isRouteActive = (route: string) => {
    return location.pathname === route;
  };

  // Filtered menu items based on role
  let filteredManage = manage;
  let filteredMembers = member;

  if (authData?.isSuperAdmin === false || authData?.role !== "branch") {
    const restrictedRoutes = ["/manage/view-branches", "/manage/view-admins"];
    filteredManage = filteredManage.filter((item) => !restrictedRoutes.includes(item.to));
  }

  if (authData?.isSuperAdmin === false || authData?.role !== "branch") {
    const restrictedRoutes = ["/members/view-forms"];
    filteredMembers = filteredMembers.filter((item) => !restrictedRoutes.includes(item.to));
  }

  if (authData?.role === "unit") {
    filteredManage = filteredManage.filter((item) => item.to !== "/manage/view-departments");
  }

  const renderSubmenu = (label: string) => {
    if (clickedSubmenu !== label) return null;
    const items = label === "Manage" ? filteredManage : label === "Membership" ? filteredMembers : finance;

    return (
      <Box
        sx={{
          position: "fixed",
          bottom: "70px",
          left: 0,
          right: 0,
          backgroundColor: "#2C2C2C",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          padding: "8px",
          zIndex: 1200,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
          margin: "0 16px",
        }}
      >
        {items.map((item) => {
          const isActive = isRouteActive(item.to);
          return (
            <Button
              key={item.label}
              onClick={() => {
                navigate(item.to);
                setClickedSubmenu(null);
              }}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                color: isActive ? "#160F38" : "#F6F4FE",
                backgroundColor: isActive ? "#F6F4FE" : "transparent",
                textTransform: "none",
                fontSize: "0.75rem",
                fontWeight: "600",
                borderRadius: "8px",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "#F6F4FE",
                  color: "#160F38",
                },
              }}
            >
              {item.icon}
              <span style={{ marginTop: "4px" }}>{item.label}</span>
            </Button>
          );
        })}
      </Box>
    );
  };

  return (
    <>
      {/* Overlay when submenu is open */}
      {clickedSubmenu && (
        <Box
          onClick={() => setClickedSubmenu(null)}
          sx={{
            position: "fixed",
            bottom: "70px",
            left: 0,
            right: 0,
            top: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 1000,
          }}
        />
      )}

      {renderSubmenu("Manage")}
      {renderSubmenu("Membership")}
      {renderSubmenu("Finance")}

      {/* Main scrollable bottom navigation */}
      <Box
        ref={scrollRef}
        sx={{
          display: { xs: "flex", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          backgroundColor: "#2C2C2C",
          borderTop: "1px solid #363740",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
          padding: "8px 0",
          boxShadow: "0 -2px 4px rgba(0,0,0,0.1)",
          zIndex: 1200,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {/* Left scroll arrow */}
        {showLeftArrow && (
          <Box
            sx={{
              position: "sticky",
              left: 0,
              background: "linear-gradient(to right, #2C2C2C 60%, transparent)",
              px: 1,
              display: "flex",
              alignItems: "center",
              zIndex: 1100,
            }}
          >
            <ArrowLeft
              sx={{ color: "#777280", cursor: "pointer", fontSize: "1.8rem" }}
              onClick={handleScrollLeft}
            />
          </Box>
        )}

        {/* Nav buttons */}
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "space-evenly",
            alignItems: "center",
            width: "100%",
            minWidth: "max-content",
          }}
        >
          {buttons.map((label) => (
            <Button
              key={label}
              onClick={() => {
                if (label === "Manage" || label === "Membership" || label === "Finance") {
                  handleSubmenuClick(label);
                } else {
                  handleButtonClick(label);
                  setClickedSubmenu(null);
                }
              }}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: "1",
                minWidth: "80px",
                px: 1,
                py: 1.5,
                mx: 0.5,
                borderRadius: "8px",
                color: activeButton === label ? "#F6F4FE" : "#777280",
                textTransform: "none",
                fontSize: "0.7rem",
                fontWeight: 600,
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "#F6F4FE",
                },
              }}
            >
              {buttonIcons[label]}
              <span style={{ marginTop: "2px" }}>{label}</span>
            </Button>
          ))}
        </Box>

        {/* Right scroll arrow */}
        {showRightArrow && (
          <Box
            sx={{
              position: "sticky",
              right: 0,
              background: "linear-gradient(to left, #2C2C2C 60%, transparent)",
              px: 1,
              display: "flex",
              alignItems: "center",
              zIndex: 1100,
            }}
          >
            <ArrowRight
              sx={{ color: "#777280", cursor: "pointer", fontSize: "1.8rem" }}
              onClick={handleScrollRight}
            />
          </Box>
        )}
      </Box>
    </>
  );
};

export default MobileNav;