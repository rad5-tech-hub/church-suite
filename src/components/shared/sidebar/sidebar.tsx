import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { People } from "@mui/icons-material";
import { TbArrowFork, TbArrowBearRight2 } from "react-icons/tb";
import { MdOutlineHub } from "react-icons/md";
import { FaPeopleCarry } from "react-icons/fa";
import { IoIosPeople } from "react-icons/io";
import { FaPeopleGroup } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const isManageRoute = location.pathname.startsWith("/manage");
  const isMemberRoute = location.pathname.startsWith("/members");
  const authData = useSelector((state: RootState) => state?.auth?.authData);

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

  // Filter manage items to hide "Branches" if not at headquarters
  const filteredManage = authData?.isHeadQuarter === false
    ? manage.filter((item) => item.to !== "/manage/view-branches")
    : manage;

  return (
    <div className={`flex-shrink-0 h-screen ${isManageRoute || isMemberRoute ? 'w-23' : ''}    bg-[var(--color-primary)] text-[var(--color-text-on-primary)] flex flex-col z-40`}>
      <nav className="flex-1 flex flex-col items-center mt-12">
        {isManageRoute && (
          <ul className="space-y-8">
            {filteredManage.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block py-4 px-2 rounded-full text-center ${
                      isActive ? "bg-[#F6F4FE] text-[#160F38]" : "bg-[#363740] text-[#777280]"
                    }`
                  }
                >
              
                  <div className="flex flex-col items-center justify-center">
                    <div>{item.icon}</div>
                    <p className="text-[10px]">{item.label}</p> {/* Reduced font size */}
                  </div>                
                </NavLink>
              </li>
            ))}
          </ul>
        )}
        {isMemberRoute && (
          <ul className="space-y-8">
            {member.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block px-2 py-4 rounded-full text-center ${
                      isActive ? "bg-[#F6F4FE] text-[#160F38]" : "bg-[#363740] text-[#777280]"
                    }`
                  }
                >                  
                  <div className="flex flex-col items-center justify-center">
                    <div>{item.icon}</div>
                    <p className="text-[10px]">{item.label}</p> {/* Reduced font size */}
                  </div>                
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;