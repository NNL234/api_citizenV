module.exports = (req,res,next)=>{
    if(req.decodedToken.role != 'B1') return res.status(403).send('access denied')
    return next()
}