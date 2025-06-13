import React from "react";
import { Grid, Card, CardContent, Typography, Button, Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import DashboardManager from "../../shared/dashboardManager";
import {QRCodeSVG} from 'qrcode.react';
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";

// Dynamic QR code data with route paths
const qrCodes = [
  {
    id: 1,
    title: "Follow Up Registration",
    description: "Scan to register for follow-up sessions",
    path: "/followups", // Will be appended to your base URL
    scanCount: 124
  },
  {
    id: 2,
    title: "Members Registration",
    description: "Scan to register as a church member",
    path: "/members"
  },
  {
    id: 3,
    title: "Attendance Form",
    description: "Scan to submit your Member attendance ",
    path: "/attendance" 
  },
  {
    id: 4,
    title: "Donation Portal",
    description: "Scan to make a donation to our ministry",
    path: "/donate"
  }
];

const StyledCard = styled(Card)(({ theme }) => ({
  transition: "transform 0.3s, box-shadow 0.3s",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  '&:hover': {
    transform: "translateY(-5px)",
    boxShadow: theme.shadows[6]
  }
}));

const QrCode: React.FC = () => {
  // Get the current base URL
  const baseUrl = window.location.origin;

  const authData = useSelector((state: RootState) => state.auth?.authData);//auth storage to get churchid and branchID
  const branchId = authData?.branchId ? `&branchId=${authData.branchId}` : "";
  const churchId = `?churchId=${authData?.churchId}`

  const downloadQRCode = (title: string, qrId: number) => {
    // Find the SVG element
    const svg = document.getElementById(`qr-${qrId}`)?.querySelector('svg');
    if (!svg) return;

    // Create a clone of the SVG to modify
    const svgClone = svg.cloneNode(true) as SVGElement;
    
    // Set white background
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("fill", "white");
    svgClone.insertBefore(rect, svgClone.firstChild);

    // Serialize the SVG to XML
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgClone);

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create image
    const img = new Image();
    img.onload = () => {
      // Set canvas size and draw image
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white"; // Fill background white
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Convert to PNG and trigger download
      const png = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${title.replace(/\s+/g, '_')}_qrcode.png`;
      downloadLink.href = png;
      downloadLink.click();
    };

    // Set image source
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
  };

  return (
    <DashboardManager>
      <Box sx={{ p: 3 }}>
        <Typography              
          component="h1"
          fontWeight={600}
          gutterBottom
          sx={{                       
            fontSize:  "1.5rem",
          }}
        >
          QR Code Dashboard
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: "0.8125rem"
          }}
          paragraph
        >
          Create and manage Admins for your church.
        </Typography>

        <Grid container spacing={3}>
          {qrCodes.map((qr) => {
            const fullUrl = `${baseUrl}${qr.path}${churchId}${branchId}`;
            return (
              <Grid size={{xs:12, sm:6, md:3}} key={qr.id}>
                <StyledCard>
                  <Box 
                    id={`qr-${qr.id}`}
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      justifyContent: 'center',
                      backgroundColor: 'white',
                      height: 200
                    }}
                  >
                    <QRCodeSVG
                      value={fullUrl}
                      size={180}
                      level="H" // High error correction
                      fgColor="#2e3a47"
                      bgColor="white"
                      includeMargin={true}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div">
                      {qr.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {qr.description}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto" }}>
                      <Typography variant="caption" color="text.secondary">                        
                      </Typography>
                      <Button 
                        size="small" 
                        variant="contained"
                        onClick={() => downloadQRCode(qr.title, qr.id)}
                        sx={{                        
                          bgcolor: "var(--color-primary)",              
                          borderRadius: 1,
                          fontWeight: "semibold",
                          color: "var(--color-text-on-primary)", // Ensure text color is set correctly
                          textTransform: "none",
                          fontSize: { xs: "1rem", sm: "1rem" },
                          "&:hover": { bgcolor: 'var(--color-primary)' },
                        }}                        
                      >
                        Download
                      </Button>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </DashboardManager>
  );
};

export default QrCode; 