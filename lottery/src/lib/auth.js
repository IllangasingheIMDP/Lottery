import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export function authenticate(req,allowedEmails) {
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return { error: 'Not authenticated (no cookies)', status: 401 };
    }
  
    // 2) parse it into an object: { token: '...', other: '...' }
    const cookies = cookieHeader.split(';').reduce((acc, pair) => {
      const [rawName, ...rawVal] = pair.trim().split('=');
      acc[rawName] = decodeURIComponent(rawVal.join('='));
      return acc;
    }, {});
 
  const token = cookies.token;
  
  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.gmail || !allowedEmails.includes(decoded.gmail)) {
      return { error: 'User not authorized', status: 403 };
    }
    return { user: decoded };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}