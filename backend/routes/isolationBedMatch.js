const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    feature: 'Isolation Bed Match',
    summary: { patientsAwaiting: 9, negativePressureOpen: 3, cohortablePatients: 4, blockedTransfers: 2 },
    matches: [
      { patient: 'P-4418', precaution: 'airborne', unit: 'ED Hold', recommendedBed: '5N-12', reason: 'Negative pressure room available' },
      { patient: 'P-4450', precaution: 'contact', unit: 'Med Surg', recommendedBed: '3W-18', reason: 'Same organism cohort compatible' },
      { patient: 'P-4472', precaution: 'droplet', unit: 'PACU', recommendedBed: '4E-07', reason: 'Private room with shortest transfer path' }
    ],
    constraints: [
      { constraint: 'Terminal clean pending', affectedBeds: 2 },
      { constraint: 'PPE cart restock', affectedBeds: 1 },
      { constraint: 'Staffing ratio cap', affectedBeds: 3 }
    ]
  });
});

module.exports = router;
