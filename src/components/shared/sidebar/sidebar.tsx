import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { People } from "@mui/icons-material";
import { TbArrowFork, TbArrowBearRight2 } from "react-icons/tb";
import { LuNotebookPen } from "react-icons/lu";
import { MdOutlineHub } from "react-icons/md";
import { FaPeopleCarry, FaSms } from "react-icons/fa";
// import { IoIosPeople } from "react-icons/io";
import { FaPeopleGroup } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";
import { FaBoxTissue } from "react-icons/fa";
import { CiWallet } from "react-icons/ci";
import { MdOutlineAccountBalance } from "react-icons/md";
import { IoIosPeople } from "react-icons/io";
import { PiRankingFill } from "react-icons/pi";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const isManageRoute = location.pathname.startsWith("/manage");
  const isMemberRoute = location.pathname.startsWith("/members");
  const isMessageRoute = location.pathname.startsWith("/messages");
  const isFinanceRoute = location.pathname.startsWith("/finance");
  const authData = useSelector((state: RootState) => state?.auth?.authData);

  const manage = [
    { to: "/manage/view-branches", icon: <TbArrowFork className="text-2xl" />, label: "Branches", permissionGroup:'Branch' },
    { to: "/manage/view-departments", icon: <TbArrowBearRight2 className="text-2xl" />, label: "Departments", permissionGroup:'Department' },
    { to: "/manage/view-units", icon: <MdOutlineHub className="text-2xl" />, label: "Units", permissionGroup: "Unit"},
    { to: "/manage/view-roles", icon: <PiRankingFill className="text-2xl" />, label: "Roles", permissionGroup: "Admin"},
    { to: "/manage/view-admins", icon: <People className="text-2xl" />, label: "Admins", permissionGroup: "Admin"},
  ];

  const member = [
    { to: "/members/view-workers", icon: <FaPeopleCarry className="text-2xl" />, label: "Workers", permissionGroup: "Workers"},
    { to: "/members/view-members", icon: <IoIosPeople className="text-2xl" />, label: "Member", permissionGroup:'Members'},
    { to: "/members/view-followup", icon: <FaPeopleGroup className="text-2xl" />, label: "Newcomers", permissionGroup: 'FollowUp' },
    { to: "/members/view-forms", icon: <LuNotebookPen className="text-2xl" />, label: "Forms", permissionGroup: 'FollowUp' },
  ];

  const message = [
    { to: "/messages/sms", icon: <FaSms className="text-2xl" />, label: "SMS", permissionGroup: 'Messaging'},
    { to: "/messages/wallets", icon: <CiWallet className="text-2xl" />, label: "SMS Wallets", permissionGroup: 'Wallet' },
  ];

  const finance = [
    { to: "/finance/collections", icon: <FaBoxTissue className="text-2xl" />, label: "Collections", permissionGroup: 'Collection' }, 
    { to: "/finance/accounts", icon: <MdOutlineAccountBalance className="text-2xl" />, label: "Account", permissionGroup: 'Finance' },
  ];


  const permissions = authData?.permission || [];

  const filterByPermission = (items: typeof manage) => {
    if (!permissions.length) return items; // Show all if no permissions
    return items.filter((item) => permissions.includes(item.permissionGroup));
  };

  const filteredManage = filterByPermission(manage);
  const filteredMembers = filterByPermission(member);
  const filteredMessages = filterByPermission(message);
  const filteredFinance = filterByPermission(finance);

  return (
    <div className={`flex-shrink-0 h-screen ${isManageRoute || isMemberRoute || isFinanceRoute || isMessageRoute ? 'w-23' : ''}    bg-[var(--color-primary)] text-[var(--color-text-on-primary)] flex flex-col z-40`}>
      <nav className="flex-1 flex flex-col items-center mt-12">
        {isManageRoute && (
          <ul className="space-y-8">
            {filteredManage.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block py-4 px-3 rounded-full text-center ${
                      isActive ? "bg-[#F6F4FE] text-[#160F38]" : "bg-[#4d4d4e8e] text-[var(--color-text-on-primary)]"
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
            {filteredMembers.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block px-3 py-4 rounded-full text-center ${
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
        {isMessageRoute && (
          <ul className="space-y-8">
            {filteredMessages.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block px-3 py-4 rounded-full text-center ${
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
        {isFinanceRoute && (
          <ul className="space-y-8">
            {filteredFinance.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block px-3 py-4 rounded-full text-center ${
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