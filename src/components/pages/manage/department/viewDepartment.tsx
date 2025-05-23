// import React from "react";
// import { useNavigate } from "react-router-dom";
// import DashboardManager from "../../../shared/dashboardManager";
// import {
//   Box,
//   Button,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Typography,
// } from "@mui/material";

// const ViewDepartment: React.FC = () => {
//   const navigate = useNavigate();

//   // Example data for admins
//   const admins = [
//     { id: 1, name: "John Doe", email: "john@example.com", phone: "123-456-7890", isSuperAdmin: true },
//     { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "987-654-3210", isSuperAdmin: false },
//     { id: 3, name: "Michael Brown", email: "michael@example.com", phone: "456-789-1230", isSuperAdmin: false },
//   ];

//   return (
//     <DashboardManager>
//       <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, bgcolor: "#f5f5f5", minHeight: "100%" }}>
//         <Box
//           sx={{
//             display: "flex",
//             flexDirection: { xs: "column", lg: "row" },
//             justifyContent: "space-between",
//             alignItems: { xs: "flex-start", lg: "center" },
//             mb: { xs: 4, sm: 6 },
//             gap: 2,
//           }}
//         >
//           <Box>
//             <Typography
//               variant="h4"
//               sx={{
//                 fontWeight: "bold",
//                 color: "#1f2937",
//                 fontSize: { xs: "1.8rem", sm: "2rem" },
//               }}
//             >
//               All Departments
//             </Typography>
//             <Typography
//               variant="body1"
//               sx={{
//                 mt: 1,
//                 color: "#4b5563",
//                 fontSize: { xs: "1rem", sm: "1rem" },
//               }}
//             >
//               View all Departments.
//             </Typography>
//           </Box>
//           <Button
//             variant="contained"
//             onClick={() => navigate("/manage/department")}
//             sx={{
//               bgcolor: "#1f2937",              
//               px: { xs: 2, sm: 2 },
//               py: 1,
//               borderRadius: 1,
//               fontWeight: "bold",
//               textTransform: "none",
//               fontSize: { xs: "1rem", sm: "1rem" },
//             }}
//           >
//             Create Department
//           </Button>
//         </Box>

//         <TableContainer
//           component={Paper}
//           sx={{
//             boxShadow: 2,
//             borderRadius: 1,
//             overflowX: "auto", // Enable horizontal scrolling on small screens
//             bgcolor: "#f5f5f5",
//           }}
//         >
//           <Table
//             sx={{
//               minWidth: { xs: "auto", sm: 650 }, // Remove minWidth constraint on mobile
//               width: "100%",
//             }}
//           >
//             <TableHead>
//               <TableRow >
//                 <TableCell
//                   sx={{                    
//                     fontWeight: "bold",
//                     fontSize: { xs: "0.75rem", sm: "1rem" },
//                     px: { xs: 2, sm: 4 },
//                     py: 2,
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   Name
//                 </TableCell>
//                 <TableCell
//                   sx={{                    
//                     fontWeight: "bold",
//                     fontSize: { xs: "0.75rem", sm: "1rem" },
//                     px: { xs: 2, sm: 4 },
//                     py: 2,
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   Description
//                 </TableCell>
//                 <TableCell
//                   sx={{                    
//                     fontWeight: "bold",
//                     fontSize: { xs: "0.75rem", sm: "1rem" },
//                     px: { xs: 2, sm: 4 },
//                     py: 2,
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   True
//                 </TableCell>                
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {admins.map((admin) => (
//                 <TableRow
//                   key={admin.id}
//                   sx={{                    
//                     borderBottom: "1px solid #e5e7eb",
//                   }}
//                 >
//                   <TableCell
//                     sx={{
//                       fontSize: { xs: "0.75rem", sm: "1rem" },
//                       px: { xs: 2, sm: 4 },
//                       py: 2,
//                       whiteSpace: "normal",
//                       wordBreak: "break-word",
//                     }}
//                   >
//                     {admin.name}
//                   </TableCell>
//                   <TableCell
//                     sx={{
//                       fontSize: { xs: "0.75rem", sm: "1rem" },
//                       px: { xs: 2, sm: 4 },
//                       py: 2,
//                       whiteSpace: "normal",
//                       wordBreak: "break-word",
//                     }}
//                   >
//                     {admin.email}
//                   </TableCell>                 
//                   <TableCell
//                     sx={{
//                       fontSize: { xs: "0.75rem", sm: "1rem" },
//                       px: { xs: 2, sm: 4 },
//                       py: 2,
//                       whiteSpace: "normal",
//                       wordBreak: "break-word",
//                     }}
//                   >
//                     {admin.isSuperAdmin ? "Yes" : "No"}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Box>
//     </DashboardManager>
//   );
// };

// export default ViewDepartment;