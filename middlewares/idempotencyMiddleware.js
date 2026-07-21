 
 const pendingRequests = new Map ();

 export const preventDuplicatePayment = (req, res, next) => {
  const key = `${req.user._id}_${req.body.orderId}`;

  // if same user is already processing payment for same order
  if(pendingRequests.has(key)){
    return res.status(429).json({
      success: false,
      message: 'Payment is already being processed. Please wait',
    });
  }

  // Mark as processing
  pendingRequests.set(key, true);

  //Remove after 10 seconds regardless of outcome
  setTimeout(() => pendingRequests.delete(key), 10000);

  next();
 };