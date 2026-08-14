const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// @route   PUT /api/profile
router.put('/', protect, async (req, res) => {
  const { name, mobile, address, businessName, profileImage } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.mobile = mobile || user.mobile;
    user.address = address || user.address;
    user.businessName = businessName !== undefined ? businessName : user.businessName;
    user.profileImage = profileImage !== undefined ? profileImage : user.profileImage;

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      type: user.type,
      businessName: user.businessName,
      profileImage: user.profileImage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// @route   PUT /api/profile/password
router.put('/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword; // hashed by beforeSave hook
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password' });
  }
});

module.exports = router;
