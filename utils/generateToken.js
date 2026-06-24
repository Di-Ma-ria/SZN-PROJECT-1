import jwt from 'jsonwebtoken';

// return a promise so callers can `await` token genration

 const generateToken = (payload, expiresIn = '1h') => {
  const secret = process.env.JWT_SECRET;

  if(!secret) throw new Error ('JWT_SECRET required')
    return new Promise((resolve, reject) => {
  jwt.sign(payload, secret, {expiresIn}, (err, token) => {
    if(err) return reject (err);
    resolve(token);
  });
});
};

export default generateToken;