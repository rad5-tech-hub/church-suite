import React, { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { VscReport } from "react-icons/vsc";
import {
  IoGridOutline,
  IoListOutline,
  IoPeopleOutline,
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
import { FaBoxTissue, FaPeopleCarry, FaSms } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { LuNotebookPen } from "react-icons/lu";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";
import { CiWallet } from "react-icons/ci";
import { IoIosPeople } from "react-icons/io";
import { PiRankingFill } from "react-icons/pi";

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
  "Reports",
  "Settings",
];

const buttonIcons: { [key: string]: React.ReactNode } = {
  Dashboard: <IoGridOutline className="text-2xl" />,
  Manage: <IoListOutline className="text-2xl" />,
  Membership: <IoPeopleOutline className="text-2xl" />,
  Messages: <Chat className="text-2xl" />,
  Finance: <MdOutlineAccountBalance className="text-2xl" />,
  Programs: <IoCalendarOutline className="text-2xl" />,
  Reports: <VscReport className="text-2xl" />,
  Settings: <IoSettingsOutline className="text-2xl" />,
};

const manage = [
  { to: "/manage/view-branches", icon: <TbArrowFork className="text-2xl" />, label: "Branches", permissionGroup: 'Branch' },
  { to: "/manage/view-departments", icon: <TbArrowBearRight2 className="text-2xl" />, label: "Departments", permissionGroup: 'Department' },
  { to: "/manage/view-units", icon: <MdOutlineHub className="text-2xl" />, label: "Units", permissionGroup: "Unit" },
  { to: "/manage/view-roles", icon: <PiRankingFill className="text-2xl" />, label: "Roles", permissionGroup: "Admin" },
  { to: "/manage/view-admins", icon: <People className="text-2xl" />, label: "Admins", permissionGroup: "Admin" },
];

const member = [
  { to: "/members/view-workers", icon: <FaPeopleCarry className="text-2xl" />, label: "Workers", permissionGroup: "Workers" },
  { to: "/members/view-members", icon: <IoIosPeople className="text-2xl" />, label: "Member", permissionGroup: 'Members' },
  { to: "/members/view-followup", icon: <FaPeopleGroup className="text-2xl" />, label: "Newcomers", permissionGroup: 'FollowUp' },
  { to: "/members/view-forms", icon: <LuNotebookPen className="text-2xl" />, label: "Forms", permissionGroup: 'FollowUp' },
];

const message = [
  { to: "/messages/sms", icon: <FaSms className="text-2xl" />, label: "SMS", permissionGroup: 'Messaging' },
  { to: "/messages/wallets", icon: <CiWallet className="text-2xl" />, label: "SMS Wallets", permissionGroup: 'Wallet' },
];

const finance = [
  { to: "/finance/collections", icon: <FaBoxTissue className="text-2xl" />, label: "Collections", permissionGroup: 'Collection' },
  { to: "/finance/accounts", icon: <MdOutlineAccountBalance className="text-2xl" />, label: "Account", permissionGroup: 'Finance' },
];

const MobileNav: React.FC<MobileNavProps> = ({ activeButton, handleButtonClick }) => {
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const [clickedSubmenu, setClickedSubmenu] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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
      if (currentRef) currentRef.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, []);

  const handleSubmenuClick = (label: string) => {
    setClickedSubmenu(clickedSubmenu === label ? null : label);
  };

  const handleScrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
  };

  const handleScrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
  };

  const isRouteActive = (route: string) => location.pathname === route;

  const permissions = authData?.permission || [];

  const filterByPermission = (items: typeof manage) => {
    if (!permissions.length) return items;
    return items.filter((item) => permissions.includes(item.permissionGroup));
  };

  const filteredManage = filterByPermission(manage);
  const filteredMembers = filterByPermission(member);
  const filteredMessages = filterByPermission(message);
  const filteredFinance = filterByPermission(finance);

  const visibleButtons = buttons.filter((label) => {
    switch (label) {
      case "Manage": return filteredManage.length > 0;
      case "Membership": return filteredMembers.length > 0;
      case "Messages": return filteredMessages.length > 0;
      case "Finance": return filteredFinance.length > 0;
      case "Programs":
        if (!permissions.length) return true;
        return permissions.some((perm: string) => perm === "Attendance" || perm === "FollowUp");
      case "Reports":
        if (!permissions.length) return true;
        return permissions.includes("Reports");
      default: return true;
    }
  });

  const renderSubmenu = (label: string) => {
    if (clickedSubmenu !== label) return null;

    let items: { label: string; to?: string; icon?: React.ReactNode }[] = [];
    let emptyMessage = "";

    switch (label) {
      case "Manage": items = filteredManage; emptyMessage = "No manage items available"; break;
      case "Membership": items = filteredMembers; emptyMessage = "No members available"; break;
      case "Finance": items = filteredFinance; emptyMessage = "No finance items available"; break;
      case "Messages": items = filteredMessages; emptyMessage = "No messages available"; break;
      default: items = []; emptyMessage = "No items available";
    }

    return (
      <Box
        sx={{
          position: "fixed",
          bottom: "70px",
          left: 0,
          right: 0,
          backgroundColor: "var(--color-primary)",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          padding: "12px",
          zIndex: 1200,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
          margin: "0 16px",
          mb: 2,
          border: "1px solid var(--color-border-glass)",
        }}
      >
        {items.length > 0 ? (
          items.map((item) => {
            const isActive = isRouteActive(item.to || "");
            return (
              <Button
                key={item.label}
                onClick={() => {
                  if (item.to) navigate(item.to);
                  setClickedSubmenu(null);
                }}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 8px",
                  color: isActive ? "var(--color-primary)" : "var(--color-text-primary)",
                  backgroundColor: isActive ? "var(--color-text-primary)" : "transparent",
                  textTransform: "none",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                   borderRadius: "9999px",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    backgroundColor: "var(--color-surface-glass)",
                    color: "var(--color-text-primary)",
                  },
                }}
              >
                {item.icon}
                <span style={{ marginTop: "6px" }}>{item.label}</span>
              </Button>
            );
          })
        ) : (
          <Box sx={{ gridColumn: "span 2", textAlign: "center", color: "var(--color-text-muted)", py: 3 }}>
            {emptyMessage}
          </Box>
        )}
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
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            zIndex: 1100,
          }}
        />
      )}

      {renderSubmenu("Manage")}
      {renderSubmenu("Messages")}
      {renderSubmenu("Membership")}
      {renderSubmenu("Finance")}

      {/* Main bottom navigation bar */}
      <Box
        ref={scrollRef}
        sx={{
          display: { xs: "flex", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          backgroundColor: "var(--color-primary)",
          borderTop: "1px solid var(--color-border-subtle)",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
          padding: "8px 0",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
          zIndex: 1200,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {/* Left arrow */}
        {showLeftArrow && (
          <Box
            sx={{
              position: "sticky",
              left: 0,
              background: `linear-gradient(to right, var(--color-primary) 60%, transparent)`,
              px: 1.5,
              display: "flex",
              alignItems: "center",
              zIndex: 1100,
            }}
          >
            <ArrowLeft
              sx={{
                color: "var(--color-text-muted)",
                cursor: "pointer",
                fontSize: "2rem",
                "&:hover": { color: "var(--color-text-primary)" },
              }}
              onClick={handleScrollLeft}
            />
          </Box>
        )}

        {/* Buttons container */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-evenly",
            alignItems: "center",
            width: "100%",
            minWidth: "max-content",
          }}
        >
          {visibleButtons.map((label) => (
            <Button
              key={label}
              onClick={() => {
                if (["Manage", "Membership", "Finance", "Messages"].includes(label)) {
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
                flex: "1 1 auto",
                minWidth: "76px",
                maxWidth: "90px",
                px: 1,
                py: 1.2,
                mx: 0.5,
                borderRadius: "12px",
                color: activeButton === label ? "var(--color-primary)" : "var(--color-text-muted)",
                backgroundColor: activeButton === label ? "var(--color-text-primary)" : "transparent",
                textTransform: "none",
                fontSize: "0.72rem",
                fontWeight: activeButton === label ? 700 : 500,
                transition: "all 0.25s ease",
                "&:hover": {
                  backgroundColor: "var(--color-surface-glass)",
                  color: "var(--color-text-primary)",
                },
              }}
            >
              {buttonIcons[label]}
              <span style={{ marginTop: "4px" }}>{label}</span>
            </Button>
          ))}
        </Box>

        {/* Right arrow */}
        {showRightArrow && (
          <Box
            sx={{
              position: "sticky",
              right: 0,
              background: `linear-gradient(to left, var(--color-primary) 60%, transparent)`,
              px: 1.5,
              display: "flex",
              alignItems: "center",
              zIndex: 1100,
            }}
          >
            <ArrowRight
              sx={{
                color: "var(--color-text-muted)",
                cursor: "pointer",
                fontSize: "2rem",
                "&:hover": { color: "var(--color-text-primary)" },
              }}
              onClick={handleScrollRight}
            />
          </Box>
        )}
      </Box>
    </>
  );
};

export default MobileNav;