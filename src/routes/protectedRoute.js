const auth = require('../middleware/auth');

router.get('/protected-route', auth, (req, res) => {
    // Only authenticated users can access this route
    res.json({ message: "This is a protected route", userId: req.user.id });
}); 