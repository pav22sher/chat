package com.example.chatservice.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageDto {
    String senderName;
    String receiverName;
    String message;
    String date;
    StatusEnum status;
}
