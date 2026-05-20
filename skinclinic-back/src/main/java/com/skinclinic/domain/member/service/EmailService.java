package com.skinclinic.domain.member.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    public void sendEmail(String email,String code){
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject("누리클리닉 이메일 인증");

        message.setText("인증번호 : " + code);

        mailSender.send(message);
    }

}
