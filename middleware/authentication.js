
const authChat = (req, res, next) => {
    const { nameChat, mounth, day, hour, minutes } = req.body;
    const now = new Date();
    const userTime = new Date(now.getFullYear(), mounth -1, day, hour, minutes);
    if ((userTime.getTime() < now.getTime()) || !(req.chatNames.includes(nameChat))) {
      res.status(500).json({message : 'Invalid Time or chat name'})
      return;
    } else{
        next()
    }
    
  };

module.exports = {authChat} 