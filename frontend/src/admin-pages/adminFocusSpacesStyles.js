export const glassPaperSx = {
  bgcolor: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
  p: 2,
};

export const glassDialogSx = {
  "& .MuiBackdrop-root": {
    backdropFilter: "blur(4px)",
    bgcolor: "rgba(0,0,0,0.55)",
  },
  "& .MuiDialog-paper": {
    bgcolor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "16px",
    backgroundImage: "none",
    boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
  },
};

export const glassAlertSx = {
  mb: 3,
  bgcolor: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#e5e7eb",
  "& .MuiAlert-icon": { color: "#c084fc" },
};

export const fieldSx = {
  "& .MuiInputLabel-root": { color: "#d1d5db" },
  "& .MuiOutlinedInput-root": {
    color: "white",
    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
    "&.Mui-focused fieldset": { borderColor: "#a855f7" },
  },
  "& .MuiFormHelperText-root": { color: "#9ca3af" },
};

export const selectSx = {
  color: "white",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.35)" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#a855f7" },
  "& .MuiSvgIcon-root": { color: "#d1d5db" },
};

export const primaryBtnSx = {
  bgcolor: "#9333ea",
  color: "white",
  fontWeight: 600,
  boxShadow: 2,
  "&:hover": { bgcolor: "#7e22ce" },
};

export const secondaryBtnSx = {
  bgcolor: "#4b5563",
  color: "white",
  fontWeight: 600,
  "&:hover": { bgcolor: "#374151" },
};

export const tabSx = {
  mb: 2,
  "& .MuiTab-root": { color: "#9ca3af", textTransform: "none", fontWeight: 500 },
  "& .Mui-selected": { color: "#e9d5ff" },
  "& .MuiTabs-indicator": { bgcolor: "#a855f7" },
};

export const headCellSx = { color: "#9ca3af", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" };

export const disabledRowSx = { opacity: 0.45 };
