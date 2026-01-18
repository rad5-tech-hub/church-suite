import React from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
} from "@mui/material";
import {
  Close,
  WhatsApp,
  Facebook,
  Twitter,
  Email,
  ContentCopy,
  Share as ShareIcon,
} from "@mui/icons-material";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ open, onClose }) => {
  const shareUrl = "https://churchset.com";
  const shareMessage = `Hey! 👋\n\nI've been using ChurchSet and it's been amazing for managing our church! It helps with member management, giving, events, and so much more.\n\nThought you might find it helpful too! Check it out: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = (platform: string) => {
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(shareUrl);

    const urls: { [key: string]: string } = {
      whatsapp: `https://wa.me/?text=${encodedMessage}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
      email: `mailto:?subject=${encodeURIComponent(
        "Check out ChurchSet!"
      )}&body=${encodedMessage}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank");
    }
  };

  const shareOptions = [
    { name: "WhatsApp", icon: WhatsApp, color: "#25D366", platform: "whatsapp" },
    { name: "Facebook", icon: Facebook, color: "#1877F2", platform: "facebook" },
    { name: "Twitter", icon: Twitter, color: "#1DA1F2", platform: "twitter" },
    { name: "Email", icon: Email, color: "#EA4335", platform: "email" },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: "var(--color-primary)",
          backgroundImage: "none",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2.5,
          pb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ShareIcon sx={{ color: "var(--color-text-primary)", fontSize: 24 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
              fontSize: "1.25rem",
            }}
          >
            Share ChurchSet
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "var(--color-text-muted)",
            "&:hover": { backgroundColor: "var(--color-surface)" },
          }}
        >
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, pt: 1 }}>
        {/* Warm Message */}
        <Box
          sx={{
            backgroundColor: "var(--color-surface)",
            borderRadius: 2,
            p: 2.5,
            mb: 3,
          }}
        >
          <Typography
            sx={{
              color: "var(--color-text-primary)",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            Help other churches grow! 🌟
            <br />
            Share ChurchSet with fellow church leaders and help them simplify
            their ministry management.
          </Typography>
        </Box>

        {/* Share Options */}
        <Typography
          sx={{
            color: "var(--color-text-muted)",
            fontSize: "0.875rem",
            mb: 2,
            fontWeight: 500,
          }}
        >
          Share via
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 2,
            mb: 3,
          }}
        >
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Box
                key={option.platform}
                onClick={() => handleShare(option.platform)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    backgroundColor: option.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    "&:hover": {
                      boxShadow: `0 4px 12px ${option.color}40`,
                    },
                  }}
                >
                  <Icon sx={{ color: "#fff", fontSize: 28 }} />
                </Box>
                <Typography
                  sx={{
                    color: "var(--color-text-primary)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                  }}
                >
                  {option.name}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ my: 2.5, borderColor: "var(--color-surface)" }} />

        {/* Copy Link Section */}
        <Typography
          sx={{
            color: "var(--color-text-muted)",
            fontSize: "0.875rem",
            mb: 1.5,
            fontWeight: 500,
          }}
        >
          Or copy link
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            backgroundColor: "var(--color-surface)",
            borderRadius: 2,
            p: 1.5,
          }}
        >
          <Typography
            sx={{
              flex: 1,
              color: "var(--color-text-primary)",
              fontSize: "0.875rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
            }}
          >
            {shareUrl}
          </Typography>
          <Button
            variant="contained"
            onClick={handleCopyLink}
            startIcon={<ContentCopy />}
            sx={{
              backgroundColor: "var(--color-text-primary)",
              color: "var(--color-primary)",
              textTransform: "none",
              fontWeight: 500,
              px: 2.5,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: "#363740",
              },
            }}
          >
            Copy
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;