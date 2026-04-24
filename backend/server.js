const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/beds', require('./routes/beds'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/operating-rooms', require('./routes/operatingRooms'));
app.use('/api/supplies', require('./routes/supplies'));
app.use('/api/emergency-capacity', require('./routes/emergencyCapacity'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
