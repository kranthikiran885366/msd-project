'use strict';
function safeReturnPath(value, clientUrl) {
  try {const base=new URL(clientUrl);const target=new URL(String(value||'/dashboard'),base);if(target.origin!==base.origin||target.username||target.password)return '/dashboard';return target.pathname+target.search;}catch{return '/dashboard';}
}
module.exports={safeReturnPath};
