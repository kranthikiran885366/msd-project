'use strict';
const mongoose=require('mongoose');
const schema=new mongoose.Schema({codeHash:{type:String,required:true,unique:true},sessionHash:{type:String,required:true},userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},version:{type:Number,required:true},expiresAt:{type:Date,required:true}},{timestamps:true});
schema.index({expiresAt:1},{expireAfterSeconds:0});
module.exports=mongoose.model('OAuthGrant',schema);
