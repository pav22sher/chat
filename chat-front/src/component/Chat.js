import React, {useState} from 'react'
import {over} from 'stompjs';
import SockJS from 'sockjs-client';
import './Chat.css'

let stompClient = null;
const Chat = () => {
    const [privateChats, setPrivateChats] = useState(new Map());
    const [publicChats, setPublicChats] = useState([]);
    const [tab, setTab] = useState("CHATROOM");
    const [userData, setUserData] = useState({
        username: '',
        receivername: '',
        connected: false,
        message: ''
    });

    const registerUser = () => {
        let Sock = new SockJS('http://localhost:8080/ws');
        stompClient = over(Sock);
        stompClient.connect({}, onConnected, onError);
    }

    const onConnected = () => {
        setUserData({...userData, "connected": true});
        stompClient.subscribe('/public', onPublicMsgReceived);
        stompClient.subscribe('/user/' + userData.username + '/private', onPrivateMsgReceived);
        userJoin();
    }

    const onPublicMsgReceived = (payload) => {
        let payloadData = JSON.parse(payload.body);
        switch (payloadData.status) {
            case "JOIN":
                if (!privateChats.get(payloadData.senderName)) {
                    privateChats.set(payloadData.senderName, []);
                    setPrivateChats(new Map(privateChats));
                }
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                break;
        }
    }

    const onPrivateMsgReceived = (payload) => {
        let payloadData = JSON.parse(payload.body);
        if (privateChats.get(payloadData.senderName)) {
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats));
        } else {
            let list = [];
            list.push(payloadData);
            privateChats.set(payloadData.senderName, list);
            setPrivateChats(new Map(privateChats));
        }
    }

    const userJoin = () => {
        let chatMessage = {
            senderName: userData.username,
            status: "JOIN"
        };
        stompClient.send("/app/public-message", {}, JSON.stringify(chatMessage));
    }

    const onError = (err) => {
        console.log(err);
    }

    const handleMessage = (event) => {
        const {value} = event.target;
        setUserData({...userData, "message": value});
    }

    const onPublicMsgSend = () => {
        if (stompClient) {
            let chatMessage = {
                senderName: userData.username,
                message: userData.message,
                status: "MESSAGE"
            };
            stompClient.send("/app/public-message", {}, JSON.stringify(chatMessage));
            setUserData({...userData, "message": ""});
        }
    }

    const onPrivateMsgSend = () => {
        if (stompClient) {
            let chatMessage = {
                senderName: userData.username,
                receiverName: tab,
                message: userData.message,
                status: "MESSAGE"
            };

            if (userData.username !== tab) {
                privateChats.get(tab).push(chatMessage);
                setPrivateChats(new Map(privateChats));
            }
            stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
            setUserData({...userData, "message": ""});
        }
    }

    const handleUsername = (event) => {
        const {value} = event.target;
        setUserData({...userData, "username": value});
    }

    return (
        <div className="container">
            {!userData.connected
                ? <div className="register">
                    <input
                        id="user-name"
                        placeholder="Enter your name"
                        name="userName"
                        value={userData.username}
                        onChange={handleUsername}
                        margin="normal"
                    />
                    <button type="button" onClick={registerUser}>
                        connect
                    </button>
                </div>
                : <div className="chat-box">
                    <div className="member-list">
                        <ul>
                            <li onClick={() => {
                                setTab("CHATROOM")
                            }} className={`member ${tab === "CHATROOM" && "active"}`}>Chatroom
                            </li>
                            {[...privateChats.keys()].map((name, index) => (
                                <li onClick={() => {
                                    setTab(name)
                                }} className={`member ${tab === name && "active"}`} key={index}>{name}</li>
                            ))}
                        </ul>
                    </div>
                    {tab === "CHATROOM" && <div className="chat-content">
                        <ul className="chat-messages">
                            {publicChats.map((chat, index) => (
                                <li className={`message ${chat.senderName === userData.username && "self"}`}
                                    key={index}>
                                    {chat.senderName !== userData.username &&
                                    <div className="avatar">{chat.senderName}</div>}
                                    <div className="message-data">{chat.message}</div>
                                    {chat.senderName === userData.username &&
                                    <div className="avatar self">{chat.senderName}</div>}
                                </li>
                            ))}
                        </ul>

                        <div className="send-message">
                            <input type="text" className="input-message" placeholder="enter the message"
                                   value={userData.message} onChange={handleMessage}/>
                            <button type="button" className="send-button" onClick={onPublicMsgSend}>send</button>
                        </div>
                    </div>}
                    {tab !== "CHATROOM" && <div className="chat-content">
                        <ul className="chat-messages">
                            {[...privateChats.get(tab)].map((chat, index) => (
                                <li className={`message ${chat.senderName === userData.username && "self"}`}
                                    key={index}>
                                    {chat.senderName !== userData.username &&
                                    <div className="avatar">{chat.senderName}</div>}
                                    <div className="message-data">{chat.message}</div>
                                    {chat.senderName === userData.username &&
                                    <div className="avatar self">{chat.senderName}</div>}
                                </li>
                            ))}
                        </ul>

                        <div className="send-message">
                            <input type="text" className="input-message" placeholder="enter the message"
                                   value={userData.message} onChange={handleMessage}/>
                            <button type="button" className="send-button" onClick={onPrivateMsgSend}>send</button>
                        </div>
                    </div>}
                </div>}
        </div>
    )
}

export default Chat
