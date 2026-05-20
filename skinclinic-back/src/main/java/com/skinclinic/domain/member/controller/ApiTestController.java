package com.skinclinic.domain.member.controller;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class ApiTestController {
    @GetMapping("/api/hello")
    public Map<String,String> hello(){
        return Map.of("message","Spring Boot 연결 성공!");
    }

}
