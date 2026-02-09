import { authService } from './auth.service.js';

function signup(req, res) {
  try {
    const userData = req.body;
    
    const result = authService.signup(userData);
    
    return res.status(201).json({
      success: true,
      message: 'User signed up successfully',
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Signup failed'
    });
  }
}

function login(req, res) {
  try {
    const { email, password } = req.body;
    
    const result = authService.login(email, password);
    
    return res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
}

export { signup, login };
