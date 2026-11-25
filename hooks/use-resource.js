'use client';
import { useCallback,useEffect,useRef,useState } from 'react';
export function useResource(load, interval=0) {
 const generation=useRef(0); const [state,setState]=useState({data:null,error:null,loading:true});
 const refresh=useCallback(async()=>{const current=++generation.current;try{const data=await load();if(current===generation.current)setState({data,error:null,loading:false});}catch(error){if(current===generation.current)setState(s=>({...s,error,loading:false}));}},[load]);
 useEffect(()=>{setState({data:null,error:null,loading:true});refresh();const timer=interval?setInterval(refresh,interval):null;return()=>{generation.current++;if(timer)clearInterval(timer);};},[refresh,interval]);
 return {...state,refresh};
}
