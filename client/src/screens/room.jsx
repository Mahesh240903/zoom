import React, { useEffect,useCallback,useState } from 'react'
import ReactPlayer from 'react-player';
import { useSocket } from '../context/SocketProvider'
import peer from '../service/peer'

const RoomPage = () => {
    const socket = useSocket();
    const [MyStream, setMyStream] = useState(null)
    const [RemoteStream, setRemoteStream] = useState(null)

    const [socketId, setsocketId] = useState(null)


    const handleUserJoined=useCallback((data)=>{
        const {email,id}=data
        console.log(`Email ${email} joined the room`);
        setsocketId(id)
    },[]);

    const handleIncomingCall = useCallback(async ({from,offer})=>{
        setsocketId(from)
        const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true})
        setMyStream(stream)
        console.log(`Incoming call`, from ,offer);
        const ans = await peer.getAnswer(offer);
        socket.emit('call:accepted',{to:from,ans})
    },[])

    const sendStreams=useCallback(()=>{
        for(const track of MyStream.getTracks()){
            peer.peer.addTrack(track,MyStream)
        }
    },[MyStream])
    const handleCallAccepted = useCallback(({from,ans})=>{
        peer.setLocalDescription(ans)
        console.log('call accepted!');
        sendStreams()
    },[sendStreams])

    const handleNegoNeeded = useCallback(async ()=>{
        const offer=await peer.getOffer();
        socket.emit("peer:nego:needed",{offer,to:socketId});
    },[socketId,socket])

    const handleNegoIncoming=useCallback(async ({from,offer})=>{
        const ans =await peer.getAnswer(offer);
        socket.emit("peer:nego:done",{to:from,ans})
    },[socket])

    const handleNegoFinal = useCallback(async ({ans})=>{
        await peer.setLocalDescription(ans)
    })

    useEffect(()=>{
        peer.peer.addEventListener('negotiationneeded',handleNegoNeeded);
        return()=>{
        peer.peer.removeEventListener('negotiationneeded',handleNegoNeeded);
        }
    },[handleNegoNeeded])


    useEffect(()=>{
        peer.peer.addEventListener('track',async ev=>{
            const remoteStream=ev.streams
            setRemoteStream(remoteStream[0])
        })
    },[])

    useEffect(()=>{
        socket.on('user:joined',handleUserJoined)
        socket.on('incoming:call',handleIncomingCall)
        socket.on('call:accepted',handleCallAccepted)
        socket.on('peer:nego:needed',handleNegoIncoming)
        socket.on('peer:nego:final',handleNegoFinal)

        return()=>{
            socket.off('user:joined',handleUserJoined)
            socket.off('incoming:call',handleIncomingCall)
            socket.off('call:accepted',handleCallAccepted)
            socket.off('peer:nego:needed',handleNegoIncoming)
            socket.off('peer:nego:final',handleNegoFinal)
        }
    },[socket,handleUserJoined,handleIncomingCall,handleCallAccepted])

    const handleCallUser = useCallback(async ()=>{
        const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true})
        const offer = await peer.getOffer();
        socket.emit("user:call",{to:socketId,offer})
        setMyStream(stream)
    },[socketId,socket])

  return (
    <div>
        RoomPage
        <h4>{socketId?"Connected":"No one in room"}</h4>
        {socketId && <button onClick={handleCallUser}>Call</button>}
        <>
        {
            MyStream && <ReactPlayer playing muted height="300px" width="500px" url={MyStream}/>
            
        }
        </>
        {MyStream && <button onClick={sendStreams}>Send Stream</button>}
        <>
        {
            RemoteStream && <ReactPlayer playing muted height="300px" width="500px" url={RemoteStream}/>
            
        }
        </>

    </div>
  )
}

export default RoomPage