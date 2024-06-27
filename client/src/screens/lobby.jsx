import React, {useState,useCallback, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketProvider'

const LobbyScreen = () => {
  const [email, setemail] = useState("")
  const [room, setroom] = useState("")

  const socket = useSocket()
  const navigate = useNavigate()

  const handleSubmitForm=useCallback((e)=>{
    e.preventDefault();
    socket.emit('room:join',{email,room})
  },[email,room,socket])

  const handleJoinRoom =useCallback((data)=>{
    const {email,room}=data
    navigate(`/room/${room}`)
  },[navigate])

  useEffect(() => {
    socket.on("room:join",handleJoinRoom);
    return ()=>{
      socket.off('join:room',handleJoinRoom)
    }
  }, [socket,handleJoinRoom])
  

  return (
    <div>
      <h1 className='text-red-500'>Lobby</h1>
      <form onSubmit={handleSubmitForm}>
        <label htmlFor="email">Email-Id</label>
        <input type="email" className='border border-2' id='email' value={email} onChange={(e)=>setemail(e.target.value)}/>
        <label htmlFor="room">Room</label>
        <input type="text" className='border border-2' id='room' value={room} onChange={(e)=>setroom(e.target.value)}/>
        <button>Join</button>
      </form>
    </div>
  )
}

export default LobbyScreen