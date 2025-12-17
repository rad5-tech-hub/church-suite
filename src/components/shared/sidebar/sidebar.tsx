import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";

import { People } from "@mui/icons-material";
import { TbArrowFork, TbArrowBearRight2 } from "react-icons/tb";
import { LuNotebookPen } from "react-icons/lu";
import { MdOutlineHub } from "react-icons/md";
import { FaPeopleCarry, FaSms } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { FaBoxTissue } from "react-icons/fa";
import { CiWallet } from "react-icons/ci";
import { MdOutlineAccountBalance } from "react-icons/md";
import { IoIosPeople } from "react-icons/io";
import { PiRankingFill } from "react-icons/pi";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const permissions = authData?.permission || [];

  const checkRoute = (route: string) => location.pathname.startsWith(route);

  const manage = [
    { to: "/manage/view-branches", icon: <TbArrowFork className="text-2xl" />, label: "Branches", permissionGroup: "Branch" },
    { to: "/manage/view-departments", icon: <TbArrowBearRight2 className="text-2xl" />, label: "Departments", permissionGroup: "Department" },
    { to: "/manage/view-units", icon: <MdOutlineHub className="text-2xl" />, label: "Units", permissionGroup: "Unit" },
    // HIDDEN unless super admin
    ...(authData?.isSuperAdmin ? [
      { to: "/manage/view-roles", icon: <PiRankingFill className="text-2xl" />, label: "Roles", permissionGroup: "Admin" },
    ] : []),
    { to: "/manage/view-admins", icon: <People className="text-2xl" />, label: "Admins", permissionGroup: "Admin" },

  ];

  const member = [
    { to: "/members/view-workers", icon: <FaPeopleCarry className="text-2xl" />, label: "Workers", permissionGroup: "Workers" },
    { to: "/members/view-members", icon: <IoIosPeople className="text-2xl" />, label: "Members", permissionGroup: "Members" },
    { to: "/members/view-followup", icon: <FaPeopleGroup className="text-2xl" />, label: "Newcomers", permissionGroup: "FollowUp" },
    { to: "/members/view-forms", icon: <LuNotebookPen className="text-2xl" />, label: "Forms", permissionGroup: "FollowUp" },
  ];

  const message = [
    { to: "/messages/sms", icon: <FaSms className="text-2xl" />, label: "SMS", permissionGroup: "Messaging" },
    { to: "/messages/wallets", icon: <CiWallet className="text-2xl" />, label: "Wallet", permissionGroup: "Wallet" },
  ];

  const finance = [
    { to: "/finance/collections", icon: <FaBoxTissue className="text-2xl" />, label: "Collections", permissionGroup: "Collection" },
    { to: "/finance/accounts", icon: <MdOutlineAccountBalance className="text-2xl" />, label: "Account", permissionGroup: "Finance" },
  ];

  const filterByPermission = (items: any[]) =>
    permissions.length ? items.filter((i) => permissions.includes(i.permissionGroup)) : items;

  const groupedMenus: Record<string, any[]> = {
    "/manage": filterByPermission(manage),
    "/members": filterByPermission(member),
    "/messages": filterByPermission(message),
    "/finance": filterByPermission(finance),
  };

  const routeKey = Object.keys(groupedMenus).find((route) => checkRoute(route));
  const currentItems = routeKey ? groupedMenus[routeKey] : [];

  return (
    <div   className="sidebar-scroll min-w-[78px] flex-shrink-0 h-full bg-[var(--color-primary)] text-[var(--color-text-on-primary)] flex flex-col"
      style={{
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(0,0,0,0.15) transparent",
      }}
    >
      <nav className="flex-1 flex flex-col items-center mt-10">
        <ul className="space-y-8">
          {currentItems.map((item: any) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `block py-4 px-3 rounded-full text-center transition-all ${
                    isActive
                      ? "bg-[#F6F4FE] text-[#160F38]"
                      : "bg-[#4d4d4e8e] text-[var(--color-text-on-primary)]"
                  }`
                }
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  {item.icon}
                  <p className="text-[10px] font-medium">{item.label}</p>
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
