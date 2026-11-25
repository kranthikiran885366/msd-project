'use strict';
const {randomBytes,createHash}=require('crypto');
const OAuthGrant=require('../models/OAuthGrant');
const hash=value=>createHash('sha256').update(String(value)).digest('hex');
async function issue(user,sessionId){if(!sessionId)throw new Error('An OAuth session is required');const code=randomBytes(32).toString('base64url');await OAuthGrant.create({codeHash:hash(code),sessionHash:hash(sessionId),userId:user._id,version:user.tokenVersion||0,expiresAt:new Date(Date.now()+90000)});return code;}
async function consume(code,sessionId){if(!code||!sessionId||!/^[A-Za-z0-9_-]{43}$/.test(code))return null;return OAuthGrant.findOneAndDelete({codeHash:hash(code),sessionHash:hash(sessionId),expiresAt:{$gt:new Date()}}).lean();}
module.exports={issue,consume};
