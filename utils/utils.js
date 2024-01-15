const errors = require('../exceptions/api-error');
const SteamID = require('steamid')
exports.shuffleArray = function (arr) {
    return arr.map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
}

exports.getNameTag = function(fullTag){

    try{
    const stringWithoutFirst11 = fullTag.substring(12);
    const stringWithoutLast2 = stringWithoutFirst11.slice(0, -2);
    return stringWithoutLast2;
    }

    catch(er){
        throw er;
    }

}

exports.tradeURLverify = (id64, tradeURL) => {
  try{
  const regex = /https?:\/\/steamcommunity.com\/tradeoffer\/new\/\?partner=(\d+)&token=(.{8})$/;
  const val = regex.test(tradeURL);
  const urlObj = new URL(tradeURL);
  if(val && urlObj.searchParams.has('partner')){
    const partner = urlObj.searchParams.get('partner')
    const s = new SteamID(id64);
    if(s.accountid.toString() === partner)
    {
      return true
    }
    return false

  }
}
    catch(err){
      return false;
    }
    return false;
};

exports.getStickers = (htmlContent, callback) => {
    try{
    const srcRegex = /src="([^"]+)"/g;
    const stickerSrcMatches = htmlContent.match(srcRegex);
    const nameRegex = /Sticker: ([^<]+)/g;
    const stickerNameMatches = htmlContent.match(nameRegex);
    const stickers = stickerNameMatches[0].replace('Sticker: ', '').split(', ');
  
    if (stickerSrcMatches && stickers) {
      const stickerData = stickerSrcMatches.map((src, index) => ({
        name: stickers[index],
        icon_img: src.replace('src="', '').replace('"', '')
      }));
      callback(null, stickerData);
    } else {
      callback(null, [] );
    }
  }
  catch(error)
    {
      callback( null, [] );
    }
  };

exports.getID64fromAccountId = (accountid) => {
  let sid = SteamID.fromIndividualAccountID(accountid);
  return sid.getSteamID64();
}