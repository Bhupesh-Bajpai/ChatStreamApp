import React, { useCallback,useState } from "react";
import { useEffect } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from 'react-player'
import peer from "../services/peer";

import './RoomScreen.css'


const RoomPage = () =>{
    const socket = useSocket();

    const[remoteSocketId,setSocketId] = useState(null);
    const[myStream,setMyStream] = useState();
    const[remoteStream,setRemoteStream] = useState();

    const userhandleJoin = useCallback(({email,id})=>{
        console.log(`Email ${email} joined room`);
        setSocketId(id);
    },[])

    const handleCallUser = useCallback(async()=>{
        const stream = await navigator.mediaDevices.getUserMedia({
            audio:true,
            video : true,
        });
        
        const offer = await peer.getOffer();
        socket.emit("call:user",{to:remoteSocketId,offer})
        setMyStream(stream);
    },[socket,remoteSocketId]);

    const userHandleIncommingcall = useCallback(async({from,offer})=>{
        setSocketId(from)
        const stream = await navigator.mediaDevices.getUserMedia({
            audio:true,
            video : true,
        });
        setMyStream(stream);
        console.log(`Incomming call,from`, from ,offer); 
        const ans = await peer.getAnswer(offer)
        socket.emit("call:accepted",{to:from,ans})
    },[socket])

    const sendStreams = useCallback(() => {
        if (myStream) {
          const tracks = myStream.getTracks();
          tracks.forEach((track) => {
            const sender = peer.peer.getSenders().find((s) => s.track === track);
            if (!sender) {
              peer.peer.addTrack(track, myStream);
            }
          });
        }
      }, [myStream]);

    const userAcceptCall = useCallback(({from,ans}) => {
       peer.setLocalDescription(ans);
       sendStreams();
    },[sendStreams])

  
    const handleNegoNeeded = useCallback( async ()=>{
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed",{offer,to:remoteSocketId})
    },[remoteSocketId, socket])

    useEffect(()=>{
        peer.peer.addEventListener("negotiationneeded",handleNegoNeeded);
        return  ()=>{
            peer.peer.removeEventListener("negotiationneeded",handleNegoNeeded);
        }
    },[handleNegoNeeded])

    const userNegoNeededIncomming = useCallback( async ({from,offer})=>{
        const ans = await peer.getAnswer(offer);
        socket.emit("peer:nego:done",{to:from,ans})
    },[socket])

    const userNegoNeededFinal = useCallback(async ({ans})=>{
        await peer.setLocalDescription(ans);
    },[])

    useEffect(()=>{
        peer.peer.addEventListener('track',async (ev) =>{
            const remoteStream = ev.streams
            console.log("GOT TRACKS!!");
            setRemoteStream(remoteStream[0]);
        })
    },[])


 

    useEffect(() => {
        socket.on("user:joined",userhandleJoin)
        socket.on("incomming:call",userHandleIncommingcall)
        socket.on("call:accepted",userAcceptCall)
        socket.on("peer:nego:needed",userNegoNeededIncomming)
        socket.on("peer:nego:final",userNegoNeededFinal)


        return () =>{
            socket.off("user:joined",userhandleJoin);
            socket.off("incomming:call",userHandleIncommingcall)
            socket.off("call:accepted",userAcceptCall)
            socket.off("peer:nego:needed",userNegoNeededIncomming)
            socket.off("peer:nego:final",userNegoNeededFinal)

        }
    }, [socket,userhandleJoin,userHandleIncommingcall,userAcceptCall,userNegoNeededIncomming,userNegoNeededFinal]);

    
    return(
        <div className="mainContainer">
  <div className="contentWrapper">
    <h1>Room Screen</h1>
    <h4>{remoteSocketId ? 'Connected' : 'No User Found'}</h4>
    {myStream && <button className="btn btn-primary ms-2" onClick={sendStreams}>Send Stream</button>}
    {remoteSocketId && <button className="btn btn-primary ms-2" onClick={handleCallUser}>Call</button>}
    {myStream && (
      <>
        <h2>My Stream</h2>
        <div className="playerWrapper">
          <ReactPlayer
            url={myStream}
            playing
            muted
            height="200px"
            width="200px"
          />
        </div>
      </>
    )}
  </div>
  <div className="contentWrapper">
    {remoteStream && (
      <>
        <h2>Remote Stream</h2>
        <div className="playerWrapper">
          <ReactPlayer
            url={remoteStream}
            playing
            muted
            height="200px"
            width="200px"
          />
        </div>
      </>
    )}
  </div>
</div>

    )
}

export default RoomPage