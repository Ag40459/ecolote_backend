const express = require("express");
const {
  processLeadsFromPython,
  checkAndGenerateLeads,
  getLeads,
  updateStatus,
  assignLead,
  getLeadById,
  startAttendance,
  endAttendance,
} = require("../controllers/leadController");
const authenticateToken  = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/process", processLeadsFromPython);
router.post("/check-and-generate", checkAndGenerateLeads);
router.get("/", getLeads);
router.put("/:leadId/status", updateStatus);
router.put("/:leadId/assign", assignLead);
router.get("/:leadId", getLeadById);
router.post("/:leadId/start-attendance", authenticateToken, startAttendance);
router.post("/:leadId/end-attendance", authenticateToken, endAttendance);


module.exports = router;
