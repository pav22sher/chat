import React, {useState} from 'react'
import {over} from 'stompjs';
import SockJS from 'sockjs-client';
import {Button, Form, Input, List, Menu} from "antd";
import './Chat2.css'
import Layout, {Content, Footer, Header} from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import {UserOutlined} from "@ant-design/icons";

let stompClient = null;

const Chat2 = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [privateChats, setPrivateChats] = useState(new Map());
    const [publicChats, setPublicChats] = useState([]);
    const [tab, setTab] = useState();
    const [userData, setUserData] = useState({
        username: '',
        receivername: '',
        connected: false,
        message: ''
    });

    const handleUsername = (event) => {
        const {value} = event.target;
        setUserData({...userData, "username": value});
    }

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

    const onMsgSend = () => {
        if (stompClient && tab) {
            let chatMessage = {
                senderName: userData.username,
                message: userData.message,
                status: "MESSAGE"
            };
            let url;
            if (tab === 'Broadcast') {
                url = "/app/public-message";
            } else {
                url = "/app/private-message";
                chatMessage.receiverName = tab;
                if (userData.username !== tab) {
                    privateChats.get(tab).push(chatMessage);
                    setPrivateChats(new Map(privateChats));
                }
            }
            stompClient.send(url, {}, JSON.stringify(chatMessage));
            setUserData({...userData, "message": ""});
        }
    };

    const items = () => {
        let items = [];
        items.push({
            key: '0', label: 'Broadcast', icon: <UserOutlined/>, onClick: () => {
                setTab('Broadcast')
            }
        });
        [...privateChats.keys()].forEach((name, index) => {
            items.push({
                key: index + 1, label: name, icon: <UserOutlined/>, onClick: () => {
                    setTab(name);
                }
            });
        });
        return items;
    };

    const data = () => {
        let data = [];
        if (tab) {
            let messages;
            if (tab === 'Broadcast') {
                messages = publicChats;
            } else {
                messages = [...privateChats.get(tab)];
            }
            messages.forEach((chat) => {
                let self = chat.senderName === userData.username;
                data.push({
                    title: chat.senderName,
                    description: chat.message,
                    style: {
                        textAlign: self ? 'left' : 'right',
                        backgroundColor: self ? 'white' : 'ghostwhite'
                    }
                });
            });
        }
        return data;
    };

    return (
        <div className="container">
            {!userData.connected
                ?
                <div className="form-container">
                    <Form
                        name="basic"
                        layout="inline"
                        onFinish={registerUser}
                    >
                        <Form.Item
                            label="Username"
                            name="userName"
                            value={userData.username}
                            onChange={handleUsername}
                            rules={[{required: true, message: 'Please input your username!'}]}
                        >
                            <Input/>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                connect
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
                :
                <Layout style={{minHeight: '100vh'}}>
                    <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                        <Menu theme="dark" items={items()}/>
                    </Sider>
                    <Layout>
                        <Header style={{backgroundColor: "white"}}>
                            {tab}
                        </Header>
                        <Content>
                            <List
                                itemLayout="horizontal"
                                dataSource={data()}
                                renderItem={(item) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            style={item.style}
                                            title={item.title}
                                            description={item.description}
                                        />
                                    </List.Item>
                                )}
                            />
                        </Content>
                        <Footer>
                            <Form
                                name="basic"
                                layout="inline"
                            >
                                <Form.Item
                                    label="Message"
                                    name="message"
                                    onChange={handleMessage}
                                    value={userData.message}
                                >
                                    <Input/>
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit" onClick={onMsgSend}>
                                        send
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Footer>
                    </Layout>
                </Layout>}
        </div>
    )
}

export default Chat2
