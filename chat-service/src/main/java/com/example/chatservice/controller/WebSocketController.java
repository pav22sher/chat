package com.example.chatservice.controller;

import com.example.chatservice.dto.MessageDto;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Controller
public class WebSocketController {
    SimpMessagingTemplate simpMessagingTemplate;

    @MessageMapping("/public-message")
    public MessageDto receiveMessage(@Payload MessageDto message) {
        simpMessagingTemplate.convertAndSend("/public", message);
        return message;
    }

    @MessageMapping("/private-message")
    public MessageDto recMessage(@Payload MessageDto message) {
        simpMessagingTemplate.convertAndSendToUser(message.getReceiverName(), "/private", message);
        return message;
    }
}
