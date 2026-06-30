import jwt from 'jsonwebtoken';


// return a promise so callers can `await` token genration

 const generateAccessToken = (payload, expiresIn =process.env.JWT_EXPIRES_IN || '10m') => {


  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET required');
  
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, {expiresIn}, (err, token) => {
      if (err) return reject(err);
      resolve(token);
    });
  });
};

const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET required');
  
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }, (err, token) => {
      if (err) return reject(err);
      resolve(token);
    });
  });
};

export { generateAccessToken, generateRefreshToken };